<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { tweenCelebrate } from '../composables/useMotion'
import { pickPraise, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, sampleWords, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const words = sampleWords(3)
const wordIndex = ref(0)
const lit = ref(-1)
const locked = ref(false)
const celebrating = ref(false)
const prompt = ref('Sing with me')
const stageEl = ref<HTMLElement | null>(null)

const word = computed(() => words[wordIndex.value] ?? words[0])
const letters = computed(() => word.value.split(''))
const lineOne = computed(() => letters.value.join(' - '))
const progressText = computed(() => `${wordIndex.value + 1} / ${words.length}`)

async function chant() {
  locked.value = true
  celebrating.value = false
  prompt.value = 'Sing with me'
  for (let i = 0; i < letters.value.length; i += 1) {
    lit.value = i
    await speak(letters.value[i])
    await new Promise((resolve) => window.setTimeout(resolve, 120))
  }
  lit.value = 99
  await speak(word.value)
  prompt.value = 'Your turn!'
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'What a song!'
  playSuccess()
  await tweenCelebrate(stageEl.value)
  await speak(pickPraise('finish'))
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/play-gallery')
}

async function sangIt() {
  if (locked.value) return
  locked.value = true
  celebrating.value = true
  playPop()
  prompt.value = pickPraise('step')
  void tweenCelebrate(stageEl.value)
  await speak(prompt.value)
  await speak(word.value)
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  if (wordIndex.value >= words.length - 1) {
    await finish()
    return
  }
  wordIndex.value += 1
  await chant()
}

onMounted(() => {
  void chant()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen sing">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">唱一唱 · Sing Along</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">跟着念两句，不用唱准音高</p>
    </div>

    <div ref="stageEl" class="card stage center" :class="{ popin: celebrating }">
      <div class="art">{{ wordEmoji(word, family) }}</div>
      <p class="line" :class="{ on: lit >= 0 && lit < 99 }">
        <span
          v-for="(letter, index) in letters"
          :key="`${word}-${letter}-${index}`"
          :class="{ lit: lit === index }"
        >
          {{ letter }}<template v-if="index < letters.length - 1"> - </template>
        </span>
      </p>
      <p class="line two" :class="{ lit: lit === 99 }">{{ word }}!</p>
    </div>

    <p class="center hint">{{ progressText }} · {{ lineOne }} / {{ word }}!</p>
    <big-button variant="listen" @click="chant">再听一遍</big-button>
    <big-button :disabled="locked" @click="sangIt">我唱好了</big-button>
  </section>
</template>

<style scoped>
.sing {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #be123c;
}

.stage {
  min-height: 220px;
  justify-content: center;
}

.art {
  font-size: 76px;
  line-height: 1;
}

.line {
  margin: 10px 0 0;
  font-size: 28px;
  font-weight: 700;
}

.line.two {
  font-size: 36px;
}

.lit,
.line.lit {
  color: #b45309;
  background: #ffe27a;
  border-radius: 12px;
  padding: 0 6px;
}

span.lit {
  padding: 0 4px;
}
</style>
