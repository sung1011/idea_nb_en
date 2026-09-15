<script setup lang="ts">
import gsap from 'gsap'
import { Application, Circle, Container, FillGradient, Graphics, Rectangle, Text } from 'pixi.js'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const props = defineProps<{
  found: string[]
  locked: boolean
}>()

const emit = defineEmits<{
  find: [word: string]
  miss: []
}>()

type Marker = {
  word?: string
  node: Container
  glow: Graphics
  spark: Text
  place: (width: number, height: number) => { x: number; y: number }
  baseY: number
}

const host = ref<HTMLElement | null>(null)
const family = getCurrentFamily()

let app: Application | null = null
let dead = false
let bg: Graphics | null = null
let observer: ResizeObserver | null = null
const markers: Marker[] = []

function paintBackground(width: number, height: number) {
  if (!bg) return
  const sky = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: '#7ec8e3' },
      { offset: 0.58, color: '#d7f4c2' },
      { offset: 1, color: '#b8e986' },
    ],
  })
  bg.clear()
  bg.rect(0, 0, width, height)
  bg.fill(sky)
  bg.roundRect(-20, height - 54, width + 40, 70, 36)
  bg.fill({ color: 0x7dce7f })
  bg.hitArea = new Rectangle(0, 0, width, height)
}

function startBob(marker: Marker) {
  gsap.killTweensOf(marker.node)
  if (marker.word && props.found.includes(marker.word)) {
    marker.node.y = marker.baseY
    return
  }
  gsap.to(marker.node, {
    y: marker.baseY - 7,
    duration: 1.6 + (marker.word ? 0.2 : 0),
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })
}

function layout() {
  if (!app) return
  const { width, height } = app.screen
  if (width < 8 || height < 8) return
  paintBackground(width, height)
  for (const marker of markers) {
    const point = marker.place(width, height)
    marker.baseY = point.y
    marker.node.position.set(point.x, point.y)
    startBob(marker)
  }
}

function markFound(word: string) {
  const marker = markers.find((item) => item.word === word)
  if (!marker || marker.spark.visible) return
  marker.glow.visible = true
  marker.spark.visible = true
  marker.node.eventMode = 'none'
  gsap.killTweensOf(marker.node)
  marker.node.y = marker.baseY
  gsap.fromTo(
    marker.node.scale,
    { x: 1, y: 1 },
    { x: 1.18, y: 1.18, duration: 0.24, yoyo: true, repeat: 1, ease: 'back.out(2)' },
  )
}

function shake(node: Container) {
  const start = node.x
  gsap.fromTo(
    node,
    { x: start - 7 },
    {
      x: start + 7,
      duration: 0.06,
      yoyo: true,
      repeat: 5,
      ease: 'power1.inOut',
      onComplete: () => {
        node.x = start
      },
    },
  )
}

function makeMarker(
  emoji: string,
  fontSize: number,
  radius: number,
  place: Marker['place'],
  word?: string,
): Marker {
  const node = new Container()
  const glow = new Graphics()
  glow.circle(0, 0, radius + 10)
  glow.fill({ color: 0xffe27a, alpha: 0.62 })
  glow.circle(0, 0, radius - 6)
  glow.fill({ color: 0xfff6c2, alpha: 0.35 })
  glow.visible = false
  const spark = new Text({
    text: '✨',
    style: {
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontSize: 22,
    },
  })
  spark.anchor.set(0.5)
  spark.position.set(radius - 6, -radius + 4)
  spark.visible = false
  const label = new Text({
    text: emoji,
    style: {
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontSize,
    },
  })
  label.anchor.set(0.5)
  node.addChild(glow, label, spark)
  node.eventMode = 'static'
  node.cursor = 'pointer'
  node.hitArea = new Circle(0, 0, radius)
  node.on('pointertap', (event) => {
    event.stopPropagation()
    if (props.locked) return
    if (word) {
      if (props.found.includes(word)) return
      emit('find', word)
      return
    }
    shake(node)
    emit('miss')
  })
  app?.stage.addChild(node)
  const marker = { word, node, glow, spark, place, baseY: 0 }
  markers.push(marker)
  return marker
}

async function boot() {
  const el = host.value
  if (!el) return
  const stage = new Application()
  await stage.init({
    width: Math.max(el.clientWidth, 280),
    height: Math.max(el.clientHeight, 280),
    background: '#7ec8e3',
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
  bg.eventMode = 'static'
  bg.cursor = 'pointer'
  bg.on('pointertap', () => {
    if (props.locked) return
    emit('miss')
  })
  stage.stage.addChild(bg)

  makeMarker('🌴', 42, 40, () => ({ x: 36, y: 44 }))
  makeMarker('🎈', 42, 40, (width) => ({ x: width - 40, y: 48 }))
  makeMarker('🎁', 34, 36, (width, height) => ({ x: width - 48, y: height - 86 }))
  makeMarker(wordEmoji('cat', family), 52, 46, (width, height) => ({ x: width * 0.48, y: height * 0.4 }), 'cat')
  makeMarker(wordEmoji('hat', family), 42, 44, (_width, height) => ({ x: 46, y: height - 96 }), 'hat')
  makeMarker(wordEmoji('mat', family), 42, 44, (width, height) => ({ x: width - 108, y: height - 82 }), 'mat')

  for (const word of props.found) markFound(word)
  layout()

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
  for (const marker of markers) {
    gsap.killTweensOf(marker.node)
    gsap.killTweensOf(marker.node.scale)
  }
  markers.length = 0
  bg = null
  app?.destroy(true, true)
  app = null
})

watch(
  () => props.found.join(','),
  () => {
    for (const word of props.found) markFound(word)
  },
)
</script>

<template>
  <div ref="host" class="stage" />
</template>

<style scoped>
.stage {
  position: relative;
  flex: 1;
  min-height: 280px;
  border-radius: 32px;
  overflow: hidden;
  background: linear-gradient(180deg, #7ec8e3 0%, #d7f4c2 58%, #b8e986 100%);
}

.stage :deep(canvas) {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
