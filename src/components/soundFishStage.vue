<script setup lang="ts">
import gsap from 'gsap'
import { Application, Circle, Container, FillGradient, Graphics, Text } from 'pixi.js'
import { onMounted, onUnmounted, ref, watch } from 'vue'

export type PondBubble = {
  letter: string
  correct: boolean
  key: string
}

const props = defineProps<{
  bubbles: PondBubble[]
  highlight: string
  shaking: string
  locked: boolean
  demoing: boolean
  celebrating: boolean
}>()

const emit = defineEmits<{
  tap: [bubble: PondBubble]
}>()

type BubbleMark = {
  bubble: PondBubble
  node: Container
  disc: Graphics
  base: { x: number; y: number }
}

const host = ref<HTMLElement | null>(null)

let app: Application | null = null
let dead = false
let bg: Graphics | null = null
let deco: Container | null = null
let observer: ResizeObserver | null = null
const marks: BubbleMark[] = []

const slots = [
  (width: number, height: number) => ({ x: width * 0.22, y: height * 0.42 }),
  (width: number, height: number) => ({ x: width * 0.78, y: height * 0.32 }),
  (width: number, height: number) => ({ x: width * 0.5, y: height * 0.72 }),
]

function paintPond(width: number, height: number) {
  if (!bg) return
  const water = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: '#7fd8e8' },
      { offset: 0.7, color: '#3db8c7' },
      { offset: 1, color: '#2a9aa8' },
    ],
  })
  bg.clear()
  bg.rect(0, 0, width, height)
  bg.fill(water)
  bg.ellipse(width * 0.3, height + 8, width * 0.55, 36)
  bg.fill({ color: 0x1d7a86, alpha: 0.18 })
  bg.ellipse(width * 0.75, height + 4, width * 0.4, 28)
  bg.fill({ color: 0x1d7a86, alpha: 0.14 })
}

function paintDeco(width: number) {
  if (!deco) return
  deco.removeChildren()
  const fish = new Text({
    text: '🐠',
    style: { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: 42 },
  })
  fish.anchor.set(0.5)
  fish.position.set(36, 36)
  const cat = new Text({
    text: '🐱',
    style: { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: 36 },
  })
  cat.anchor.set(0.5)
  cat.position.set(width - 36, 36)
  deco.addChild(fish, cat)
}

function discColor(bubble: PondBubble): number {
  if (props.highlight === bubble.letter) return 0xffe27a
  if (props.celebrating && bubble.correct) return 0xc8f5d4
  return 0xffffff
}

function paintDisc(disc: Graphics, color: number) {
  disc.clear()
  disc.circle(0, 6, 48)
  disc.fill({ color: 0x0e505a, alpha: 0.16 })
  disc.circle(0, 0, 48)
  disc.fill({ color, alpha: 0.96 })
  disc.circle(-14, -14, 11)
  disc.fill({ color: 0xffffff, alpha: 0.38 })
}

function restyle() {
  for (const mark of marks) {
    paintDisc(mark.disc, discColor(mark.bubble))
  }
}

function shakeLetter(letter: string) {
  const mark = marks.find((item) => item.bubble.letter === letter)
  if (!mark) return
  const start = mark.base.x
  gsap.fromTo(
    mark.node,
    { x: start - 8 },
    {
      x: start + 8,
      duration: 0.06,
      yoyo: true,
      repeat: 7,
      ease: 'power1.inOut',
      onComplete: () => {
        mark.node.x = start
      },
    },
  )
}

function pulseLetter(letter: string) {
  const mark = marks.find((item) => item.bubble.letter === letter)
  if (!mark) return
  gsap.fromTo(
    mark.node.scale,
    { x: 1, y: 1 },
    { x: 1.14, y: 1.14, duration: 0.22, yoyo: true, repeat: 3, ease: 'power1.inOut' },
  )
}

function placeBubbles() {
  if (!app) return
  const { width, height } = app.screen
  if (width < 8 || height < 8) return
  paintPond(width, height)
  paintDeco(width)
  marks.forEach((mark, index) => {
    const point = (slots[index] ?? slots[0])(width, height)
    mark.base = point
    mark.node.position.set(point.x, point.y)
    gsap.killTweensOf(mark.node)
    gsap.to(mark.node, {
      y: point.y - 8,
      duration: 1.5,
      delay: index * 0.18,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
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

function rebuildMarks() {
  if (!app) return
  clearMarks()
  for (const bubble of props.bubbles) {
    const node = new Container()
    const disc = new Graphics()
    paintDisc(disc, discColor(bubble))
    const label = new Text({
      text: bubble.letter,
      style: {
        fontFamily: 'Fredoka, "PingFang SC", sans-serif',
        fontSize: 44,
        fontWeight: '700',
        fill: 0x0e4b6b,
      },
    })
    label.anchor.set(0.5)
    node.addChild(disc, label)
    node.eventMode = 'static'
    node.cursor = 'pointer'
    node.hitArea = new Circle(0, 0, 52)
    node.on('pointertap', (event) => {
      event.stopPropagation()
      if (props.locked || props.demoing) return
      emit('tap', bubble)
    })
    app.stage.addChild(node)
    marks.push({ bubble, node, disc, base: { x: 0, y: 0 } })
  }
  placeBubbles()
}

function layout() {
  if (!app) return
  const { width, height } = app.screen
  if (width < 8 || height < 8) return
  paintPond(width, height)
  paintDeco(width)
  placeBubbles()
}

async function boot() {
  const el = host.value
  if (!el) return
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
  clearMarks()
  deco = null
  bg = null
  app?.destroy(true, true)
  app = null
})

watch(
  () => props.bubbles.map((item) => item.key).join('|'),
  () => {
    if (app) rebuildMarks()
  },
)

watch(
  () => [props.highlight, props.celebrating] as const,
  ([letter]) => {
    restyle()
    if (letter) pulseLetter(letter)
  },
)

watch(
  () => props.shaking,
  (letter) => {
    if (letter) shakeLetter(letter)
  },
)
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
  background: linear-gradient(180deg, #7fd8e8 0%, #3db8c7 70%, #2a9aa8 100%);
  box-shadow: inset 0 -18px 0 rgba(14, 80, 90, 0.12);
}

.pond :deep(canvas) {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
