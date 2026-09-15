<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { flyStarFrom, tweenShake } from '../composables/useMotion'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const decoy = { word: 'sun', emoji: '☀️' }
const trialIndex = ref(0)
const locked = ref(false)
const celebrating = ref(false)
const shaking = ref('')
const prompt = ref('Listen!')

const trialWord = computed(() => family.targets[trialIndex.value] ?? family.targets[0])
const choices = ref<{ word: string; emoji: string }[]>([])
const progressText = computed(() => `${trialIndex.value + 1} / ${family.targets.length}`)

function makeChoices() {
  const pool = family.targets.map((word) => ({ word, emoji: wordEmoji(word, family) }))
  choices.value = shuffle([...pool, decoy])
}

async function ask() {
  locked.value = true
  celebrating.value = false
  shaking.value = ''
  makeChoices()
  prompt.value = `Where is the ${trialWord.value}?`
  await speak(`Where is the ${trialWord.value}?`)
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'You found them!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push('/play-gallery')
}

async function onTap(word: string, event: MouseEvent) {
  if (locked.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  if (word === trialWord.value) {
    locked.value = true
    celebrating.value = true
    playPop()
    prompt.value = 'Yes!'
    void flyStarFrom(target)
    await speak('Yes!')
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    if (trialIndex.value >= family.targets.length - 1) {
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
  await speak(`Where is the ${trialWord.value}?`)
}

onMounted(() => {
  void ask()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen tap">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">点一点 · Tap Target</p>
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">听一听，点对的图</p>
    </div>

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
  </section>
</template>

<style scoped>
.tap {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0e7490;
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
