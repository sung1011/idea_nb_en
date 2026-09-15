<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { useProgress } from '../composables/useProgress'
import { playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { completeGate } = useProgress()

const sequence = family.morphSequence
const step = ref(0)
const currentWord = ref(sequence[0])
const celebrating = ref(false)
const locked = ref(false)

const targetWord = computed(() => sequence[Math.min(step.value + 1, sequence.length - 1)])
const art = computed(() => wordEmoji(currentWord.value, family))
const letters = computed(() => currentWord.value.split(''))
const done = computed(() => step.value >= sequence.length - 1)
const prompt = computed(() => (done.value ? 'You did it!' : `Make ${targetWord.value}!`))

async function speakWord(word: string) {
  await speak(word)
}

async function finishGate() {
  playSuccess()
  completeGate('wordMorph', { decoration: family.rewards.wordMorphDecoration.id })
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/echo-cave')
}

async function onPick(onset: string) {
  if (locked.value || done.value) return
  const nextWord = `${onset}${family.rime}`
  currentWord.value = nextWord
  playPop()
  celebrating.value = nextWord === targetWord.value
  await speakWord(nextWord)
  if (nextWord !== targetWord.value) return

  locked.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 550))
  step.value += 1
  if (step.value >= sequence.length - 1) {
    await finishGate()
    return
  }
  celebrating.value = false
  locked.value = false
}

onMounted(() => {
  void speak(`Make ${sequence[1]}!`)
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen morph">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">回家</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">Gate 2 · Word Morph</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">只换第一个字母，a 和 t 锁住啦</p>
    </div>

    <div class="stage card center" :class="{ popin: celebrating }">
      <div class="art" :class="{ popin: celebrating }">{{ art }}</div>
      <p class="word-label">{{ currentWord }}</p>
      <div class="tiles" aria-label="单词字母">
        <button class="tile onset" type="button">{{ letters[0]?.toUpperCase() }}</button>
        <button class="tile lock" type="button" disabled>{{ letters[1]?.toUpperCase() }}</button>
        <button class="tile lock" type="button" disabled>{{ letters[2]?.toUpperCase() }}</button>
      </div>
    </div>

    <p class="center hint">点下面的字母，变成 {{ targetWord }}</p>
    <div class="onset-row">
      <button
        v-for="onset in family.onsetPool"
        :key="onset"
        class="onset-btn"
        type="button"
        :disabled="locked"
        @click="onPick(onset)"
      >
        {{ onset.toUpperCase() }}
      </button>
    </div>
    <big-button variant="listen" @click="speakWord(currentWord)">听这个词</big-button>
  </section>
</template>

<style scoped>
.morph {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #b45309;
}

.stage {
  margin-top: 8px;
}

.art {
  font-size: 84px;
  line-height: 1;
  min-height: 90px;
}

.word-label {
  margin: 4px 0 12px;
  font-size: 28px;
  font-weight: 700;
}

.tiles {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.tile {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  font-size: 36px;
  font-weight: 700;
}

.onset {
  background: #ffe27a;
  color: #7a4e00;
  box-shadow: 0 6px 0 #f4b400;
}

.lock {
  background: #e7eef5;
  color: #7b8794;
  box-shadow: 0 6px 0 #c9d4de;
}

.onset-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 4px 0 8px;
}

.onset-btn {
  min-height: 84px;
  border-radius: 24px;
  background: #fff;
  font-size: 40px;
  font-weight: 700;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
}

.onset-btn:active:not(:disabled) {
  transform: translateY(3px);
}
</style>
