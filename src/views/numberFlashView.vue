<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import numberClay from '../components/numberClay.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, tweenFlipReveal, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import type { MathItem } from '../data/mathLessons'

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
} = useChapterLevel('numberFlash')

const items = computed<MathItem[]>(() => level.value?.numbers ?? [])
const index = ref(0)
const revealed = ref(false)
const locked = ref(true)
const celebrating = ref(false)
const prompt = ref('Look!')
const cardEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)

let alive = true
let token = 0

const total = computed(() => Math.max(1, items.value.length))
const current = computed(() => items.value[index.value] ?? items.value[0])
const isFirst = computed(() => index.value <= 0)
const isLast = computed(() => index.value >= items.value.length - 1)
const hint = computed(() => {
  const mark = `${index.value + 1}/${total.value}`
  if (!canPlay.value) return `${mark} · 先把前面的关卡通完哦`
  if (isLast.value) return `${mark} · 看完就可以过关啦`
  return `${mark} · 一张一张看，听一听句子`
})

function bump() {
  token += 1
  return token
}

async function showCard() {
  const stamp = bump()
  const item = current.value
  if (!alive || !item) return
  locked.value = true
  revealed.value = false
  prompt.value = 'Look!'
  await tweenFlipReveal(cardEl.value, () => {
    if (stamp === token) revealed.value = true
  })
  if (!alive || stamp !== token) return
  playPop()
  prompt.value = item.word
  locked.value = false
  await speak(item.sentence)
}

async function replay() {
  const item = current.value
  if (locked.value || !revealed.value || !item) return
  playPop()
  await speak(item.sentence)
}

function hearChinese(event: Event) {
  event.stopPropagation()
  const line = current.value?.zh?.trim()
  if (!line) return
  void speak(line, 'zh-CN', 0.9)
}

async function begin() {
  index.value = 0
  await showCard()
}

async function goNext() {
  if (locked.value) return
  if (isLast.value) {
    await finish()
    return
  }
  stopSpeech()
  index.value += 1
  await showCard()
}

async function goPrev() {
  if (locked.value || isFirst.value) return
  stopSpeech()
  index.value -= 1
  await showCard()
}

async function finish() {
  if (!canPlay.value || locked.value || celebrating.value) return
  if (!isLast.value) return
  locked.value = true
  celebrating.value = true
  prompt.value = 'You counted!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

onMounted(() => {
  void begin()
})

onUnmounted(() => {
  alive = false
  bump()
  stopSpeech()
})
</script>

<template>
  <section class="screen flash">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">看数字，听句子</p>
    </div>

    <div
      ref="cardEl"
      class="flash-card"
      :class="{ open: revealed }"
      role="button"
      tabindex="0"
      :aria-label="revealed && current ? `${current.value} ${current.word}` : 'Look!'"
      @click="replay"
      @keydown.enter.prevent="replay"
      @keydown.space.prevent="replay"
    >
      <div v-if="!revealed" class="face back" aria-hidden="true">
        <span>⭐</span>
      </div>
      <div v-else-if="current" class="face front">
        <number-clay :value="current.value" size="lg" />
        <div class="name">
          <b>{{ current.word }}</b>
          <div v-if="current.zh" class="zh-row">
            <span class="zh">{{ current.zh }}</span>
            <button type="button" class="zh-hear" aria-label="读中文" @click="hearChinese">
              <span aria-hidden="true">🔊</span>中
            </button>
          </div>
        </div>
      </div>
    </div>

    <p class="center hint">{{ hint }}</p>
    <div class="study-nav" :class="{ solo: isFirst }">
      <big-button v-if="!isFirst" variant="soft" :disabled="locked" @click="goPrev">上一张</big-button>
      <big-button :variant="isLast ? 'primary' : 'soft'" :disabled="locked || (isLast && !canPlay)" @click="goNext">
        {{ isLast ? '我看完了' : '下一张' }}
      </big-button>
    </div>
    <big-button variant="listen" :disabled="locked || !revealed" @click="replay">再听一遍</big-button>

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
.flash {
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

.flash-card {
  width: 100%;
  min-height: 220px;
  margin-top: 8px;
  padding: 16px;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.flash-card.open {
  background: #fff7d6;
}

.face {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.face.back span {
  font-size: 72px;
}

.name {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 2px;
}

.face b {
  font-size: 32px;
  line-height: 1.1;
}

.zh-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.zh {
  font-size: 22px;
  font-weight: 650;
  color: #8a7564;
}

.zh-hear {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  border-radius: 999px;
  background: #e7f6e3;
  color: #1f6b45;
  box-shadow: 0 3px 0 #7dcea0;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hint {
  margin: 0;
  color: var(--muted);
}

.study-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.study-nav.solo {
  grid-template-columns: 1fr;
}
</style>
