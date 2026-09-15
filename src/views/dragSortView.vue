<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'

type Bucket = 'animal' | 'prop'

type SortItem = {
  id: string
  emoji: string
  word: string
  bucket: Bucket
}

const router = useRouter()
const { backPath, backLabel } = usePlayMode()

const items: SortItem[] = [
  { id: 'cat', emoji: '🐱', word: 'cat', bucket: 'animal' },
  { id: 'hat', emoji: '🎩', word: 'hat', bucket: 'prop' },
  { id: 'mat', emoji: '🧶', word: 'mat', bucket: 'prop' },
]

const placed = ref<Record<string, Bucket | null>>({
  cat: null,
  hat: null,
  mat: null,
})
const dragging = ref<string | null>(null)
const ghost = ref({ x: 0, y: 0 })
const prompt = ref('拖到对的篮子')
const celebrating = ref(false)
const animalBox = ref<HTMLElement | null>(null)
const propBox = ref<HTMLElement | null>(null)

const trayItems = computed(() => items.filter((item) => !placed.value[item.id]))
const animalItems = computed(() => items.filter((item) => placed.value[item.id] === 'animal'))
const propItems = computed(() => items.filter((item) => placed.value[item.id] === 'prop'))
const allIn = computed(() => items.every((item) => placed.value[item.id]))

function hit(el: HTMLElement | null, x: number, y: number) {
  if (!el) return false
  const box = el.getBoundingClientRect()
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
}

function onDown(event: PointerEvent, id: string) {
  if (celebrating.value) return
  dragging.value = id
  ghost.value = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onMove(event: PointerEvent) {
  if (!dragging.value) return
  ghost.value = { x: event.clientX, y: event.clientY }
}

async function finish() {
  celebrating.value = true
  prompt.value = 'Party sorted!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  void router.push('/play-gallery')
}

async function dropAt(x: number, y: number) {
  const id = dragging.value
  dragging.value = null
  if (!id) return
  const item = items.find((row) => row.id === id)
  if (!item) return

  let bucket: Bucket | null = null
  if (hit(animalBox.value, x, y)) bucket = 'animal'
  if (hit(propBox.value, x, y)) bucket = 'prop'
  if (!bucket) return

  if (bucket !== item.bucket) {
    playNudge()
    prompt.value = '换一个篮子试试'
    await speak(item.word)
    return
  }

  placed.value = { ...placed.value, [id]: bucket }
  playPop()
  prompt.value = 'Yes!'
  await speak(item.word)
  if (items.every((row) => placed.value[row.id])) {
    await finish()
  }
}

function onUp(event: PointerEvent) {
  if (!dragging.value) return
  void dropAt(event.clientX, event.clientY)
}

onMounted(() => {
  void speak('Animals and party props')
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen sort">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">拖一拖 · Drag Sort</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">小猫是动物，hat / mat 是派对道具</p>
    </div>

    <div class="buckets">
      <div ref="animalBox" class="bucket animal" :class="{ on: animalItems.length }">
        <p>动物</p>
        <div class="held">
          <span v-for="item in animalItems" :key="item.id">{{ item.emoji }}</span>
        </div>
      </div>
      <div ref="propBox" class="bucket prop" :class="{ on: propItems.length }">
        <p>派对道具</p>
        <div class="held">
          <span v-for="item in propItems" :key="item.id">{{ item.emoji }}</span>
        </div>
      </div>
    </div>

    <div class="tray">
      <button
        v-for="item in trayItems"
        :key="item.id"
        class="chip"
        type="button"
        :class="{ dragging: dragging === item.id }"
        @pointerdown="onDown($event, item.id)"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="dragging = null"
      >
        <b>{{ item.emoji }}</b>
        <small>{{ item.word }}</small>
      </button>
    </div>

    <p class="center hint">{{ allIn ? '都放好啦' : '按住拖进篮子' }}</p>

    <div
      v-if="dragging"
      class="ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      {{ items.find((item) => item.id === dragging)?.emoji }}
    </div>
  </section>
</template>

<style scoped>
.sort {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #b45309;
}

.buckets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 180px;
}

.bucket {
  border-radius: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 0 0 3px rgba(45, 58, 74, 0.06);
}

.bucket.on {
  background: #e4f8ec;
}

.bucket p {
  margin: 0 0 8px;
  font-weight: 700;
  text-align: center;
}

.held {
  min-height: 88px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 40px;
}

.tray {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: auto;
}

.chip {
  width: 96px;
  min-height: 96px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  touch-action: none;
}

.chip.dragging {
  opacity: 0.35;
}

.chip b {
  display: block;
  font-size: 40px;
}

.hint {
  margin: 8px 0 0;
}

.ghost {
  position: fixed;
  z-index: 20;
  width: 72px;
  height: 72px;
  margin: -36px 0 0 -36px;
  display: grid;
  place-items: center;
  font-size: 44px;
  pointer-events: none;
  filter: drop-shadow(0 8px 0 rgba(45, 58, 74, 0.16));
}
</style>
