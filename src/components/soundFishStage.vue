<script setup lang="ts">
import gsap from 'gsap'
import { Application, Circle, Container, FillGradient, Graphics, Rectangle, Text } from 'pixi.js'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { wordEmoji } from '../data/phonicsFamily'

const props = defineProps<{
  words: string[]
  caught: string[]
  locked: boolean
  listening: boolean
}>()

const emit = defineEmits<{
  tap: [word: string]
  hear: [word: string]
}>()

type FishMark = {
  word: string
  node: Container
  body: Graphics
  speaker: Container
  lane: number
  color: number
  caught: boolean
}

const host = ref<HTMLElement | null>(null)
const palette = [0xff8a65, 0x8b7cf6, 0x4caf7a, 0xffc56d, 0x3db8c7]

let app: Application | null = null
let dead = false
let bg: Graphics | null = null
let deco: Container | null = null
let bucket: Container | null = null
let hookLine: Graphics | null = null
let hookIcon: Text | null = null
let observer: ResizeObserver | null = null
const marks: FishMark[] = []

function emojiFont(size: number) {
  return {
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    fontSize: size,
  }
}

function paintPond(width: number, height: number) {
  if (!bg) return
  const water = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: '#9ee4ef' },
      { offset: 0.55, color: '#3db8c7' },
      { offset: 1, color: '#2a9aa8' },
    ],
  })
  bg.clear()
  bg.rect(0, 0, width, height)
  bg.fill(water)
  bg.ellipse(width * 0.28, height + 10, width * 0.5, 34)
  bg.fill({ color: 0x1d7a86, alpha: 0.16 })
  bg.ellipse(width * 0.78, height + 6, width * 0.42, 28)
  bg.fill({ color: 0x1d7a86, alpha: 0.12 })
}

function paintDeco(width: number, height: number) {
  if (!deco) return
  deco.removeChildren()
  const cat = new Text({ text: '🐱', style: emojiFont(34) })
  cat.anchor.set(0.5)
  cat.position.set(width - 36, 34)
  const reed = new Text({ text: '🌿', style: emojiFont(28) })
  reed.anchor.set(0.5)
  reed.position.set(28, height - 28)
  const lily = new Text({ text: '🪷', style: emojiFont(26) })
  lily.anchor.set(0.5)
  lily.position.set(width - 42, height - 30)
  deco.addChild(cat, reed, lily)
}

function bucketPoint(width: number) {
  return { x: width * 0.5, y: 52 }
}

function paintBucket() {
  const netBox = bucket
  if (!netBox || !app) return
  netBox.removeChildren()
  const { width } = app.screen
  const point = bucketPoint(width)
  netBox.position.set(point.x, point.y)
  const barW = Math.min(width - 28, 360)

  const bowl = new Graphics()
  bowl.roundRect(-barW / 2, -18, barW, 58, 20)
  bowl.fill({ color: 0xffe27a, alpha: 0.96 })
  bowl.roundRect(-barW / 2, -18, barW, 58, 20)
  bowl.stroke({ color: 0xf4b400, width: 3, alpha: 0.9 })
  const net = new Text({ text: '🧺', style: emojiFont(30) })
  net.anchor.set(0.5)
  net.position.set(-barW / 2 + 28, 10)
  const title = new Text({
    text: 'net',
    style: { fontFamily: 'Fredoka, "PingFang SC", sans-serif', fontSize: 16, fill: 0x4a2808, fontWeight: '700' },
  })
  title.anchor.set(0, 0.5)
  title.position.set(-barW / 2 + 48, 10)
  netBox.addChild(bowl, net, title)

  const caughtWords = marks.filter((item) => item.caught).map((item) => item.word)
  caughtWords.forEach((word, index) => {
    const chip = new Container()
    const bgChip = new Graphics()
    bgChip.roundRect(-32, -16, 64, 32, 16)
    bgChip.fill({ color: 0xffffff, alpha: 0.95 })
    const label = new Text({
      text: word,
      style: {
        fontFamily: 'Fredoka, "PingFang SC", sans-serif',
        fontSize: 16,
        fill: 0x0e4b6b,
        fontWeight: '700',
      },
    })
    label.anchor.set(0.5)
    chip.addChild(bgChip, label)
    chip.position.set(-barW / 2 + 128 + index * 72, 10)
    netBox.addChild(chip)
  })
}

function paintFishBody(disc: Graphics, color: number, glow: boolean) {
  disc.clear()
  disc.ellipse(-6, 8, 62, 34)
  disc.fill({ color: 0x0e505a, alpha: 0.16 })
  disc.ellipse(0, 0, 62, 34)
  disc.fill({ color, alpha: glow ? 1 : 0.96 })
  disc.poly([58, 0, 86, -22, 86, 22])
  disc.fill({ color, alpha: glow ? 1 : 0.96 })
  disc.circle(-18, -10, 8)
  disc.fill({ color: 0xffffff, alpha: 0.42 })
}

function restyle() {
  for (const mark of marks) {
    paintFishBody(mark.body, mark.color, props.listening && !mark.caught)
  }
}

function laneY(height: number, lane: number) {
  const rows = [0.38, 0.58, 0.78]
  return height * (rows[lane % rows.length] ?? 0.58)
}

function startSwim(mark: FishMark) {
  if (!app || mark.caught) return
  const { width, height } = app.screen
  const left = 78
  const right = Math.max(left + 40, width - 78)
  const dest = mark.node.x > (left + right) / 2 ? left : right
  const dist = Math.abs(dest - mark.node.x)
  gsap.killTweensOf(mark.node)
  gsap.to(mark.node, {
    x: dest,
    y: laneY(height, mark.lane) + (dest > mark.node.x ? -6 : 6),
    duration: Math.max(2.4, dist / 58),
    ease: 'sine.inOut',
    onComplete: () => startSwim(mark),
  })
}

function placeFish() {
  if (!app) return
  const { width, height } = app.screen
  if (width < 8 || height < 8) return
  paintPond(width, height)
  paintDeco(width, height)
  paintBucket()
  marks.forEach((mark, index) => {
    if (mark.caught) {
      mark.node.visible = false
      return
    }
    mark.node.visible = true
    const x = width * (0.22 + (index % 3) * 0.28)
    const y = laneY(height, mark.lane)
    mark.node.position.set(x, y)
    startSwim(mark)
  })
}

function clearMarks() {
  for (const mark of marks) {
    gsap.killTweensOf(mark.node)
    gsap.killTweensOf(mark.node.scale)
    mark.node.destroy({ children: true })
  }
  marks.length = 0
}

function makeFish(word: string, index: number): FishMark {
  const color = palette[index % palette.length]
  const node = new Container()
  const body = new Graphics()
  paintFishBody(body, color, false)
  const art = new Text({ text: wordEmoji(word), style: emojiFont(26) })
  art.anchor.set(0.5)
  art.position.set(-28, -2)
  const label = new Text({
    text: word,
    style: {
      fontFamily: 'Fredoka, "PingFang SC", sans-serif',
      fontSize: 28,
      fontWeight: '700',
      fill: 0xffffff,
    },
  })
  label.anchor.set(0.5)
  label.position.set(10, -1)
  const speaker = new Container()
  const speakerDisc = new Graphics()
  speakerDisc.circle(0, 0, 18)
  speakerDisc.fill({ color: 0xffffff, alpha: 0.96 })
  speakerDisc.circle(0, 0, 18)
  speakerDisc.stroke({ color: 0x0e4b6b, width: 2, alpha: 0.2 })
  const speakerIcon = new Text({
    text: '♪',
    style: { fontFamily: 'Fredoka, sans-serif', fontSize: 18, fill: 0x0e4b6b, fontWeight: '700' },
  })
  speakerIcon.anchor.set(0.5)
  speaker.addChild(speakerDisc, speakerIcon)
  speaker.position.set(48, 28)
  speaker.eventMode = 'static'
  speaker.cursor = 'pointer'
  speaker.hitArea = new Circle(0, 0, 22)
  speaker.on('pointertap', (event) => {
    event.stopPropagation()
    if (props.locked) return
    const mark = marks.find((item) => item.word === word)
    if (!mark || mark.caught) return
    emit('hear', word)
  })

  node.addChild(body, art, label, speaker)
  node.eventMode = 'static'
  node.cursor = 'pointer'
  node.hitArea = new Rectangle(-72, -40, 168, 92)
  node.on('pointertap', (event) => {
    event.stopPropagation()
    if (props.locked) return
    const mark = marks.find((item) => item.word === word)
    if (!mark || mark.caught) return
    emit('tap', word)
  })
  app?.stage.addChild(node)
  return { word, node, body, speaker, lane: index, color, caught: props.caught.includes(word) }
}

function rebuildMarks() {
  if (!app) return
  clearMarks()
  props.words.forEach((word, index) => {
    marks.push(makeFish(word, index))
  })
  if (hookLine) app.stage.addChild(hookLine)
  if (hookIcon) app.stage.addChild(hookIcon)
  if (bucket) app.stage.addChild(bucket)
  placeFish()
}

function hideHook() {
  if (hookLine) hookLine.visible = false
  if (hookIcon) hookIcon.visible = false
}

function drawHook(x: number, fromY: number, toY: number) {
  if (!hookLine || !hookIcon) return
  hookLine.visible = true
  hookIcon.visible = true
  hookLine.clear()
  hookLine.moveTo(x, fromY)
  hookLine.lineTo(x, toY)
  hookLine.stroke({ width: 3, color: 0x4a2808, alpha: 0.85 })
  hookIcon.position.set(x, toY)
}

function liftFish(word: string): Promise<void> {
  const mark = marks.find((item) => item.word === word)
  if (!mark || mark.caught || !app) return Promise.resolve()
  mark.caught = true
  mark.node.eventMode = 'none'
  mark.speaker.eventMode = 'none'
  gsap.killTweensOf(mark.node)
  gsap.killTweensOf(mark.node.scale)

  const { width } = app.screen
  const dest = bucketPoint(width)
  const startX = mark.node.x
  const startY = mark.node.y
  const topY = 8
  const hook = { y: topY }

  return new Promise((resolve) => {
    drawHook(startX, topY, hook.y)
    const tl = gsap.timeline({
      onComplete: () => {
        hideHook()
        mark.node.visible = false
        mark.node.scale.set(1)
        paintBucket()
        resolve()
      },
    })
    tl.to(hook, {
      y: startY - 36,
      duration: 0.28,
      ease: 'power2.in',
      onUpdate: () => drawHook(startX, topY, hook.y),
    })
    tl.to(mark.node.scale, { x: 1.12, y: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'back.out(2)' }, '>-0.02')
    tl.to(
      mark.node,
      {
        x: dest.x + 18,
        y: dest.y + 8,
        duration: 0.55,
        ease: 'power2.inOut',
        onUpdate: () => drawHook(mark.node.x, topY, mark.node.y - 28),
      },
      '>-0.04',
    )
    tl.to(mark.node.scale, { x: 0.22, y: 0.22, duration: 0.18, ease: 'power1.in' }, '>-0.08')
  })
}

function nudgeRemaining() {
  for (const mark of marks) {
    if (mark.caught) continue
    const start = mark.node.x
    gsap.fromTo(
      mark.node,
      { x: start - 7 },
      {
        x: start + 7,
        duration: 0.06,
        yoyo: true,
        repeat: 5,
        ease: 'power1.inOut',
        onComplete: () => {
          if (!mark.caught) mark.node.x = start
        },
      },
    )
  }
}

function layout() {
  if (!app) return
  const { width, height } = app.screen
  if (width < 8 || height < 8) return
  paintPond(width, height)
  paintDeco(width, height)
  paintBucket()
  for (const mark of marks) {
    if (mark.caught) {
      mark.node.visible = false
      continue
    }
    mark.node.y = laneY(height, mark.lane)
    if (mark.node.x < 70) mark.node.x = 70
    if (mark.node.x > width - 70) mark.node.x = width - 70
    startSwim(mark)
  }
}

async function waitForBox(el: HTMLElement) {
  await nextTick()
  for (let i = 0; i < 24; i += 1) {
    if (el.clientWidth >= 120 && el.clientHeight >= 160) return
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}

async function boot() {
  const el = host.value
  if (!el) return
  await waitForBox(el)
  if (dead) return
  const stage = new Application()
  await stage.init({
    width: Math.max(el.clientWidth, 280),
    height: Math.max(el.clientHeight, 280),
    background: '#3db8c7',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  })
  if (dead) {
    stage.destroy(true, true)
    return
  }
  app = stage
  el.appendChild(stage.canvas)
  stage.canvas.style.touchAction = 'none'
  stage.canvas.style.display = 'block'

  bg = new Graphics()
  stage.stage.addChild(bg)
  deco = new Container()
  deco.eventMode = 'none'
  stage.stage.addChild(deco)

  hookLine = new Graphics()
  hookLine.eventMode = 'none'
  hookIcon = new Text({ text: '🪝', style: emojiFont(28) })
  hookIcon.anchor.set(0.5)
  hookIcon.eventMode = 'none'
  hideHook()

  bucket = new Container()
  bucket.eventMode = 'none'

  rebuildMarks()

  observer = new ResizeObserver(() => {
    if (!app || !host.value) return
    const width = host.value.clientWidth
    const height = host.value.clientHeight
    if (width < 8 || height < 8) return
    app.renderer.resize(width, height)
    layout()
  })
  observer.observe(el)
}

onMounted(() => {
  void boot()
})

onUnmounted(() => {
  dead = true
  observer?.disconnect()
  observer = null
  hideHook()
  clearMarks()
  deco = null
  bg = null
  bucket = null
  hookLine = null
  hookIcon = null
  app?.destroy(true, true)
  app = null
})

watch(
  () => props.words.join('|'),
  () => {
    if (app) rebuildMarks()
  },
)

watch(
  () => props.listening,
  () => restyle(),
)

watch(
  () => props.caught.join('|'),
  () => {
    for (const word of props.caught) {
      const mark = marks.find((item) => item.word === word)
      if (!mark || mark.caught) continue
      mark.caught = true
      gsap.killTweensOf(mark.node)
      mark.node.visible = false
      mark.node.eventMode = 'none'
    }
    paintBucket()
  },
)

defineExpose({ liftFish, nudgeRemaining })
</script>

<template>
  <div ref="host" class="pond" />
</template>

<style scoped>
.pond {
  position: relative;
  flex: 1;
  min-height: 280px;
  margin: 8px -6px;
  border-radius: 36px;
  overflow: hidden;
  background: linear-gradient(180deg, #9ee4ef 0%, #3db8c7 55%, #2a9aa8 100%);
  box-shadow: inset 0 -18px 0 rgba(14, 80, 90, 0.12);
}

.pond :deep(canvas) {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
