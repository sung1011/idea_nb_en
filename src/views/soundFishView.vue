<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { useProgress } from '../composables/useProgress'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily } from '../data/phonicsFamily'

type Bubble = {
  letter: string
  correct: boolean
  key: string
}

const router = useRouter()
const family = getCurrentFamily()
const { completeGate } = useProgress()

const trialIndex = ref(0)
const failCount = ref(0)
const bubbles = ref<Bubble[]>([])
const highlight = ref('')
const shaking = ref('')
const locked = ref(true)
const demoing = ref(true)
const celebrating = ref(false)
const prompt = ref('Listen!')

const trial = computed(() => family.warmupPhonemes[trialIndex.value])
const progressText = computed(() => `${trialIndex.value + 1} / ${family.warmupPhonemes.length}`)

function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function makeBubbles(letter: string) {
  const extra = shuffle(family.distractors).slice(0, 2).map((item) => item.toUpperCase())
  const mix = shuffle([
    { letter: letter.toUpperCase(), correct: true, key: `ok-${letter}` },
    { letter: extra[0], correct: false, key: `no-${extra[0]}` },
    { letter: extra[1], correct: false, key: `no-${extra[1]}` },
  ])
  bubbles.value = mix
}

async function playPhoneme() {
  if (!trial.value) return
  await speak('Listen!')
  await speak(trial.value.speak)
}

function setupTrial(showDemo: boolean) {
  if (!trial.value) return
  failCount.value = 0
  highlight.value = ''
  shaking.value = ''
  celebrating.value = false
  makeBubbles(trial.value.letter)
  locked.value = true
  demoing.value = showDemo
  prompt.value = showDemo ? 'Listen!' : 'Your turn!'
}

async function runDemo() {
  setupTrial(true)
  await playPhoneme()
  highlight.value = trial.value.letter.toUpperCase()
  await new Promise((resolve) => window.setTimeout(resolve, 1100))
  highlight.value = ''
  demoing.value = false
  prompt.value = 'Your turn!'
  locked.value = false
}

async function runPlay() {
  setupTrial(false)
  await playPhoneme()
  locked.value = false
}

async function finishGate() {
  celebrating.value = true
  prompt.value = 'Nice listening!'
  playSuccess()
  completeGate('soundFish', { sticker: family.rewards.soundFishSticker.id })
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/word-morph')
}

async function passTrial() {
  celebrating.value = true
  playSuccess()
  prompt.value = 'Yes!'
  await speak('Yes!')
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  if (trialIndex.value >= family.warmupPhonemes.length - 1) {
    await finishGate()
    return
  }
  trialIndex.value += 1
  await runPlay()
}

async function autoHelp() {
  locked.value = true
  prompt.value = 'Together!'
  highlight.value = trial.value.letter.toUpperCase()
  playNudge()
  await speak(trial.value.speak)
  await new Promise((resolve) => window.setTimeout(resolve, 600))
  await passTrial()
}

async function onTap(bubble: Bubble) {
  if (locked.value || demoing.value) return
  if (bubble.correct) {
    locked.value = true
    highlight.value = bubble.letter
    playPop()
    await passTrial()
    return
  }
  failCount.value += 1
  shaking.value = bubble.letter
  playNudge()
  window.setTimeout(() => {
    if (shaking.value === bubble.letter) shaking.value = ''
  }, 360)
  await speak(trial.value.speak)
  if (failCount.value >= 2) {
    await autoHelp()
  }
}

onMounted(() => {
  void runDemo()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen fish">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">回家</button>
      <star-bar />
    </header>

    <div class="center head">
      <p class="gate-tag">Gate 1 · Sound Fish</p>
      <h1 class="title-lg">听一听，点泡泡</h1>
      <p class="sub">{{ prompt }} · {{ trial?.ipa }}</p>
    </div>

    <div class="pond">
      <div class="fishy floaty" aria-hidden="true">🐠</div>
      <button
        v-for="(bubble, index) in bubbles"
        :key="bubble.key"
        class="bubble"
        :class="{
          highlight: highlight === bubble.letter,
          shake: shaking === bubble.letter,
          cheer: celebrating && bubble.correct,
          delay0: index === 0,
          delay1: index === 1,
          delay2: index === 2,
        }"
        type="button"
        :disabled="locked"
        @click="onTap(bubble)"
      >
        {{ bubble.letter }}
      </button>
    </div>

    <p class="center hint">{{ progressText }} · 点错会再听一遍</p>
    <big-button variant="listen" :disabled="locked && !demoing" @click="playPhoneme">
      再听一次
    </big-button>
  </section>
</template>

<style scoped>
.fish {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0e7490;
}

.head {
  margin-bottom: 4px;
}

.pond {
  position: relative;
  flex: 1;
  min-height: 280px;
  margin: 8px -6px;
  border-radius: 36px;
  background: linear-gradient(180deg, #7fd8e8 0%, #3db8c7 70%, #2a9aa8 100%);
  box-shadow: inset 0 -18px 0 rgba(14, 80, 90, 0.12);
  overflow: hidden;
}

.fishy {
  position: absolute;
  left: 16px;
  top: 16px;
  font-size: 42px;
}

.bubble {
  position: absolute;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #0e4b6b;
  font-size: 44px;
  font-weight: 700;
  box-shadow: 0 8px 0 rgba(14, 80, 90, 0.16);
  animation: floaty 2.8s ease-in-out infinite;
}

.bubble.delay0 {
  left: 28px;
  top: 88px;
}

.bubble.delay1 {
  right: 28px;
  top: 58px;
  animation-delay: 0.4s;
}

.bubble.delay2 {
  left: 50%;
  margin-left: -48px;
  bottom: 36px;
  animation-delay: 0.8s;
}

.bubble.highlight {
  animation: pulse 0.9s ease;
  background: #ffe27a;
}

.bubble.cheer {
  background: #c8f5d4;
}

.hint {
  margin: 0 0 8px;
}
</style>
