<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

const router = useRouter()
const family = getCurrentFamily()
const { afterGate, backPath, backLabel } = usePlayMode()

const words = family.targets.slice(0, 3)
const baskets = ref(shuffle([...words]))
const trayOrder = ref(shuffle([...words]))
const placed = ref<Record<string, boolean>>(
  Object.fromEntries(words.map((word) => [word, false])),
)
const dragging = ref<string | null>(null)
const ghost = ref({ x: 0, y: 0 })
const hoverWord = ref<string | null>(null)
const pulseWord = ref('')
const shakeWord = ref('')
const prompt = ref('')
const locked = ref(true)
const celebrating = ref(false)

const trayItems = computed(() => trayOrder.value.filter((word) => !placed.value[word]))
const demoWord = words.includes('cat') ? 'cat' : words[0]

function hitWord(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)
  const word = el?.closest('[data-basket]')?.getAttribute('data-basket')
  return word && words.includes(word) ? word : null
}

function onDown(event: PointerEvent, word: string) {
  if (locked.value || celebrating.value) return
  dragging.value = word
  ghost.value = { x: event.clientX, y: event.clientY }
  hoverWord.value = hitWord(event.clientX, event.clientY)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  void speak(word)
}

function onMove(event: PointerEvent) {
  if (!dragging.value) return
  ghost.value = { x: event.clientX, y: event.clientY }
  hoverWord.value = hitWord(event.clientX, event.clientY)
}

function clearDrag() {
  dragging.value = null
  hoverWord.value = null
}

async function onboard() {
  locked.value = true
  prompt.value = demoWord
  await speak(demoWord)
  pulseWord.value = demoWord
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  pulseWord.value = ''
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'Party sorted!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  void router.push(afterGate('/play-gallery'))
}

async function dropAt(x: number, y: number) {
  const word = dragging.value
  clearDrag()
  if (!word || locked.value || celebrating.value) return

  const bucket = hitWord(x, y)
  if (!bucket) return

  if (bucket !== word) {
    playNudge()
    shakeWord.value = bucket
    prompt.value = word
    window.setTimeout(() => {
      if (shakeWord.value === bucket) shakeWord.value = ''
    }, 360)
    await speak(word)
    pulseWord.value = word
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    if (pulseWord.value === word) pulseWord.value = ''
    return
  }

  placed.value = { ...placed.value, [word]: true }
  playPop()
  prompt.value = 'Yes!'
  await speak(word)
  if (words.every((item) => placed.value[item])) {
    await finish()
  }
}

function onUp(event: PointerEvent) {
  if (!dragging.value) return
  void dropAt(event.clientX, event.clientY)
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

    <div class="center">
      <p class="gate-tag">Drag Sort</p>
      <h1 class="title-lg">{{ prompt }}</h1>
    </div>

    <div class="buckets">
      <div
        v-for="word in baskets"
        :key="word"
        :data-basket="word"
        class="bucket"
        :class="{
          on: placed[word],
          pulse: pulseWord === word,
          shake: shakeWord === word,
          hover: hoverWord === word,
        }"
        :aria-label="word"
      >
        <span class="pic" aria-hidden="true">{{ wordEmoji(word, family) }}</span>
        <span class="bowl" aria-hidden="true" />
        <span v-if="placed[word]" class="landed">{{ word }}</span>
      </div>
    </div>

    <div class="tray">
      <button
        v-for="word in trayItems"
        :key="word"
        class="chip"
        type="button"
        :class="{ dragging: dragging === word }"
        :aria-label="word"
        @pointerdown="onDown($event, word)"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="clearDrag"
      >
        {{ word }}
      </button>
    </div>

    <div
      v-if="dragging"
      class="ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      {{ dragging }}
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
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  min-height: 188px;
}

.bucket {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 176px;
  padding: 12px 6px 14px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 3px rgba(45, 58, 74, 0.06);
}

.bucket.on {
  background: #e4f8ec;
}

.bucket.hover {
  box-shadow: inset 0 0 0 4px rgba(255, 159, 67, 0.55);
}

.bucket.pulse {
  background: #ffe27a;
  box-shadow: 0 0 0 8px rgba(255, 226, 122, 0.45);
  animation: pulse 0.9s ease 3;
}

.pic {
  font-size: 52px;
  line-height: 1;
  filter: drop-shadow(0 6px 0 rgba(45, 58, 74, 0.08));
}

.bowl {
  width: 78%;
  height: 28px;
  margin-top: 4px;
  border-radius: 0 0 46px 46px;
  background:
    repeating-linear-gradient(
      90deg,
      #e8b86d 0 8px,
      #d7a257 8px 12px
    ),
    linear-gradient(180deg, #f3d19a 0%, #c9843a 100%);
  box-shadow:
    inset 0 6px 0 rgba(255, 255, 255, 0.28),
    0 6px 0 rgba(45, 58, 74, 0.1);
}

.landed {
  margin-top: 8px;
  min-height: 28px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff;
  font-size: 16px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.tray {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
}

.chip {
  min-width: 96px;
  min-height: 72px;
  padding: 8px 14px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  touch-action: none;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.chip.dragging {
  opacity: 0.35;
}

.ghost {
  position: fixed;
  z-index: 20;
  min-width: 88px;
  min-height: 64px;
  padding: 8px 14px;
  margin: -32px 0 0 -44px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: #fff;
  font-size: 28px;
  font-weight: 750;
  pointer-events: none;
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.16);
}

.center .title-lg {
  min-height: 36px;
}
</style>
