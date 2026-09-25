<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import numberClay from '../components/numberClay.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { flyStarFrom, tweenCelebrate, tweenShake, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { countPieces, type CountPiece, type MathItem } from '../data/mathLessons'
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
} = useChapterLevel('numberCount')

const items = computed<MathItem[]>(() => level.value?.numbers ?? [])
const rounds = ref<MathItem[]>([])
const round = ref(0)
const choices = ref<MathItem[]>([])
const locked = ref(true)
const celebrating = ref(false)
const shaking = ref<number | null>(null)
const prompt = ref('Count!')
const titleEl = ref<HTMLElement | null>(null)

let alive = true

const target = computed(() => rounds.value[round.value])
const piles = computed(() => countPieces(target.value?.value ?? 0))
const glyph = computed(() => ((target.value?.value ?? 0) % 2 === 0 ? '★' : '🍎'))
const progressText = computed(() => `${round.value} / ${Math.max(1, rounds.value.length)}`)

function layoutChoices() {
  choices.value = shuffle(items.value)
}

async function ask() {
  if (!alive || !target.value) return
  locked.value = true
  celebrating.value = false
  shaking.value = null
  layoutChoices()
  prompt.value = 'Count!'
  await speak('Count!')
  if (!alive) return
  locked.value = false
}

async function begin() {
  rounds.value = shuffle(items.value)
  round.value = 0
  layoutChoices()
  if (!canPlay.value) {
    locked.value = true
    prompt.value = 'Count!'
    return
  }
  await ask()
}

async function hearPiece(piece: CountPiece) {
  if (celebrating.value) return
  playPop()
  await speak(piece.speak)
}

async function hearZero() {
  if (celebrating.value) return
  playPop()
  await speak('zero')
}

async function finish() {
  celebrating.value = true
  locked.value = true
  prompt.value = 'Nice counting!'
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
  await speak('Count!')
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
  <section class="screen count">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">{{ canPlay ? '点一点数，再点对的数字' : '先把前面的关卡通完哦' }}</p>
    </div>

    <div class="piles" aria-label="数一数">
      <button
        v-if="target?.value === 0"
        type="button"
        class="empty-plate"
        aria-label="zero"
        @click="hearZero"
      >
        <span aria-hidden="true">🍽️</span>
        <span>空盘子</span>
      </button>
      <button
        v-for="piece in piles.tens"
        :key="`ten-${piece.index}`"
        type="button"
        class="ten-bar"
        :aria-label="piece.speak"
        @click="hearPiece(piece)"
      >
        <span v-for="pip in 10" :key="pip" class="pip">{{ glyph }}</span>
      </button>
      <div v-if="piles.ones.length" class="ones">
        <button
          v-for="piece in piles.ones"
          :key="`one-${piece.index}`"
          type="button"
          class="one"
          :aria-label="piece.speak"
          @click="hearPiece(piece)"
        >
          {{ glyph }}
        </button>
      </div>
    </div>

    <div class="board">
      <button
        v-for="item in choices"
        :key="item.value"
        type="button"
        class="choice"
        :class="{ shake: shaking === item.value }"
        :disabled="locked"
        :aria-label="String(item.value)"
        @click="onTap(item, $event)"
      >
        <number-clay :value="item.value" size="sm" />
      </button>
    </div>

    <p class="center hint">{{ progressText }} · 点对 {{ rounds.length || items.length }} 次就过关</p>

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
.count {
  gap: 10px;
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

.piles {
  display: grid;
  gap: 6px;
  max-height: 248px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.55);
}

.ten-bar {
  min-height: 32px;
  padding: 3px 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fffef8 0%, #ffe7a3 100%);
  border: 3px solid #f0c36a;
  box-shadow: 0 4px 0 #f4b400;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  align-items: center;
  justify-items: center;
}

.pip {
  font-size: 14px;
  line-height: 1;
}

.empty-plate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 72px;
  border-radius: 22px;
  border: 3px dashed #f0c36a;
  background: #fffef8;
  color: #c2410c;
  font-size: 18px;
  font-weight: 800;
}

.ones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.one {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
  font-size: 22px;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.choice {
  min-height: 76px;
  padding: 8px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.55);
  display: grid;
  place-items: center;
}

.hint {
  margin: 0;
  color: var(--muted);
}
</style>
