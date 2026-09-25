<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import numberClay from '../components/numberClay.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { flyStarFrom, tweenCelebrate, tweenShake, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import type { MathItem } from '../data/mathLessons'
import { shuffle } from '../data/playGallery'

const {
  level,
  isReplay,
  canPlay,
  gateTag,
  finishLevel,
  goAfterLevel,
  showClearSheet,
  lastResult,
  isChapterPractice,
  chapterComplete,
  chapterNo,
  replayCleared,
  continueAfterClear,
  goLobby,
} = useChapterLevel('numberTap')

const items = computed<MathItem[]>(() => level.value?.numbers ?? [])
const rounds = ref<MathItem[]>([])
const round = ref(0)
const choices = ref<MathItem[]>([])
const locked = ref(true)
const celebrating = ref(false)
const shaking = ref<number | null>(null)
const prompt = ref('Listen!')
const titleEl = ref<HTMLElement | null>(null)

let alive = true

const target = computed(() => rounds.value[round.value])
const progressText = computed(() => `${round.value} / ${Math.max(1, rounds.value.length)}`)

function layoutChoices() {
  choices.value = shuffle(items.value)
}

async function ask() {
  const item = target.value
  if (!alive || !item) return
  locked.value = true
  celebrating.value = false
  shaking.value = null
  layoutChoices()
  prompt.value = item.word
  await speak(item.word)
  if (!alive) return
  locked.value = false
}

async function begin() {
  rounds.value = shuffle(items.value)
  round.value = 0
  if (!canPlay.value) {
    prompt.value = 'Listen!'
    locked.value = true
    layoutChoices()
    return
  }
  await ask()
}

async function finish() {
  celebrating.value = true
  locked.value = true
  prompt.value = 'Nice tapping!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function onTap(item: MathItem, event: Event) {
  if (locked.value || celebrating.value || !canPlay.value) return
  const goal = target.value
  if (!goal) return
  const node = event.currentTarget instanceof Element ? event.currentTarget : null
  if (item.value === goal.value) {
    locked.value = true
    playPop()
    prompt.value = pickPraise('step')
    void flyStarFrom(node)
    await speak(prompt.value)
    if (!alive) return
    if (round.value >= rounds.value.length - 1) {
      await finish()
      return
    }
    round.value += 1
    await ask()
    return
  }
  shaking.value = item.value
  playNudge()
  await tweenShake(node)
  if (shaking.value === item.value) shaking.value = null
  await speak(goal.word)
}

async function replay() {
  if (locked.value || celebrating.value || !target.value) return
  await speak(target.value.word)
}

onMounted(() => {
  void begin()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen tap">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">{{ canPlay ? '听数字，点对的那个' : '先把前面的关卡通完哦' }}</p>
    </div>

    <div class="board">
      <button
        v-for="item in choices"
        :key="item.value"
        type="button"
        class="choice"
        :class="{ shake: shaking === item.value, idle: locked }"
        :disabled="locked"
        :aria-label="String(item.value)"
        @click="onTap(item, $event)"
      >
        <number-clay :value="item.value" size="md" />
      </button>
    </div>

    <p class="center hint">{{ progressText }} · 点对 {{ rounds.length || items.length }} 次就过关</p>
    <big-button variant="listen" :disabled="locked || !canPlay" @click="replay">再听一次</big-button>

    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :chapter-no="chapterNo"
      :from-practice="isChapterPractice"
      :has-next="Boolean(lastResult?.nextLevelId)"
      @replay="replayCleared"
      @next="continueAfterClear"
      @lobby="goLobby"
    />
  </section>
</template>

<style scoped>
.tap {
  gap: 12px;
  max-height: 100dvh;
  overflow-y: auto;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #c2410c;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #c2410c;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0;
}

.choice {
  min-height: 112px;
  padding: 12px 8px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.55);
  display: grid;
  place-items: center;
}

.choice.idle {
  cursor: default;
}

.hint {
  margin: 0 0 8px;
  color: var(--muted);
}
</style>
