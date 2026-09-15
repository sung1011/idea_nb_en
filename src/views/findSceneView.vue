<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import findSceneStage from '../components/findSceneStage.vue'
import starBar from '../components/starBar.vue'
import { tweenCelebrate } from '../composables/useMotion'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { afterGate, backPath, backLabel } = usePlayMode()

const targets = family.targets.slice(0, 3)
const found = ref<string[]>([])
const celebrating = ref(false)
const prompt = ref('Find cat, hat, and mat!')
const titleEl = ref<HTMLElement | null>(null)

const foundCount = computed(() => found.value.length)

async function finish() {
  celebrating.value = true
  prompt.value = 'You found the party!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  void router.push(afterGate('/play-gallery'))
}

async function onFind(word: string) {
  if (celebrating.value || found.value.includes(word)) return
  found.value = [...found.value, word]
  playPop()
  unlockWord(word)
  prompt.value = `Found ${word}!`
  await speak(word)
  if (found.value.length >= targets.length) {
    await finish()
  }
}

function onMiss() {
  if (celebrating.value) return
  playNudge()
  prompt.value = 'Keep looking!'
}

onMounted(() => {
  void speak('Find the cat, hat, and mat')
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen find">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">找一找 · Find Scene</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">点出派对里的 cat / hat / mat</p>
    </div>

    <find-scene-stage :found="found" :locked="celebrating" @find="onFind" @miss="onMiss" />

    <div class="chips">
      <span v-for="word in targets" :key="word" :class="{ on: found.includes(word) }">
        {{ wordEmoji(word, family) }} {{ word }}
      </span>
    </div>
    <p class="center hint">{{ foundCount }}/3 · 点到气球或树会轻轻提醒</p>
  </section>
</template>

<style scoped>
.find {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0369a1;
}

.chips {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.chips span {
  flex: 1;
  min-height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #f3f7fb;
  font-weight: 700;
}

.chips span.on {
  background: #e4f8ec;
}
</style>
