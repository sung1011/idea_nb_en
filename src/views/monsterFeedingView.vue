<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import numberClay from '../components/numberClay.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { playBurp, playNudge, playSuccess } from '../composables/useSfx'
import { pickPraise, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { monsterOrderLine } from '../data/monsterOrders'

const {
  level,
  isReplay,
  gateTag,
  finishLevel,
  goAfterLevel,
  showClearSheet,
  lastResult,
  isChapterPractice,
  chapterComplete,
  chapterNo,
  replayCleared,
  continueAfterClear,
  goLobby,
  takeRunWords,
} = useChapterLevel('monsterFeeding')

const art = (file: string) => `${import.meta.env.BASE_URL}monster/${file}.webp`

const rounds = takeRunWords(4).slice(0, 4)
const numberByWord = new Map(
  (level.value?.numbers ?? []).map((item) => [item.word.toLowerCase(), item.value]),
)
const patternByWord = new Map(
  (level.value?.storyPages ?? []).map((page) => [page.word.toLowerCase(), page.line]),
)
for (const item of level.value?.numbers ?? []) {
  if (!patternByWord.has(item.word.toLowerCase())) patternByWord.set(item.word.toLowerCase(), item.sentence)
}

const fed = ref(0)
const eaten = ref<string[]>([])
const pulling = ref<string | null>(null)
const pull = ref({ x: 0, y: 0 })
const pop = ref('')
const pose = ref<'open' | 'chew' | 'burp'>('open')
const chewing = ref(false)
const shaking = ref(false)
const burping = ref(false)
const locked = ref(true)
const celebrating = ref(false)
const mouthEl = ref<HTMLElement | null>(null)

let alive = true
let pointerId = -1
let startX = 0
let startY = 0

const target = computed(() => rounds[fed.value] ?? '')
const orderLine = computed(() => monsterOrderLine(patternByWord.get(target.value.toLowerCase()) ?? '', target.value))
const progressText = computed(() => `${Math.min(fed.value, rounds.length)} / ${rounds.length}`)
const belly = computed(() => 1 + fed.value * 0.06)

function numeralFor(word: string): number | undefined {
  return numberByWord.get(word.toLowerCase())
}

function setMouth(el: unknown) {
  mouthEl.value = el instanceof HTMLElement ? el : null
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function sayOrder() {
  const line = orderLine.value
  if (!line || !alive) return
  await speak(line)
}

function cardStyle(word: string) {
  if (pulling.value !== word) return undefined
  return { transform: `translate3d(${pull.value.x}px, ${pull.value.y}px, 0) scale(1.06)` }
}

function onDown(event: PointerEvent, word: string) {
  if (locked.value || celebrating.value || eaten.value.includes(word)) return
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  el.setPointerCapture(event.pointerId)
  pointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
  pulling.value = word
  pull.value = { x: 0, y: 0 }
  pop.value = ''
}

function onMove(event: PointerEvent) {
  if (pulling.value == null || event.pointerId !== pointerId) return
  pull.value = { x: event.clientX - startX, y: event.clientY - startY }
}

function hitsMouth(card: HTMLElement): boolean {
  const mouth = mouthEl.value?.getBoundingClientRect()
  if (!mouth) return false
  const box = card.getBoundingClientRect()
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const pad = 56
  return cx >= mouth.left - pad && cx <= mouth.right + pad && cy >= mouth.top - pad && cy <= mouth.bottom + 72
}

async function onUp(event: PointerEvent, word: string) {
  if (pulling.value !== word || event.pointerId !== pointerId) return
  const el = event.currentTarget
  const dropped = el instanceof HTMLElement && hitsMouth(el)
  pulling.value = null
  pointerId = -1
  pull.value = { x: 0, y: 0 }
  if (!dropped || word !== target.value) {
    if (dropped || Math.hypot(event.clientX - startX, event.clientY - startY) > 12) {
      pop.value = word
      if (dropped) {
        shaking.value = true
        window.setTimeout(() => {
          shaking.value = false
        }, 480)
      }
      playNudge()
      window.setTimeout(() => {
        if (pop.value === word) pop.value = ''
      }, 420)
      if (dropped) void sayOrder()
    }
    return
  }
  await feed(word)
}

async function feed(word: string) {
  if (!alive || celebrating.value) return
  locked.value = true
  eaten.value = [...eaten.value, word]
  unlockWord(word)
  pose.value = 'chew'
  chewing.value = true
  fed.value += 1
  void speak('Yum!')
  await wait(1000)
  chewing.value = false
  if (!alive) return
  if (fed.value >= rounds.length) {
    await finale()
    return
  }
  pose.value = 'open'
  locked.value = false
  void sayOrder()
}

async function finale() {
  celebrating.value = true
  pose.value = 'burp'
  burping.value = true
  playBurp()
  playSuccess()
  void speak(pickPraise('finish'))
  await wait(1600)
  if (!alive) return
  const result = finishLevel()
  goAfterLevel(result)
}

function replay() {
  if (locked.value && !celebrating.value) return
  void sayOrder()
}

onMounted(() => {
  locked.value = false
  void sayOrder()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen feed">
    <gate-top-bar />
    <p class="gate-tag">{{ gateTag }}</p>
    <p v-if="isReplay" class="replay-hint">再玩一次，星星已经领过啦</p>
    <p class="prompt">听一听，把怪兽要的食物拖进嘴里</p>

    <div class="stage">
      <div class="monster" :style="{ transform: `scale(${belly})` }">
        <div class="monster-body" :class="{ chewing, shaking, burping }">
          <img class="monster-art" :src="art(`monster-${pose}`)" alt="" draggable="false" />
          <div :ref="setMouth" class="mouth" />
          <div v-if="burping" class="puff" aria-hidden="true" />
          <div v-if="burping" class="star-pop" aria-hidden="true">⭐</div>
        </div>
      </div>
    </div>

    <div class="cards">
      <div
        v-for="(word, index) in rounds"
        :key="`${word}-${index}`"
        class="food"
        :class="{ gone: eaten.includes(word), pop: pop === word, lifting: pulling === word }"
        :style="cardStyle(word)"
        :data-card="word"
        :data-target="word === target ? '1' : '0'"
        role="button"
        :aria-label="word"
        @pointerdown="onDown($event, word)"
        @pointermove="onMove"
        @pointerup="onUp($event, word)"
        @pointercancel="onUp($event, word)"
      >
        <template v-if="!eaten.includes(word)">
          <number-clay v-if="numeralFor(word) != null" :value="numeralFor(word) ?? 0" size="md" />
          <word-pic v-else :word="word" :size="112" />
        </template>
      </div>
    </div>

    <p class="center hint">{{ progressText }}</p>
    <big-button variant="listen" :disabled="locked" @click="replay">再听一次</big-button>
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :chapter-no="chapterNo"
      :from-practice="isChapterPractice"
      :has-next="Boolean(lastResult?.nextLevelId)"
      @replay="replayCleared"
      @next="continueAfterClear"
      @lobby="goLobby"
    />
  </section>
</template>

<style scoped>
.feed {
  gap: 6px;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.gate-tag {
  margin: 6px 0 0;
  font-weight: 700;
  color: #9a3412;
}

.replay-hint,
.prompt {
  margin: 0;
  text-align: center;
  font-weight: 650;
}

.prompt {
  color: #7c4a1e;
  font-size: 15px;
}

.replay-hint {
  color: #15803d;
  font-size: 14px;
}

.stage {
  position: relative;
  flex: 1 1 160px;
  min-height: 140px;
  max-height: 240px;
  display: grid;
  place-items: center;
  touch-action: none;
}

.monster {
  width: min(280px, 78%);
  transform-origin: 50% 82%;
  transition: transform 0.45s cubic-bezier(0.22, 0.82, 0.28, 1);
  will-change: transform;
}

.monster-body {
  position: relative;
}

.monster-art {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
}

.mouth {
  position: absolute;
  left: 30%;
  top: 52%;
  width: 40%;
  height: 22%;
  pointer-events: none;
}

.chewing .monster-art {
  animation: chew 0.34s ease-in-out 3;
}

.shaking {
  animation: shake 0.42s ease;
}

.puff {
  position: absolute;
  left: 34%;
  top: 46%;
  width: 32%;
  height: 22%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 182, 214, 0.95) 0%, rgba(255, 140, 190, 0.35) 55%, transparent 72%);
  animation: puff 0.9s ease-out forwards;
  pointer-events: none;
}

.star-pop {
  position: absolute;
  left: 44%;
  top: 48%;
  font-size: 36px;
  animation: pop-star 1s ease-out forwards;
  pointer-events: none;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex-shrink: 0;
  touch-action: none;
}

.food {
  display: grid;
  place-items: center;
  min-height: 156px;
  border-radius: 24px;
  background: #fff7e8;
  box-shadow: 0 6px 0 #f3d7a4;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.food.lifting {
  position: relative;
  z-index: 5;
  cursor: grabbing;
  transition: none;
}

.food.gone {
  background: rgba(255, 247, 232, 0.45);
  box-shadow: none;
  border: 3px dashed #e4b56a;
  pointer-events: none;
  cursor: default;
}

.food.pop {
  animation: popback 0.42s ease;
}

.hint {
  margin: 0;
  font-weight: 700;
  color: #7c4a1e;
}

@keyframes chew {
  0%,
  100% { transform: scale(1, 1); }
  45% { transform: scale(1.08, 0.88); }
  75% { transform: scale(0.96, 1.06); }
}

@keyframes shake {
  0%,
  100% { transform: rotate(0); }
  25% { transform: rotate(-8deg); }
  55% { transform: rotate(7deg); }
  80% { transform: rotate(-3deg); }
}

@keyframes popback {
  0% { transform: scale(1.12); }
  45% { transform: scale(0.9) rotate(-8deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes puff {
  0% { transform: scale(0.4); opacity: 0.2; }
  40% { opacity: 1; }
  100% { transform: scale(2.4) translate3d(10px, -18px, 0); opacity: 0; }
}

@keyframes pop-star {
  0% { transform: translate3d(0, 8px, 0) scale(0.4); opacity: 0; }
  35% { opacity: 1; }
  100% { transform: translate3d(0, -78px, 0) scale(1.25); opacity: 0; }
}
</style>
