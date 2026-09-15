<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const trialIndex = ref(0)
const locked = ref(false)
const celebrating = ref(false)
const shaking = ref('')
const prompt = ref('Listen!')
const choices = ref<string[]>([])

const trial = computed(() => family.warmupPhonemes[trialIndex.value])
const answer = computed(() => family.targets[trialIndex.value] ?? family.targets[0])
const progressText = computed(() => `${trialIndex.value + 1} / ${family.warmupPhonemes.length}`)

function makeChoices() {
  choices.value = shuffle([...family.targets])
}

async function ask() {
  locked.value = true
  celebrating.value = false
  shaking.value = ''
  makeChoices()
  prompt.value = `Which starts with ${trial.value.ipa}?`
  await speak(`Which starts with ${trial.value.speak}?`)
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'Nice hunting!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/play-gallery')
}

async function onTap(word: string) {
  if (locked.value) return
  if (word === answer.value) {
    locked.value = true
    celebrating.value = true
    playPop()
    prompt.value = 'Yes!'
    await speak('Yes!')
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    if (trialIndex.value >= family.warmupPhonemes.length - 1) {
      await finish()
      return
    }
    trialIndex.value += 1
    await ask()
    return
  }
  shaking.value = word
  playNudge()
  window.setTimeout(() => {
    if (shaking.value === word) shaking.value = ''
  }, 360)
  await speak(`Which starts with ${trial.value.speak}?`)
}

onMounted(() => {
  void ask()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen hunt">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">找尾巴 · Onset Hunt</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">哪个词是 {{ trial?.ipa }} 开头？</p>
    </div>

    <div class="pics">
      <button
        v-for="word in choices"
        :key="word"
        class="pic"
        :class="{ cheer: celebrating && word === answer, shake: shaking === word }"
        type="button"
        :disabled="locked"
        @click="onTap(word)"
      >
        <span>{{ wordEmoji(word, family) }}</span>
        <small>{{ word }}</small>
      </button>
    </div>

    <p class="center hint">{{ progressText }} · 点错会再听开头音</p>
    <big-button variant="listen" :disabled="locked" @click="ask">再听一次</big-button>
  </section>
</template>

<style scoped>
.hunt {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0f766e;
}

.pics {
  display: grid;
  gap: 12px;
  margin: 8px 0;
}

.pic {
  min-height: 88px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  padding: 0 18px;
  font-size: 22px;
  font-weight: 700;
  text-align: left;
}

.pic span {
  font-size: 40px;
}

.pic.cheer {
  background: #c8f5d4;
}
</style>
