<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const words = family.targets.slice(0, 3)
const wordIndex = ref(0)
const tapIndex = ref(0)
const lit = ref(-1)
const locked = ref(true)
const celebrating = ref(false)
const prompt = ref('Listen to the blocks')

const word = computed(() => words[wordIndex.value] ?? words[0])
const letters = computed(() => word.value.split(''))
const progressText = computed(() => `${wordIndex.value + 1} / ${words.length}`)

function speakLetter(letter: string) {
  const onsetAt = family.onsetPool.indexOf(letter)
  if (onsetAt >= 0 && family.warmupPhonemes[onsetAt]) {
    return speak(family.warmupPhonemes[onsetAt].speak)
  }
  return speak(letter)
}

async function demo() {
  locked.value = true
  celebrating.value = false
  tapIndex.value = 0
  prompt.value = 'Listen to the blocks'
  for (let i = 0; i < letters.value.length; i += 1) {
    lit.value = i
    await speakLetter(letters.value[i])
    await new Promise((resolve) => window.setTimeout(resolve, 180))
  }
  lit.value = -1
  await speak(word.value)
  prompt.value = 'Tap in order'
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'You built the words!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/play-gallery')
}

async function onTap(index: number) {
  if (locked.value) return
  if (index !== tapIndex.value) {
    playNudge()
    lit.value = tapIndex.value
    await speakLetter(letters.value[tapIndex.value])
    return
  }
  locked.value = true
  lit.value = index
  playPop()
  await speakLetter(letters.value[index])
  tapIndex.value += 1
  if (tapIndex.value < letters.value.length) {
    locked.value = false
    return
  }
  celebrating.value = true
  prompt.value = word.value
  playSuccess()
  await speak(word.value)
  await new Promise((resolve) => window.setTimeout(resolve, 550))
  if (wordIndex.value >= words.length - 1) {
    await finish()
    return
  }
  wordIndex.value += 1
  await demo()
}

onMounted(() => {
  void demo()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen blend">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">积木拼读 · Blend Blocks</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">先听积木，再按顺序点</p>
    </div>

    <div class="art" :class="{ popin: celebrating }">{{ celebrating ? wordEmoji(word, family) : '🧱' }}</div>
    <p class="center word-label">{{ celebrating ? word : '· · ·' }}</p>

    <div class="blocks">
      <button
        v-for="(letter, index) in letters"
        :key="`${word}-${letter}-${index}`"
        class="block"
        :class="{ lit: lit === index, done: tapIndex > index }"
        type="button"
        :disabled="locked"
        @click="onTap(index)"
      >
        {{ letter }}
      </button>
    </div>

    <p class="center hint">{{ progressText }} · 点错会再听当前块</p>
    <big-button variant="listen" @click="demo">再听积木</big-button>
  </section>
</template>

<style scoped>
.blend {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #7c3aed;
}

.art {
  font-size: 84px;
  line-height: 1;
  text-align: center;
  min-height: 90px;
}

.word-label {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.blocks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 8px 0;
}

.block {
  min-height: 96px;
  border-radius: 24px;
  background: #fff;
  font-size: 40px;
  font-weight: 700;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
}

.block.lit {
  background: #ffe27a;
}

.block.done {
  background: #c8f5d4;
}
</style>
