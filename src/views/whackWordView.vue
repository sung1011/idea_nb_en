<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import { flyStarFrom, tweenCelebrate, tweenPopDown, tweenPopUp, tweenShake, waitAfterStar } from '../composables/useMotion'
import { useChapterLevel } from '../composables/useChapterLevel'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import wordPic from '../components/wordPic.vue'
import { pickOtherWords, sampleWords } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

type Mole = {
  hole: number
  word: string
}

const NEED_CORRECT = 4

const {
  isReplay,
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
  goPractice,
  goLobby,
} = useChapterLevel('whackWord')

const words = sampleWords(5)
const extra = pickOtherWords(words, 1)
const holes = [0, 1, 2, 3]
const moles = ref<Mole[]>([])
const wave = ref(0)
const correctCount = ref(0)
const caught = ref<string[]>([])
const locked = ref(true)
const celebrating = ref(false)
const shaking = ref('')
const prompt = ref('Listen!')
const titleEl = ref<HTMLElement | null>(null)

let alive = true

const progressText = computed(() => `${correctCount.value} / ${NEED_CORRECT}`)
const targetWord = computed(() => words[wave.value % words.length] ?? words[0])
const moleByHole = computed(() => {
  const map: Record<number, Mole | undefined> = {}
  for (const mole of moles.value) map[mole.hole] = mole
  return map
})

function moleEl(hole: number): HTMLElement | null {
  return document.querySelector(`[data-mole-hole="${hole}"]`)
}

function buildMoles(target: string): Mole[] {
  const others = shuffle([...words.filter((word) => word !== target), ...extra])
  const picks = [target, others[0], others[1]].filter(Boolean)
  const holeOrder = shuffle([...holes]).slice(0, picks.length)
  return holeOrder.map((hole, index) => {
    const word = picks[index]
    return {
      hole,
      word,
    }
  })
}

async function hideMoles() {
  const els = moles.value
    .map((mole) => moleEl(mole.hole))
    .filter((el): el is HTMLElement => Boolean(el))
  await Promise.all(els.map((el) => tweenPopDown(el)))
  moles.value = []
}

async function showWave() {
  if (!alive || celebrating.value) return
  locked.value = true
  shaking.value = ''
  moles.value = []
  prompt.value = targetWord.value
  await speak(targetWord.value)
  if (!alive || celebrating.value) return
  moles.value = buildMoles(targetWord.value)
  await nextTick()
  const els = moles.value
    .map((mole) => moleEl(mole.hole))
    .filter((el): el is HTMLElement => Boolean(el))
  playPop()
  await Promise.all(els.map((el) => tweenPopUp(el)))
  if (!alive) return
  locked.value = false
}

async function finish() {
  celebrating.value = true
  locked.value = true
  prompt.value = 'Nice catching!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function onTap(mole: Mole, event: MouseEvent) {
  if (locked.value || celebrating.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  if (mole.word === targetWord.value) {
    locked.value = true
    playPop()
    unlockWord(mole.word)
    if (!caught.value.includes(mole.word)) {
      caught.value = [...caught.value, mole.word]
    }
    correctCount.value += 1
    prompt.value = pickPraise('step')
    void flyStarFrom(target)
    await speak(prompt.value)
    if (!alive) return
    await hideMoles()
    if (correctCount.value >= NEED_CORRECT) {
      await finish()
      return
    }
    wave.value += 1
    await showWave()
    return
  }
  shaking.value = `${mole.hole}-${mole.word}`
  playNudge()
  await tweenShake(target)
  if (shaking.value === `${mole.hole}-${mole.word}`) shaking.value = ''
  await speak(targetWord.value)
}

async function replay() {
  if (locked.value || celebrating.value) return
  await speak(targetWord.value)
}

onMounted(() => {
  void showWave()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen whack">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">听单词，点对的地鼠</p>
    </div>

    <div class="lawn">
      <div v-for="hole in holes" :key="hole" class="hole">
        <div class="rim" aria-hidden="true" />
        <button
          v-if="moleByHole[hole]"
          :data-mole-hole="hole"
          class="mole"
          :class="{ shake: shaking === `${hole}-${moleByHole[hole]?.word}` }"
          type="button"
          :disabled="locked"
          :aria-label="moleByHole[hole]?.word"
          @click="onTap(moleByHole[hole] as Mole, $event)"
        >
          <word-pic :word="moleByHole[hole]?.word ?? ''" :size="64" />
          <small>{{ moleByHole[hole]?.word }}</small>
        </button>
      </div>
    </div>

    <p class="center hint">{{ progressText }} · 点对 {{ NEED_CORRECT }} 次就过关</p>
    <big-button variant="listen" :disabled="locked" @click="replay">再听一次</big-button>
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :chapter-no="chapterNo"
      :from-practice="isChapterPractice"
      :has-next="Boolean(lastResult?.nextLevelId)"
      @replay="replayCleared"
      @next="continueAfterClear"
      @practice="goPractice"
      @lobby="goLobby"
    />
  </section>
</template>

<style scoped>
.whack {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #15803d;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #15803d;
}

.lawn {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
  min-height: 320px;
  margin: 8px 0 4px;
  padding: 16px 10px 18px;
  border-radius: 32px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2), transparent 36%),
    linear-gradient(180deg, #8ee08f 0%, #4caf7a 100%);
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.1);
}

.hole {
  position: relative;
  min-height: 140px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  padding-bottom: 10px;
}

.rim {
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 8px;
  height: 28px;
  border-radius: 50%;
  background: #3d2a1a;
  box-shadow: inset 0 8px 0 rgba(0, 0, 0, 0.25);
}

.mole {
  position: relative;
  z-index: 1;
  min-width: 104px;
  min-height: 104px;
  padding: 8px 10px 12px;
  border-radius: 28px 28px 22px 22px;
  background: linear-gradient(180deg, #f6d7a8 0%, #d4a373 100%);
  box-shadow: 0 8px 0 rgba(61, 42, 26, 0.28);
  display: grid;
  justify-items: center;
  gap: 2px;
  font-weight: 700;
}

.mole :deep(.word-pic) {
  width: 64px;
  height: 64px;
}

.mole small {
  font-size: 18px;
}

.hint {
  margin: 0 0 8px;
}
</style>
