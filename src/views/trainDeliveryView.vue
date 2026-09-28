<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { playNudge, playSuccess, playToot } from '../composables/useSfx'
import { pickPraise, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'

const CAR_W = 118
const BAY_X = 72

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
} = useChapterLevel('trainDelivery')

const art = (file: string) => `${import.meta.env.BASE_URL}train/${file}.webp`

const rounds = takeRunWords(4).slice(0, 4)
const numberByWord = new Map(
  (level.value?.numbers ?? []).map((item) => [item.word.toLowerCase(), item.value]),
)

const loaded = ref(0)
const shipped = ref<string[]>([])
const pulling = ref<string | null>(null)
const pull = ref({ x: 0, y: 0 })
const wobble = ref('')
const bounce = ref(false)
const puff = ref(false)
const departing = ref(false)
const bursting = ref(false)
const locked = ref(true)
const celebrating = ref(false)
const bayEl = ref<HTMLElement | null>(null)

let alive = true
let pointerId = -1
let startX = 0
let startY = 0

const target = computed(() => rounds[loaded.value] ?? '')
const progressText = computed(() => `${Math.min(loaded.value, rounds.length)} / ${rounds.length}`)
const waiting = computed(() => rounds.map((word, index) => ({ word, index })))

function numeralFor(word: string): number | undefined {
  return numberByWord.get(word.toLowerCase())
}

function pieceX(index: number): number {
  const base = BAY_X + (loaded.value - index) * CAR_W
  return departing.value ? base + 540 : base
}

function engineX(): number {
  return pieceX(0) + CAR_W - 14
}

function setBay(el: unknown, index: number) {
  if (index !== loaded.value) return
  bayEl.value = el instanceof HTMLElement ? el : null
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function sayTarget() {
  const word = target.value
  if (!word || !alive) return
  await speak(word)
}

function crateStyle(word: string) {
  if (pulling.value !== word) return undefined
  return { transform: `translate3d(${pull.value.x}px, ${pull.value.y}px, 0) scale(1.06)` }
}

function onDown(event: PointerEvent, word: string) {
  if (locked.value || celebrating.value || shipped.value.includes(word)) return
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  el.setPointerCapture(event.pointerId)
  pointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
  pulling.value = word
  pull.value = { x: 0, y: 0 }
  wobble.value = ''
}

function onMove(event: PointerEvent) {
  if (pulling.value == null || event.pointerId !== pointerId) return
  pull.value = { x: event.clientX - startX, y: event.clientY - startY }
}

function hitsBay(crate: HTMLElement): boolean {
  const bay = bayEl.value?.getBoundingClientRect()
  if (!bay) return false
  const box = crate.getBoundingClientRect()
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const pad = 56
  return cx >= bay.left - pad && cx <= bay.right + pad && cy >= bay.top - pad && cy <= bay.bottom + 72
}

async function onUp(event: PointerEvent, word: string) {
  if (pulling.value !== word || event.pointerId !== pointerId) return
  const el = event.currentTarget
  const dropped = el instanceof HTMLElement && hitsBay(el)
  pulling.value = null
  pointerId = -1
  pull.value = { x: 0, y: 0 }
  if (!dropped || word !== target.value) {
    if (dropped || Math.hypot(event.clientX - startX, event.clientY - startY) > 12) {
      wobble.value = word
      playNudge()
      window.setTimeout(() => {
        if (wobble.value === word) wobble.value = ''
      }, 480)
      if (dropped) void sayTarget()
    }
    return
  }
  await loadCrate(word)
}

async function loadCrate(word: string) {
  if (!alive || celebrating.value) return
  locked.value = true
  shipped.value = [...shipped.value, word]
  unlockWord(word)
  bounce.value = true
  puff.value = true
  playToot()
  await wait(420)
  bounce.value = false
  loaded.value += 1
  await wait(520)
  puff.value = false
  if (!alive) return
  if (loaded.value >= rounds.length) {
    await finale()
    return
  }
  locked.value = false
  void sayTarget()
}

async function finale() {
  celebrating.value = true
  departing.value = true
  bursting.value = true
  playSuccess()
  void speak(pickPraise('finish'))
  await wait(1700)
  if (!alive) return
  const result = finishLevel()
  goAfterLevel(result)
}

function replay() {
  if (locked.value && !celebrating.value) return
  void sayTarget()
}

onMounted(() => {
  locked.value = false
  void sayTarget()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen train">
    <gate-top-bar />
    <p class="gate-tag">{{ gateTag }}</p>
    <p v-if="isReplay" class="replay-hint">再玩一次，星星已经领过啦</p>
    <p class="prompt">听一听，把对应的箱子拖进空车厢</p>

    <div class="stage">
      <img class="station" :src="art('station')" alt="" draggable="false" />
      <img class="tunnel" :src="art('tunnel')" alt="" draggable="false" />
      <div class="track" :class="{ departing }">
        <img
          class="engine"
          :class="{ puff }"
          :src="art('train-engine')"
          alt=""
          draggable="false"
          :style="{ transform: `translate3d(${engineX()}px, 0, 0)` }"
        />
        <div
          v-for="car in waiting"
          :key="car.word"
          class="car"
          :class="{ bay: car.index === loaded }"
          :ref="(el) => setBay(el, car.index)"
          :style="{ transform: `translate3d(${pieceX(car.index)}px, 0, 0)` }"
        >
          <div class="car-inner" :class="{ bounce: bounce && car.index === loaded }">
          <img class="car-body" :src="art('train-car')" alt="" draggable="false" />
          <div v-if="shipped.includes(car.word)" class="cargo">
            <span v-if="numeralFor(car.word) != null" class="num">{{ numeralFor(car.word) }}</span>
            <word-pic v-else :word="car.word" :size="22" />
          </div>
          </div>
        </div>
      </div>
      <div v-if="bursting" class="burst" aria-hidden="true">
        <span v-for="n in 7" :key="n" class="spark">⭐</span>
      </div>
    </div>

    <div class="crates">
      <div
        v-for="word in rounds"
        :key="word"
        class="crate"
        :class="{
          gone: shipped.includes(word),
          wobble: wobble === word,
          lifting: pulling === word,
        }"
        :style="crateStyle(word)"
        :data-crate="word"
        :data-target="word === target ? '1' : '0'"
        role="button"
        :aria-label="word"
        @pointerdown="onDown($event, word)"
        @pointermove="onMove"
        @pointerup="onUp($event, word)"
        @pointercancel="onUp($event, word)"
      >
        <img class="crate-body" :src="art('crate')" alt="" draggable="false" />
        <div class="face">
          <span v-if="numeralFor(word) != null" class="num">{{ numeralFor(word) }}</span>
          <word-pic v-else :word="word" :size="24" />
        </div>
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
.train {
  gap: 8px;
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
  height: 268px;
  margin-top: 4px;
  border-radius: 28px;
  overflow: hidden;
  background: #b7e3f5;
  touch-action: none;
}

.station {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 78%;
  object-fit: cover;
  object-position: center bottom;
  pointer-events: none;
}

.tunnel {
  position: absolute;
  right: -18px;
  bottom: 28px;
  width: 150px;
  height: auto;
  z-index: 4;
  pointer-events: none;
}

.track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 36px;
  height: 128px;
  z-index: 2;
}

.engine,
.car {
  position: absolute;
  bottom: 0;
  left: 0;
  transition: transform 0.58s cubic-bezier(0.22, 0.82, 0.28, 1);
  will-change: transform;
  pointer-events: none;
}

.departing .engine,
.departing .car {
  transition: transform 1.55s cubic-bezier(0.4, 0.05, 0.7, 0.4);
}

.engine {
  width: 124px;
  height: auto;
}

.engine.puff {
  animation: puff 0.45s ease;
}

.car {
  width: 124px;
}

.car-inner {
  position: relative;
  width: 100%;
}

.car-body {
  display: block;
  width: 100%;
  height: auto;
}

.car-inner.bounce {
  animation: hop 0.42s ease;
}

.cargo,
.face {
  position: absolute;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.cargo {
  left: 36%;
  top: 55%;
  width: 28%;
  height: 16%;
  overflow: hidden;
}

.crates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  min-height: 108px;
  touch-action: none;
}

.crate {
  position: relative;
  aspect-ratio: 1;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.crate.lifting {
  z-index: 5;
  cursor: grabbing;
  transition: none;
}

.crate.gone {
  visibility: hidden;
  pointer-events: none;
}

.crate-body {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.face {
  left: 18%;
  top: 52%;
  width: 34%;
  height: 22%;
  overflow: hidden;
}

.num {
  font-weight: 800;
  color: #c2410c;
  font-size: 18px;
  line-height: 1;
}

.cargo .num {
  font-size: 14px;
}

.hint {
  margin: 0;
  font-weight: 700;
  color: #7c4a1e;
}

.burst {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.spark {
  position: absolute;
  left: 58%;
  top: 42%;
  font-size: 28px;
  animation: burst 0.9s ease-out forwards;
}

.spark:nth-child(1) { --dx: -70px; --dy: -50px; }
.spark:nth-child(2) { --dx: 10px; --dy: -80px; }
.spark:nth-child(3) { --dx: 80px; --dy: -30px; }
.spark:nth-child(4) { --dx: -30px; --dy: 20px; }
.spark:nth-child(5) { --dx: 50px; --dy: 30px; }
.spark:nth-child(6) { --dx: -90px; --dy: 10px; }
.spark:nth-child(7) { --dx: 20px; --dy: -20px; }

.wobble {
  animation: wobble 0.42s ease;
}

@keyframes hop {
  0% { transform: translate3d(0, 0, 0); }
  40% { transform: translate3d(0, -12px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

@keyframes puff {
  0% { filter: none; }
  40% { filter: brightness(1.15); }
  100% { filter: none; }
}

@keyframes wobble {
  0%,
  100% { transform: rotate(0); }
  25% { transform: rotate(-8deg); }
  55% { transform: rotate(7deg); }
  80% { transform: rotate(-3deg); }
}

@keyframes burst {
  to {
    transform: translate3d(var(--dx), var(--dy), 0) scale(1.3);
    opacity: 0;
  }
}
</style>
