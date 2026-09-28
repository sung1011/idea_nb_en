<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import numberClay from '../components/numberClay.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { persistState } from '../composables/progressStore'
import { playNudge, playPop, playSuccess } from '../composables/useSfx'
import { speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getLesson } from '../data/chapters'
import { meadowRoster, meadowSrc } from '../meadow/meadowConfig'

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
} = useChapterLevel('bubbleShot')

const HITS = 6
const MIN_BUBBLES = 2
const MAX_BUBBLES = 3
const START_BUBBLES = 3

const SLOTS = [
  { left: '0px', top: '0px' },
  { left: 'calc(100% - var(--bubble))', top: '0px' },
  { left: 'calc(50% - var(--bubble) / 2)', top: 'calc(100% - var(--bubble))' },
]

type FloatBubble = {
  id: number
  word: string
  slot: number
  dur: number
  delay: number
  dx: number
  dy: number
  wobble: boolean
  popping: boolean
  holding: boolean
}

type Shot = {
  left: number
  top: number
  dx: number
  dy: number
  fly: boolean
}

const art = (file: string) => `${import.meta.env.BASE_URL}bubble/${file}.webp`

const pool = takeRunWords(4).slice(0, 4)
if (!pool.length) pool.push('hop')

const numberByWord = new Map(
  (level.value?.numbers ?? []).map((item) => [item.word.toLowerCase(), item.value]),
)

const bubbles = ref<FloatBubble[]>([])
const hits = ref(0)
const target = ref(pool[0] ?? 'hop')
const combo = ref(0)
const comboText = ref('')
const comboToken = ref(0)
const locked = ref(false)
const phase = ref<'play' | 'giant' | 'done'>('play')
const giantIn = ref(false)
const giantPop = ref(false)
const shot = ref<Shot | null>(null)
const playEl = ref<HTMLElement | null>(null)
const muzzleEl = ref<HTMLElement | null>(null)

const bubbleEls = new Map<number, HTMLElement>()
let nextId = 1
let alive = true
let comboTimer = 0

const shooterId = computed(() => {
  const owned = persistState.meadow.owned
  return owned[owned.length - 1]?.id || meadowRoster()[0]?.id || 'bunny'
})

const sentence = computed(() => getLesson(level.value?.lessonId)?.sentence?.trim() || 'I can hop.')

const sentenceWords = computed(() => wordsInSentence(sentence.value, level.value?.words ?? []))

const progressText = computed(() => `${Math.min(hits.value, HITS)} / ${HITS}`)

const prompt = computed(() =>
  phase.value === 'play' ? '听一听，点破对应的泡泡' : '点破大泡泡，听完整句',
)

function wordsInSentence(line: string, words: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of words) {
    const word = raw.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    const body = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!new RegExp(`\\b${body}s?\\b`, 'i').test(line)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

function numeralFor(word: string): number | undefined {
  return numberByWord.get(word.toLowerCase())
}

function setPlay(el: unknown) {
  playEl.value = el instanceof HTMLElement ? el : null
}

function setMuzzle(el: unknown) {
  muzzleEl.value = el instanceof HTMLElement ? el : null
}

function setBubble(el: unknown, id: number) {
  if (el instanceof HTMLElement) bubbleEls.set(id, el)
  else bubbleEls.delete(id)
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function frame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))
}

function sayTarget() {
  if (!target.value || !alive) return
  void speak(target.value)
}

function pickWord(allowDup: boolean): string {
  if (allowDup && bubbles.value.length && Math.random() < 0.3) {
    const host = bubbles.value[Math.floor(Math.random() * bubbles.value.length)]
    if (host) return host.word
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? target.value
}

function spawn(word: string) {
  const used = new Set(bubbles.value.map((item) => item.slot))
  let slot = SLOTS.findIndex((_, index) => !used.has(index))
  if (slot < 0) slot = Math.floor(Math.random() * SLOTS.length)
  bubbles.value.push({
    id: nextId,
    word,
    slot,
    dur: 3.4 + Math.random() * 2.2,
    delay: -Math.random() * 2.4,
    dx: 4 + Math.random() * 6,
    dy: 3 + Math.random() * 5,
    wobble: false,
    popping: false,
    holding: false,
  })
  nextId += 1
}

function ensureTarget() {
  if (bubbles.value.some((item) => item.word === target.value)) return
  if (bubbles.value.length < MAX_BUBBLES) {
    spawn(target.value)
    return
  }
  const spare = bubbles.value.find((item) => item.word !== target.value)
  if (spare) spare.word = target.value
  else spawn(target.value)
}

function trimField() {
  while (bubbles.value.length < MIN_BUBBLES && phase.value === 'play') spawn(pickWord(true))
  while (bubbles.value.length > MAX_BUBBLES) {
    const extra = bubbles.value.findIndex((item) => item.word !== target.value)
    if (extra < 0) break
    const removed = bubbles.value[extra]
    if (removed) bubbleEls.delete(removed.id)
    bubbles.value.splice(extra, 1)
  }
  ensureTarget()
}

function fillStart() {
  target.value = pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? 'hop'
  spawn(target.value)
  while (bubbles.value.length < START_BUBBLES) spawn(pickWord(true))
  trimField()
}

function slotStyle(bubble: FloatBubble) {
  const spot = SLOTS[bubble.slot] ?? SLOTS[0]
  return { left: spot.left, top: spot.top }
}

function driftStyle(bubble: FloatBubble) {
  return {
    '--dur': `${bubble.dur}s`,
    '--delay': `${bubble.delay}s`,
    '--dx': `${bubble.dx}px`,
    '--dy': `${bubble.dy}px`,
  }
}

function flashCombo(text: string) {
  comboText.value = text
  comboToken.value += 1
  window.clearTimeout(comboTimer)
  comboTimer = window.setTimeout(() => {
    if (comboText.value === text) comboText.value = ''
  }, 700)
}

async function fireAt(el: HTMLElement) {
  const play = playEl.value
  const muzzle = muzzleEl.value
  if (!play || !muzzle) {
    await wait(180)
    return
  }
  const origin = play.getBoundingClientRect()
  const from = muzzle.getBoundingClientRect()
  const to = el.getBoundingClientRect()
  const left = from.left + from.width / 2 - origin.left
  const top = from.top + from.height / 2 - origin.top
  const dx = to.left + to.width / 2 - origin.left - left
  const dy = to.top + to.height / 2 - origin.top - top
  shot.value = { left, top, dx, dy, fly: false }
  await nextTick()
  await frame()
  if (shot.value) shot.value = { ...shot.value, fly: true }
  await wait(300)
  shot.value = null
}

async function onMiss(bubble: FloatBubble) {
  combo.value = 0
  comboText.value = ''
  bubble.wobble = false
  await nextTick()
  if (!alive || !bubbles.value.some((item) => item.id === bubble.id)) return
  bubble.wobble = true
  window.setTimeout(() => {
    bubble.wobble = false
  }, 460)
  playNudge()
  sayTarget()
}

async function onHit(bubble: FloatBubble) {
  if (locked.value || phase.value !== 'play') return
  if (bubble.popping) return
  if (bubble.word !== target.value) {
    await onMiss(bubble)
    return
  }
  locked.value = true
  bubble.holding = true
  combo.value += 1
  if (combo.value >= 2) flashCombo(`x${combo.value}`)
  const el = bubbleEls.get(bubble.id)
  if (el) await fireAt(el)
  if (!alive) return
  bubble.popping = true
  playPop()
  unlockWord(bubble.word)
  await wait(320)
  if (!alive) return
  bubbleEls.delete(bubble.id)
  bubbles.value = bubbles.value.filter((item) => item.id !== bubble.id)
  hits.value += 1
  if (hits.value >= HITS) {
    bubbles.value = []
    phase.value = 'giant'
    locked.value = false
    await nextTick()
    await frame()
    giantIn.value = true
    return
  }
  const avoid = target.value
  const choices = pool.filter((word) => word !== avoid)
  const nextPool = choices.length ? choices : pool
  target.value = nextPool[Math.floor(Math.random() * nextPool.length)] ?? avoid
  spawn(pickWord(true))
  trimField()
  locked.value = false
  sayTarget()
}

function onBubbleUp(event: PointerEvent, bubble: FloatBubble) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.preventDefault()
  void onHit(bubble)
}

async function popGiant(event: PointerEvent) {
  if (phase.value !== 'giant') return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.preventDefault()
  phase.value = 'done'
  giantPop.value = true
  playPop()
  playSuccess()
  await speak(sentence.value)
  if (!alive) return
  goAfterLevel(finishLevel())
}

function replay() {
  if (locked.value || phase.value !== 'play') return
  sayTarget()
}

onMounted(() => {
  fillStart()
  sayTarget()
})

onUnmounted(() => {
  alive = false
  window.clearTimeout(comboTimer)
  stopSpeech()
})
</script>

<template>
  <section class="screen bubble-shot">
    <gate-top-bar />
    <p class="gate-tag">{{ gateTag }}</p>
    <p v-if="isReplay" class="replay-hint">再玩一次，星星已经领过啦</p>
    <p class="prompt">{{ prompt }}</p>

    <div :ref="setPlay" class="play">
      <div class="field">
        <div
          v-for="bubble in bubbles"
          :key="bubble.id"
          class="slot"
          :style="slotStyle(bubble)"
        >
          <div class="floater" :class="{ hold: bubble.holding }" :style="driftStyle(bubble)">
            <button
              :ref="(el) => setBubble(el, bubble.id)"
              type="button"
              class="bubble"
              :class="{ wobble: bubble.wobble, popping: bubble.popping }"
              :data-target="bubble.word === target ? '1' : '0'"
              :aria-label="bubble.word"
              @pointerup="onBubbleUp($event, bubble)"
            >
              <img class="shell" :src="art('bubble')" alt="" draggable="false" />
              <span class="face">
                <number-clay
                  v-if="numeralFor(bubble.word) != null"
                  class="numeral"
                  :value="numeralFor(bubble.word) ?? 0"
                  size="sm"
                />
                <word-pic v-else :word="bubble.word" :size="76" />
              </span>
              <span v-if="bubble.popping" class="stars" aria-hidden="true">
                <i>⭐</i>
                <i>⭐</i>
                <i>⭐</i>
              </span>
            </button>
          </div>
        </div>
      </div>

      <p v-if="comboText" :key="comboToken" class="combo">{{ comboText }}</p>

      <button
        v-if="phase !== 'play'"
        type="button"
        class="giant"
        :class="{ in: giantIn, gone: giantPop }"
        data-giant="1"
        aria-label="点破句子泡泡"
        @pointerup="popGiant"
      >
        <img class="shell" :src="art('bubble')" alt="" draggable="false" />
        <span class="giant-face">
          <span class="line">{{ sentence }}</span>
          <span class="pics">
            <template v-for="word in sentenceWords" :key="word">
              <number-clay v-if="numeralFor(word) != null" :value="numeralFor(word) ?? 0" size="sm" />
              <word-pic v-else :word="word" :size="72" />
            </template>
          </span>
        </span>
      </button>

      <img
        v-if="shot"
        class="projectile"
        :class="{ fly: shot.fly }"
        :src="art('bubble')"
        alt=""
        :style="{
          left: `${shot.left}px`,
          top: `${shot.top}px`,
          transform: shot.fly
            ? `translate3d(calc(-50% + ${shot.dx}px), calc(-50% + ${shot.dy}px), 0)`
            : 'translate3d(-50%, -50%, 0)',
        }"
      />

      <div class="shooter" :data-shooter="shooterId">
        <img class="pet" :src="meadowSrc(shooterId)" alt="" draggable="false" />
        <div class="gun-wrap">
          <img class="gun" :src="art('bubble-gun')" alt="" draggable="false" />
          <span :ref="setMuzzle" class="muzzle" />
        </div>
      </div>
    </div>

    <p class="center hint">{{ progressText }}</p>
    <big-button variant="listen" :disabled="locked || phase !== 'play'" @click="replay">再听一次</big-button>
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
.bubble-shot {
  --bubble: 148px;
  gap: 4px;
  padding-bottom: 12px;
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

.play {
  position: relative;
  flex: 1;
  min-height: 0;
  touch-action: none;
}

.field {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 118px;
}

.slot {
  position: absolute;
  width: var(--bubble);
  height: var(--bubble);
}

.floater {
  width: var(--bubble);
  height: var(--bubble);
  animation: drift var(--dur) ease-in-out infinite alternate;
  animation-delay: var(--delay);
  will-change: transform;
}

.floater.hold {
  animation-play-state: paused;
}

.bubble {
  position: relative;
  width: var(--bubble);
  height: var(--bubble);
  padding: 0;
  border: 0;
  background: transparent;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.shell {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.face {
  position: absolute;
  left: 14%;
  top: 14%;
  width: 72%;
  height: 72%;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.numeral {
  transform: scale(0.92);
}

.wobble {
  animation: boing 0.46s ease;
}

.popping {
  animation: burst 0.32s ease forwards;
}

.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.stars i {
  position: absolute;
  left: 50%;
  top: 50%;
  font-style: normal;
  font-size: 22px;
  animation: star-out 0.42s ease-out forwards;
}

.stars i:nth-child(1) {
  --sx: -22px;
  --sy: -30px;
}

.stars i:nth-child(2) {
  --sx: 22px;
  --sy: -24px;
}

.stars i:nth-child(3) {
  --sx: 2px;
  --sy: -38px;
}

.combo {
  position: absolute;
  left: 50%;
  top: 18%;
  z-index: 6;
  margin: 0;
  color: #f59e0b;
  font-size: 42px;
  font-weight: 800;
  pointer-events: none;
  animation: combo-in 0.7s ease forwards;
}

.giant {
  position: absolute;
  left: 50%;
  top: 8%;
  z-index: 6;
  width: min(380px, 100%);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translate3d(-50%, -130%, 0);
  transition: transform 0.9s cubic-bezier(0.22, 0.82, 0.28, 1);
  touch-action: none;
}

.giant.in {
  transform: translate3d(-50%, 0, 0);
}

.giant.gone {
  transform: translate3d(-50%, 0, 0) scale(1.28);
  opacity: 0;
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.giant-face {
  position: absolute;
  left: 14%;
  top: 18%;
  width: 72%;
  height: 64%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  text-align: center;
}

.line {
  color: #1e3a5f;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.pics {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.projectile {
  position: absolute;
  z-index: 5;
  width: 36px;
  height: 36px;
  pointer-events: none;
  transition: none;
}

.projectile.fly {
  transition: transform 0.3s linear;
}

.shooter {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 3;
  width: 220px;
  height: 148px;
  transform: translate3d(-50%, 0, 0);
  pointer-events: none;
}

.pet {
  position: absolute;
  left: 16px;
  bottom: 0;
  width: 128px;
  height: 128px;
  object-fit: contain;
  object-position: center bottom;
}

.gun-wrap {
  position: absolute;
  left: 58px;
  bottom: 6px;
  width: 136px;
}

.gun {
  display: block;
  width: 100%;
  height: auto;
}

.muzzle {
  position: absolute;
  left: 64%;
  top: 8%;
  width: 8px;
  height: 8px;
  transform: translate3d(-50%, -50%, 0);
}

.hint {
  margin: 0;
  font-weight: 700;
  color: #7c4a1e;
}

@keyframes drift {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(var(--dx), var(--dy), 0);
  }
}

@keyframes boing {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  25% {
    transform: translate3d(-7px, 0, 0) rotate(-8deg) scale(1.08);
  }
  50% {
    transform: translate3d(7px, 0, 0) rotate(8deg) scale(0.96);
  }
  75% {
    transform: translate3d(-3px, 0, 0) rotate(-4deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
}

@keyframes burst {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(0.15);
    opacity: 0;
  }
}

@keyframes star-out {
  from {
    transform: translate3d(-50%, -50%, 0) scale(0.4);
  }
  to {
    transform: translate3d(calc(-50% + var(--sx)), calc(-50% + var(--sy)), 0) scale(1.15);
    opacity: 0;
  }
}

@keyframes combo-in {
  0% {
    transform: translate3d(-50%, 12px, 0) scale(0.6);
    opacity: 0;
  }
  30% {
    transform: translate3d(-50%, 0, 0) scale(1.12);
    opacity: 1;
  }
  100% {
    transform: translate3d(-50%, -16px, 0) scale(1);
    opacity: 0;
  }
}
</style>
