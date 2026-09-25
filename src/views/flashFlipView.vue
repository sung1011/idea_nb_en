<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import { flyStarFrom, tweenCelebrate, tweenFlipReveal, tweenShake, waitAfterStar } from '../composables/useMotion'
import { useChapterLevel } from '../composables/useChapterLevel'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import wordPic from '../components/wordPic.vue'
import { wordZh } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'
import {
  gateFlashStudyHint,
  gateFlashStudyNext,
  gateFlashStudyPrev,
  gateFlashSub,
} from '../data/todayTasks'

type CardFace = {
  word: string
}

const {
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
  themeHint,
  takeRunWords,
} = useChapterLevel('flashFlip')

const words = takeRunWords(4)
const flashSub = computed(() => gateFlashSub(themeHint.value))
const phase = ref<'study' | 'quiz'>('study')
const quizStarted = ref(false)
const studyIndex = ref(0)
const trialIndex = ref(0)
const revealed = ref(false)
const locked = ref(true)
const celebrating = ref(false)
const shaking = ref('')
const prompt = ref('Look!')
const cardEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const choices = ref<CardFace[]>([])

let alive = true
let studyToken = 0

const studyCount = computed(() => Math.max(1, words.length))
const studyWord = computed(() => words[studyIndex.value] ?? words[0])
const studyFace = computed<CardFace>(() => ({
  word: studyWord.value,
}))
const studyZh = computed(() => wordZh(studyWord.value))
const trialWord = computed(() => words[trialIndex.value] ?? words[0])
const isFirstStudy = computed(() => studyIndex.value <= 0)
const isLastStudy = computed(() => studyIndex.value >= studyCount.value - 1)
const progressText = computed(() => {
  if (phase.value === 'study') return `${studyIndex.value + 1}/${studyCount.value}`
  return `${trialIndex.value + 1}/${studyCount.value}`
})
const studyHint = computed(() =>
  gateFlashStudyHint(studyIndex.value + 1, studyCount.value, isLastStudy.value),
)
const nextStudyLabel = computed(() => gateFlashStudyNext(isLastStudy.value))
const prevStudyLabel = computed(() => gateFlashStudyPrev())

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function bumpStudyToken() {
  studyToken += 1
  return studyToken
}

function makeChoices() {
  choices.value = shuffle(words.map((word) => ({ word })))
}

async function showStudyCard() {
  const token = bumpStudyToken()
  if (!alive || phase.value !== 'study') return
  locked.value = true
  celebrating.value = false
  revealed.value = false
  prompt.value = 'Look!'
  await tweenFlipReveal(cardEl.value, () => {
    if (phase.value === 'study' && token === studyToken) revealed.value = true
  })
  if (!alive || phase.value !== 'study' || token !== studyToken) return
  playPop()
  prompt.value = studyWord.value
  locked.value = false
  await speak(studyWord.value)
}

async function replayStudy() {
  if (phase.value !== 'study' || locked.value || !revealed.value) return
  playPop()
  await speak(studyWord.value)
}

async function beginStudy() {
  locked.value = true
  phase.value = 'study'
  quizStarted.value = false
  studyIndex.value = 0
  prompt.value = 'Look!'
  await speak('Look!')
  if (!alive || phase.value !== 'study') return
  await showStudyCard()
}

async function goNextStudy() {
  if (phase.value !== 'study' || locked.value) return
  if (isLastStudy.value) {
    await startQuiz()
    return
  }
  stopSpeech()
  studyIndex.value += 1
  await showStudyCard()
}

async function goPrevStudy() {
  if (phase.value !== 'study' || locked.value || isFirstStudy.value) return
  stopSpeech()
  studyIndex.value -= 1
  await showStudyCard()
}

async function startQuiz() {
  if (!alive || quizStarted.value || phase.value !== 'study') return
  if (!isLastStudy.value) return
  bumpStudyToken()
  stopSpeech()
  quizStarted.value = true
  phase.value = 'quiz'
  trialIndex.value = 0
  celebrating.value = false
  shaking.value = ''
  await ask()
}

async function ask() {
  if (!alive) return
  locked.value = true
  celebrating.value = false
  shaking.value = ''
  makeChoices()
  prompt.value = `Find the ${trialWord.value}!`
  await speak(`Find the ${trialWord.value}!`)
  if (!alive) return
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'You flipped them!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function onTap(word: string, event: MouseEvent) {
  if (phase.value !== 'quiz' || locked.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  if (word === trialWord.value) {
    locked.value = true
    celebrating.value = true
    playPop()
    unlockWord(word)
    prompt.value = pickPraise('step')
    void flyStarFrom(target)
    await speak(prompt.value)
    if (!alive) return
    await wait(450)
    if (trialIndex.value >= words.length - 1) {
      await finish()
      return
    }
    trialIndex.value += 1
    await ask()
    return
  }
  shaking.value = word
  playNudge()
  await tweenShake(target)
  if (shaking.value === word) shaking.value = ''
  await speak(`Find the ${trialWord.value}!`)
}

onMounted(() => {
  void beginStudy()
})

onUnmounted(() => {
  alive = false
  bumpStudyToken()
  stopSpeech()
})
</script>

<template>
  <section class="screen flip">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">{{ flashSub }}</p>
    </div>

    <div v-if="phase === 'study'" class="study">
      <button
        ref="cardEl"
        class="flash-card"
        :class="{ open: revealed }"
        type="button"
        :disabled="locked || !revealed"
        :aria-label="revealed ? studyFace.word : 'Look!'"
        @click="replayStudy"
      >
        <div v-if="!revealed" class="face back" aria-hidden="true">
          <span>⭐</span>
        </div>
        <div v-else class="face front">
          <word-pic :word="studyFace.word" :size="140" />
          <div class="name">
            <b>{{ studyFace.word }}</b>
            <span v-if="studyZh" class="zh">{{ studyZh }}</span>
          </div>
        </div>
      </button>
      <p class="center hint">{{ studyHint }}</p>
      <div class="study-nav" :class="{ solo: isFirstStudy }">
        <big-button v-if="!isFirstStudy" variant="soft" :disabled="locked" @click="goPrevStudy">
          {{ prevStudyLabel }}
        </big-button>
        <big-button :variant="isLastStudy ? 'primary' : 'soft'" :disabled="locked" @click="goNextStudy">
          {{ nextStudyLabel }}
        </big-button>
      </div>
      <big-button variant="listen" :disabled="locked || !revealed" @click="replayStudy">再听一遍</big-button>
    </div>

    <template v-else>
      <div class="board">
        <button
          v-for="choice in choices"
          :key="choice.word"
          class="target"
          :class="{ cheer: celebrating && choice.word === trialWord, shake: shaking === choice.word }"
          type="button"
          :disabled="locked"
          @click="onTap(choice.word, $event)"
        >
          <word-pic :word="choice.word" :size="64" />
          <div class="name">
            <small>{{ choice.word }}</small>
            <span v-if="wordZh(choice.word)" class="zh">{{ wordZh(choice.word) }}</span>
          </div>
        </button>
      </div>
      <p class="center hint">{{ progressText }} · 点错会再问一遍</p>
      <big-button variant="listen" :disabled="locked" @click="ask">再听一次</big-button>
    </template>
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
.flip {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #7c3aed;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #7c3aed;
}

.study {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.flash-card {
  width: 100%;
  min-height: 0;
  border: 0;
  padding: 12px 16px;
  border-radius: 32px;
  background: #fff;
  color: inherit;
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  place-items: center;
  perspective: 900px;
  transform-style: preserve-3d;
}

.flash-card.open {
  background: #fff7d6;
}

.face {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.face :deep(.word-pic) {
  width: 140px;
  height: 140px;
}

.face.back span {
  font-size: 72px;
}

.name {
  display: grid;
  justify-items: center;
  text-align: center;
}

.face b {
  font-size: 40px;
  line-height: 1.05;
  letter-spacing: 0.02em;
}

.face .zh {
  font-size: 23px;
  line-height: 1.15;
  font-weight: 650;
  color: #8a7564;
}

.study-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.study-nav.solo {
  grid-template-columns: 1fr;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0;
}

.target {
  min-height: 112px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  font-weight: 700;
  padding: 8px 6px;
}

.target small {
  font-size: 18px;
  line-height: 1.1;
}

.target .zh {
  font-size: 11px;
  line-height: 1.1;
  font-weight: 650;
  color: #8a7564;
}

.target :deep(.word-pic) {
  width: 64px;
  height: 64px;
}

.target.cheer {
  background: #c8f5d4;
}

.hint {
  margin: 0;
}

@media (max-height: 700px) {
  .flip {
    gap: 8px;
  }

  .study {
    gap: 8px;
    margin-top: 0;
  }

  .study :deep(.big-btn) {
    min-height: 52px;
    padding: 8px 14px;
    font-size: 18px;
  }

  .board {
    gap: 8px;
    margin: 4px 0;
  }
}
</style>
