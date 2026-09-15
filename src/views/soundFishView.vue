<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import soundFishStage from '../components/soundFishStage.vue'
import type { PondBubble } from '../components/soundFishStage.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { useProgress } from '../composables/useProgress'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { completeGate } = useProgress()
const { isPractice, afterGate, backPath, backLabel } = usePlayMode()

const trialIndex = ref(0)
const failCount = ref(0)
const bubbles = ref<PondBubble[]>([])
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
  bubbles.value = shuffle([
    { letter: letter.toUpperCase(), correct: true, key: `ok-${letter}` },
    { letter: extra[0], correct: false, key: `no-${extra[0]}` },
    { letter: extra[1], correct: false, key: `no-${extra[1]}` },
  ])
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
  if (!isPractice.value) {
    completeGate('soundFish', { sticker: family.rewards.soundFishSticker.id })
  }
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push(afterGate('/word-morph'))
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

async function onTap(bubble: PondBubble) {
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
  await new Promise((resolve) => window.setTimeout(resolve, 360))
  if (shaking.value === bubble.letter) shaking.value = ''
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
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center head">
      <p class="gate-tag">Gate 1 · Sound Fish</p>
      <h1 class="title-lg">听一听，点泡泡</h1>
      <p class="sub">小猫请客 · {{ prompt }} · {{ trial?.ipa }}</p>
    </div>

    <sound-fish-stage
      :bubbles="bubbles"
      :highlight="highlight"
      :shaking="shaking"
      :locked="locked"
      :demoing="demoing"
      :celebrating="celebrating"
      @tap="onTap"
    />

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

.hint {
  margin: 0 0 8px;
}
</style>
