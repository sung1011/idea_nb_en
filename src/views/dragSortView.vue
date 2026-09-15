<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

type SortItem = {
  id: string
  word: string
  emoji: string
}

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const baskets: SortItem[] = family.targets.map((word) => ({
  id: word,
  word,
  emoji: wordEmoji(word, family),
}))

const trayOrder = ref(shuffle(baskets.map((item) => item.id)))
const placed = ref<Record<string, boolean>>({})
const dragging = ref<string | null>(null)
const ghost = ref({ x: 0, y: 0 })
const pulsing = ref('')
const shaking = ref('')
const celebrating = ref(false)
const prompt = ref('')

const trayItems = computed(() =>
  trayOrder.value
    .map((id) => baskets.find((item) => item.id === id))
    .filter((item): item is SortItem => !!item && !placed.value[item.id]),
)

function basketAt(x: number, y: number) {
  const el = document.elementFromPoint(x, y)
  const node = el?.closest('[data-basket]')
  return node?.getAttribute('data-basket') ?? ''
}

function onDown(event: PointerEvent, id: string) {
  if (celebrating.value) return
  pulsing.value = ''
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
  prompt.value = 'Yes!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  void router.push('/play-gallery')
}

async function dropAt(x: number, y: number) {
  const id = dragging.value
  dragging.value = null
  if (!id || celebrating.value) return
  const item = baskets.find((row) => row.id === id)
  if (!item) return

  const over = baskets.find((basket) => basket.id === basketAt(x, y))
  if (!over) return

  if (over.id !== item.id) {
    shaking.value = over.id
    playNudge()
    window.setTimeout(() => {
      if (shaking.value === over.id) shaking.value = ''
    }, 360)
    await speak(item.word)
    return
  }

  placed.value = { ...placed.value, [id]: true }
  playPop()
  prompt.value = 'Yes!'
  await speak(item.word)
  if (baskets.every((row) => placed.value[row.id])) {
    await finish()
  }
}

function onUp(event: PointerEvent) {
  if (!dragging.value) return
  void dropAt(event.clientX, event.clientY)
}

async function onboard() {
  const first = baskets[0]
  if (!first) return
  pulsing.value = first.id
  await speak(first.word)
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  if (dragging.value) return
  pulsing.value = ''
}

onMounted(() => {
  void onboard()
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

    <div class="center head">
      <p class="gate-tag">Drag Sort</p>
      <p class="prompt" :class="{ on: prompt }">{{ prompt }}</p>
    </div>

    <div class="baskets">
      <div
        v-for="basket in baskets"
        :key="basket.id"
        :data-basket="basket.id"
        class="basket"
        :class="{
          on: placed[basket.id],
          pulse: pulsing === basket.id,
          shake: shaking === basket.id,
        }"
      >
        <span class="pic" aria-hidden="true">{{ basket.emoji }}</span>
        <span v-if="placed[basket.id]" class="check" aria-hidden="true">⭐</span>
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
        {{ item.word }}
      </button>
    </div>

    <div
      v-if="dragging"
      class="ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      {{ baskets.find((item) => item.id === dragging)?.word }}
    </div>
  </section>
</template>

<style scoped>
.sort {
  gap: 12px;
}

.head {
  min-height: 64px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #b45309;
}

.prompt {
  margin: 6px 0 0;
  min-height: 28px;
  font-size: 24px;
  font-weight: 700;
  color: transparent;
}

.prompt.on {
  color: var(--ok);
}

.baskets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.basket {
  position: relative;
  min-height: 132px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 3px rgba(45, 58, 74, 0.06);
  display: grid;
  place-items: center;
}

.basket.on {
  background: #e4f8ec;
  box-shadow: inset 0 0 0 3px rgba(76, 175, 122, 0.35);
}

.basket.pulse {
  background: #ffe27a;
  box-shadow: 0 0 0 8px rgba(255, 226, 122, 0.45);
  animation: pulse 0.9s ease 3;
}

.pic {
  font-size: 56px;
  line-height: 1;
}

.check {
  position: absolute;
  right: 8px;
  top: 8px;
  font-size: 22px;
}

.tray {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: auto;
}

.chip {
  min-width: 96px;
  min-height: 84px;
  padding: 0 12px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  font-size: 28px;
  font-weight: 700;
  touch-action: none;
}

.chip.dragging {
  opacity: 0.35;
}

.ghost {
  position: fixed;
  z-index: 20;
  min-width: 88px;
  min-height: 64px;
  padding: 0 12px;
  margin: -32px 0 0 -44px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #fff;
  font-size: 28px;
  font-weight: 700;
  pointer-events: none;
  filter: drop-shadow(0 8px 0 rgba(45, 58, 74, 0.16));
}
</style>
