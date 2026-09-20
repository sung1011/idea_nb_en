<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playPop, playSuccess, speak, speakZh } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { chapterKidTitle } from '../data/chapters'
import { preloadWordCards } from '../data/phonicsFamily'
import { gateBookSub } from '../data/todayTasks'

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
} = useChapterLevel('storyBook')

const words = takeRunWords(3)
const focus = computed(() => (level.value?.focusWord || words[0] || 'cat').toLowerCase())
const bookTitle = computed(() => chapterKidTitle(level.value?.chapterId ?? '') || '小小书')
const bookSub = computed(() => gateBookSub(themeHint.value))
const page = ref(0)
const celebrating = ref(false)
const locked = ref(false)
const cardEl = ref<HTMLElement | null>(null)

const pages = computed(() => {
  const cover = { kind: 'cover' as const, word: focus.value, line: bookTitle.value }
  const story = words.slice(0, 3).map((word) => ({
    kind: 'page' as const,
    word,
    line: word === focus.value ? '试着拼读这个词' : '点一页，听一听',
  }))
  return [cover, ...story]
})

const current = computed(() => pages.value[page.value] ?? pages.value[0])
const isLast = computed(() => page.value >= pages.value.length - 1)
const progressText = computed(() => `${page.value + 1} / ${pages.value.length}`)

onMounted(() => {
  preloadWordCards(words)
})

async function hearPage() {
  if (locked.value) return
  playPop()
  if (current.value.kind === 'cover') {
    await speakZh(`小书：《${bookTitle.value}》`)
    await speak(current.value.word)
    return
  }
  await speak(current.value.word)
  if (current.value.word === focus.value) {
    await speakZh('试着拼读一下')
  }
  unlockWord(current.value.word)
}

async function nextPage() {
  if (locked.value || !canPlay.value) return
  await hearPage()
  if (isLast.value) {
    await finishBook()
    return
  }
  page.value += 1
}

async function finishBook() {
  if (locked.value) return
  locked.value = true
  celebrating.value = true
  playSuccess()
  unlockWord(focus.value)
  await tweenCelebrate(cardEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}
</script>

<template>
  <section class="screen book">
    <gate-top-bar />

    <div class="hero center">
      <p class="eyebrow">{{ gateTag }}</p>
      <h1 class="title-xl">小书点读</h1>
      <p class="sub">{{ bookSub }}</p>
    </div>

    <div ref="cardEl" class="card page" :class="{ pop: celebrating, cover: current.kind === 'cover' }">
      <p class="page-mark">{{ current.kind === 'cover' ? '封面' : `第 ${page} 页` }} · {{ progressText }}</p>
      <h2 class="page-title">{{ current.kind === 'cover' ? bookTitle : current.word }}</h2>
      <word-pic :word="current.word" :size="current.kind === 'cover' ? 120 : 96" />
      <p class="page-line">{{ current.line }}</p>
      <p v-if="current.word === focus && current.kind !== 'cover'" class="focus-hint">焦点词，试着拼读</p>
    </div>

    <p class="hint center">
      {{
        !canPlay
          ? '先把前面的关卡通完哦。'
          : isReplay
            ? '再读一遍小书也可以。'
            : '点页面听声音，读到最后一页就过关。'
      }}
    </p>
    <big-button :disabled="!canPlay || locked" @click="nextPage">
      {{ current.kind === 'cover' ? '打开小书' : isLast ? '我读完了' : '下一页' }}
    </big-button>
    <big-button variant="soft" :disabled="locked" @click="hearPage">再听一遍</big-button>
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
.book {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.page {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 18px 14px 16px;
  min-height: 260px;
}

.page.cover {
  background: linear-gradient(180deg, #fff6d0 0%, #fffdf3 72%);
}

.page-mark {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.page-line {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--ink);
}

.focus-hint {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
  color: #b45309;
}

.hint {
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.pop {
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}
</style>
