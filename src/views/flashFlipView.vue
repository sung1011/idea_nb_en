<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { flyStarFrom, tweenCelebrate, tweenFlipReveal, tweenShake } from '../composables/useMotion'
import { usePlayMode } from '../composables/usePlayMode'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getCurrentFamily, sampleWords, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

type CardFace = {
  word: string
  emoji: string
}

const STUDY_LINGER_MS = 8000

const router = useRouter()
const family = getCurrentFamily()
const { afterGate, backPath, backLabel } = usePlayMode()

const words = sampleWords(4)
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

const studyWord = computed(() => words[studyIndex.value] ?? words[0])
const studyFace = computed<CardFace>(() => ({
  word: studyWord.value,
  emoji: wordEmoji(studyWord.value, family),
}))
const trialWord = computed(() => words[trialIndex.value] ?? words[0])
const progressText = computed(() => {
  if (phase.value === 'study') return `${studyIndex.value + 1} / ${words.length}`
  return `${trialIndex.value + 1} / ${words.length}`
})

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function makeChoices() {
  choices.value = shuffle(words.map((word) => ({ word, emoji: wordEmoji(word, family) })))
}

async function showStudyCard() {
  if (!alive || phase.value !== 'study') return
  locked.value = true
  celebrating.value = false
  revealed.value = false
  prompt.value = 'Look!'
  await tweenFlipReveal(cardEl.value, () => {
    if (phase.value === 'study') revealed.value = true
  })
  if (!alive || phase.value !== 'study') return
  playPop()
  prompt.value = studyWord.value
  await speak(studyWord.value)
  if (!alive || phase.value !== 'study') return
  await wait(STUDY_LINGER_MS)
}

async function runStudy() {
  locked.value = true
  phase.value = 'study'
  prompt.value = 'Look!'
  await speak('Look!')
  for (let i = 0; i < words.length; i += 1) {
    if (!alive || phase.value !== 'study') return
    studyIndex.value = i
    await showStudyCard()
  }
  if (!alive || phase.value !== 'study') return
  await startQuiz()
}

async function startQuiz() {
  if (!alive || quizStarted.value) return
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
  await speak(pickPraise('finish'))
  if (!alive) return
  await wait(700)
  void router.push(afterGate('/play-gallery'))
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
  void runStudy()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen flip">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">闪卡翻翻 · Flash Flip</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">先看卡片，再听一听点对</p>
    </div>

    <div v-if="phase === 'study'" class="study">
      <div ref="cardEl" class="flash-card" :class="{ open: revealed }">
        <div v-if="!revealed" class="face back" aria-hidden="true">
          <span>⭐</span>
        </div>
        <div v-else class="face front">
          <span>{{ studyFace.emoji }}</span>
          <b>{{ studyFace.word }}</b>
        </div>
      </div>
      <p class="center hint">{{ progressText }} · 看完会自己翻下一张</p>
      <big-button variant="soft" :disabled="quizStarted" @click="startQuiz">我看完了</big-button>
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
          <span>{{ choice.emoji }}</span>
          <small>{{ choice.word }}</small>
        </button>
      </div>
      <p class="center hint">{{ progressText }} · 点错会再问一遍</p>
      <big-button variant="listen" :disabled="locked" @click="ask">再听一次</big-button>
    </template>
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

.study {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.flash-card {
  min-height: 260px;
  border-radius: 32px;
  background: #fff;
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

.face span {
  font-size: 96px;
  line-height: 1;
}

.face.back span {
  font-size: 72px;
}

.face b {
  font-size: 40px;
  letter-spacing: 0.02em;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0;
}

.target {
  min-height: 120px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  justify-items: center;
  gap: 4px;
  font-weight: 700;
}

.target span {
  font-size: 48px;
}

.target.cheer {
  background: #c8f5d4;
}

.hint {
  margin: 0 0 8px;
}
</style>
