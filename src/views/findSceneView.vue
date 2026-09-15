<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { backPath, backLabel } = usePlayMode()

const targets = family.targets.slice(0, 3)
const found = ref<string[]>([])
const celebrating = ref(false)
const prompt = ref('Find cat, hat, and mat!')

const foundCount = computed(() => found.value.length)

async function finish() {
  celebrating.value = true
  prompt.value = 'You found the party!'
  playSuccess()
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  void router.push('/play-gallery')
}

async function onFind(word: string) {
  if (celebrating.value || found.value.includes(word)) return
  found.value = [...found.value, word]
  playPop()
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
      <h1 class="title-lg">{{ prompt }}</h1>
      <p class="sub">点出派对里的 cat / hat / mat</p>
    </div>

    <div class="scene">
      <div class="sky" />
      <button class="deco palm" type="button" @click="onMiss">🌴</button>
      <button class="deco balloon" type="button" @click="onMiss">🎈</button>
      <button class="deco gift" type="button" @click="onMiss">🎁</button>
      <button
        class="mark cat"
        :class="{ found: found.includes('cat') }"
        type="button"
        @click="onFind('cat')"
      >
        {{ wordEmoji('cat', family) }}
      </button>
      <button
        class="mark hat"
        :class="{ found: found.includes('hat') }"
        type="button"
        @click="onFind('hat')"
      >
        {{ wordEmoji('hat', family) }}
      </button>
      <button
        class="mark mat"
        :class="{ found: found.includes('mat') }"
        type="button"
        @click="onFind('mat')"
      >
        {{ wordEmoji('mat', family) }}
      </button>
      <div class="ground" />
    </div>

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

.scene {
  position: relative;
  flex: 1;
  min-height: 280px;
  border-radius: 32px;
  overflow: hidden;
  background: linear-gradient(180deg, #7ec8e3 0%, #d7f4c2 58%, #b8e986 100%);
}

.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 54px;
  background: #7dce7f;
  border-radius: 40% 40% 0 0;
}

.deco,
.mark {
  position: absolute;
  background: transparent;
  font-size: 42px;
  min-width: 56px;
  min-height: 56px;
}

.palm {
  left: 10px;
  top: 18px;
}

.balloon {
  right: 16px;
  top: 24px;
}

.gift {
  right: 28px;
  bottom: 64px;
  font-size: 34px;
}

.cat {
  left: 42%;
  top: 36%;
  font-size: 52px;
}

.hat {
  left: 18px;
  bottom: 72px;
}

.mat {
  right: 88px;
  bottom: 58px;
}

.mark.found {
  filter: drop-shadow(0 0 10px #ffe27a);
  transform: scale(1.08);
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
