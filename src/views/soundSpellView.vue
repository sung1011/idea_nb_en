<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, tweenShake, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playNudge, playPop, playSuccess, speak } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { shuffle } from '../data/playGallery'
import { preloadWordCards } from '../data/phonicsFamily'
import { gateSpellSub } from '../data/todayTasks'

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
  themeHint,
  takeRunWords,
} = useChapterLevel('soundSpell')

const words = takeRunWords(3)
const target = computed(() => (level.value?.focusWord || words[0] || 'cat').toLowerCase())
const spellSub = computed(() => gateSpellSub(themeHint.value))
const letters = computed(() => target.value.split(''))
const tiles = ref<string[]>([])
const slots = ref<string[]>([])
const celebrating = ref(false)
const locked = ref(false)
const shaking = ref(false)
const boardEl = ref<HTMLElement | null>(null)

function resetBoard() {
  slots.value = []
  const extras = words
    .filter((word) => word !== target.value)
    .join('')
    .split('')
    .filter((ch) => !letters.value.includes(ch))
    .slice(0, 2)
  tiles.value = shuffle([...letters.value, ...extras])
}

onMounted(() => {
  preloadWordCards(words)
  resetBoard()
  void speak(target.value)
})

function hearWord() {
  if (locked.value) return
  playPop()
  void speak(target.value)
}

function pickTile(index: number) {
  if (locked.value || !canPlay.value) return
  const letter = tiles.value[index]
  if (!letter) return
  playPop()
  tiles.value = tiles.value.filter((_, i) => i !== index)
  slots.value = [...slots.value, letter]
  if (slots.value.length < letters.value.length) return
  void checkWord()
}

function undoSlot() {
  if (locked.value || !slots.value.length) return
  const last = slots.value[slots.value.length - 1]
  slots.value = slots.value.slice(0, -1)
  tiles.value = [...tiles.value, last]
}

async function checkWord() {
  const built = slots.value.join('')
  if (built !== target.value) {
    shaking.value = true
    playNudge()
    await tweenShake(boardEl.value)
    shaking.value = false
    resetBoard()
    void speak(target.value)
    return
  }
  locked.value = true
  celebrating.value = true
  playSuccess()
  unlockWord(target.value)
  await tweenCelebrate(boardEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}
</script>

<template>
  <section class="screen spell">
    <gate-top-bar />

    <div class="hero center">
      <p class="eyebrow">{{ gateTag }}</p>
      <h1 class="title-xl">听音拼一拼</h1>
      <p class="sub">{{ spellSub }}</p>
    </div>

    <div ref="boardEl" class="card board" :class="{ pop: celebrating, shake: shaking }">
      <word-pic :word="target" :size="88" />
      <p class="hint">先听一听，再用字母块拼出来。不是打字考试哦。</p>
      <div class="slots" aria-label="拼好的字母">
        <span
          v-for="(_, index) in letters"
          :key="`slot-${index}`"
          class="slot"
          :class="{ on: Boolean(slots[index]) }"
        >
          {{ slots[index] ?? '' }}
        </span>
      </div>
      <div class="tiles">
        <button
          v-for="(ch, index) in tiles"
          :key="`${ch}-${index}`"
          class="tile"
          type="button"
          :disabled="!canPlay || locked"
          @click="pickTile(index)"
        >
          {{ ch }}
        </button>
      </div>
    </div>

    <p class="hint center">
      {{
        !canPlay
          ? '先把前面的关卡通完哦。'
          : isReplay
            ? '再拼一遍也可以。'
            : '点字母块排好顺序就过关。'
      }}
    </p>
    <div class="actions">
      <big-button variant="soft" :disabled="locked" @click="hearWord">听一听</big-button>
      <big-button variant="soft" :disabled="locked || !slots.length" @click="undoSlot">退一格</big-button>
    </div>
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
.spell {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.board {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-top: 8px;
  padding: 16px 12px;
}

.hint {
  margin: 0;
  font-size: 15px;
  color: var(--muted);
}

.slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.slot {
  display: grid;
  place-items: center;
  width: 48px;
  height: 56px;
  border-radius: 14px;
  background: #eef6f4;
  border: 2px dashed #c5d8d2;
  font-size: 28px;
  font-weight: 800;
  text-transform: lowercase;
}

.slot.on {
  background: #fff6d0;
  border: 2px solid #f4b400;
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.tile {
  min-width: 52px;
  min-height: 52px;
  padding: 0 12px;
  border-radius: 16px;
  background: #fff3c4;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.28);
  font-size: 26px;
  font-weight: 800;
  text-transform: lowercase;
}

.tile:active {
  transform: translateY(2px);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pop {
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}
</style>
