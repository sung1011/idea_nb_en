<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, tweenPulse, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playPop, playSuccess, speak, speakZh, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { CHAPTER_LOBBY_EMOJI, chapterKidTitle, lessonKidTitle } from '../data/chapters'
import { levelWordList } from '../data/gateWords'
import { preloadWordCards } from '../data/phonicsFamily'
import { sentenceForWord } from '../data/shortSentences'
import {
  gateBookBlendHint,
  gateBookCoverHint,
  gateBookPageHint,
  gateBookPrompt,
  gateBookReplayHint,
  gateBookSub,
} from '../data/todayTasks'

const BOOK_PAGE_MAX = 5
const BLEND_LEAD_MS = 420
const BLEND_LETTER_MS = 260

type CoverPage = { kind: 'cover' }
type StoryPage = { kind: 'page'; word: string; line: string }
type BookPage = CoverPage | StoryPage

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
  chapterId,
  useLevelWords,
  themeHint,
  takeRunWords,
} = useChapterLevel('storyBook')

const script = (level.value?.storyPages ?? []).filter((page) => page.word && page.line)
const words = (
  script.length
    ? script.map((page) => page.word.toLowerCase())
    : useLevelWords.value
      ? levelWordList(level.value)
      : takeRunWords(BOOK_PAGE_MAX)
).slice(0, BOOK_PAGE_MAX)
const focus = computed(() => (level.value?.focusWord || words[0] || 'hop').toLowerCase())
const bookTitle = computed(() => {
  if (!useLevelWords.value) return '小小书'
  return lessonKidTitle(level.value?.lessonId) || chapterKidTitle(level.value?.chapterId ?? '') || '小小书'
})
const bookSub = computed(() => gateBookSub(themeHint.value))
const coverEmoji = computed(() => CHAPTER_LOBBY_EMOJI[chapterId.value] ?? '📖')
const page = ref(0)
const sentenceShown = ref(false)
const blending = ref(false)
const celebrating = ref(false)
const locked = ref(false)
const turning = ref(false)
const cardEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const cvcEl = ref<HTMLElement | null>(null)
const heardPages = new Set<number>()

let alive = true
let enterToken = 0

const pages = computed<BookPage[]>(() => {
  const story: StoryPage[] = words.map((word, index) => ({
    kind: 'page',
    word,
    line: script[index]?.line || sentenceForWord(word),
  }))
  return [{ kind: 'cover' }, ...story]
})

const current = computed(() => pages.value[page.value] ?? pages.value[0])
const story = computed(() => (current.value.kind === 'page' ? current.value : null))
const isCover = computed(() => current.value.kind === 'cover')
const isLast = computed(() => Boolean(story.value) && page.value >= pages.value.length - 1)
const storyCount = computed(() => Math.max(1, pages.value.length - 1))
const storyIndex = computed(() => Math.max(0, page.value - 1))
const pageLetters = computed(() => story.value?.word.split('') ?? [])
const sentenceBits = computed(() =>
  story.value ? splitSentence(story.value.line, story.value.word) : [],
)
const promptKind = computed<'cover' | 'blend' | 'page' | 'done'>(() => {
  if (celebrating.value) return 'done'
  if (isCover.value) return 'cover'
  if (blending.value || !sentenceShown.value) return 'blend'
  return 'page'
})
const prompt = computed(() => gateBookPrompt(promptKind.value))
const hint = computed(() => {
  if (!canPlay.value) return '先把前面的关卡通完哦。'
  if (isCover.value) return isReplay.value ? gateBookReplayHint() : gateBookCoverHint()
  if (blending.value || !sentenceShown.value) return gateBookBlendHint()
  return gateBookPageHint()
})
const nextLabel = computed(() => {
  if (isCover.value) return '打开小书'
  if (isLast.value) return '读完啦'
  return '下一页'
})
const listenLabel = computed(() => (isCover.value ? '听书名' : '听句子'))
const pageMark = computed(() =>
  isCover.value ? '封面' : `第 ${storyIndex.value + 1} 页 · 共 ${storyCount.value} 页`,
)

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function splitSentence(line: string, word: string): Array<{ text: string; focus: boolean }> {
  const needle = word.trim()
  if (!needle) return [{ text: line, focus: false }]
  const at = line.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return [{ text: line, focus: false }]
  const before = line.slice(0, at)
  const hit = line.slice(at, at + needle.length)
  const after = line.slice(at + needle.length)
  return [
    ...(before ? [{ text: before, focus: false }] : []),
    { text: hit, focus: true },
    ...(after ? [{ text: after, focus: false }] : []),
  ]
}

function cancelEnter() {
  enterToken += 1
  blending.value = false
}

function markPageHeard(word: string) {
  heardPages.add(page.value)
  unlockWord(word)
}

async function hearTitle() {
  if (locked.value) return
  playPop()
  await speakZh(`小书：《${bookTitle.value}》`)
}

async function hearWord(word: string) {
  if (locked.value || !word) return
  playPop()
  unlockWord(word)
  await speak(word)
}

async function hearSentence(opts?: { skipBlend?: boolean }) {
  const leaf = story.value
  if (locked.value || !leaf) return
  if (opts?.skipBlend) cancelEnter()
  sentenceShown.value = true
  blending.value = false
  markPageHeard(leaf.word)
  playPop()
  await speak(leaf.line)
}

async function enterPage() {
  const leaf = story.value
  if (!alive || !leaf) {
    blending.value = false
    return
  }
  const token = ++enterToken
  if (heardPages.has(page.value)) {
    sentenceShown.value = true
    blending.value = false
    return
  }
  sentenceShown.value = false
  blending.value = false
  await nextTick()
  if (!alive || token !== enterToken) return
  blending.value = true
  const blendMs = BLEND_LEAD_MS + pageLetters.value.length * BLEND_LETTER_MS
  await Promise.all([speakZh(gateBookBlendHint()), wait(blendMs), tweenPulse(cvcEl.value)])
  if (!alive || token !== enterToken) return
  sentenceShown.value = true
  blending.value = false
  markPageHeard(leaf.word)
  await speak(leaf.line)
}

async function listenAgain() {
  if (locked.value) return
  if (isCover.value) {
    await hearTitle()
    return
  }
  await hearSentence({ skipBlend: true })
}

async function nextPage() {
  if (locked.value || turning.value || !canPlay.value) return
  if (isLast.value) {
    await finishBook()
    return
  }
  cancelEnter()
  stopSpeech()
  turning.value = true
  playPop()
  page.value += 1
  sentenceShown.value = false
  blending.value = false
  void tweenCelebrate(cardEl.value)
  turning.value = false
  if (!alive) return
  void enterPage()
}

async function finishBook() {
  if (locked.value) return
  cancelEnter()
  stopSpeech()
  locked.value = true
  celebrating.value = true
  playSuccess()
  unlockWord(focus.value)
  for (const word of words) unlockWord(word)
  await tweenCelebrate(cardEl.value ?? titleEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

onMounted(() => {
  preloadWordCards([focus.value, ...words])
})

onUnmounted(() => {
  alive = false
  cancelEnter()
  stopSpeech()
})
</script>

<template>
  <section class="screen book">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">{{ gateBookReplayHint() }}</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">{{ bookSub }}</p>
    </div>

    <div
      ref="cardEl"
      class="card page"
      :class="[
        chapterId,
        {
          pop: celebrating,
          cover: isCover,
          blending,
          revealed: sentenceShown && !isCover,
        },
      ]"
    >
      <p class="page-mark">{{ pageMark }}</p>

      <template v-if="isCover">
        <p class="cover-emoji floaty" aria-hidden="true">{{ coverEmoji }}</p>
        <button class="cover-title" type="button" :disabled="locked" @click="hearTitle">
          {{ bookTitle }}
        </button>
        <button class="pic-btn" type="button" :disabled="locked" @click="hearWord(focus)">
          <word-pic :word="focus" :size="120" />
        </button>
        <p class="cover-badge" aria-hidden="true">📖</p>
      </template>

      <template v-else-if="story">
        <button class="pic-btn" type="button" :disabled="locked" @click="hearWord(story.word)">
          <word-pic :word="story.word" :size="104" />
        </button>
        <button
          ref="cvcEl"
          class="cvc"
          type="button"
          :disabled="locked"
          :aria-label="story.word"
          @click="hearWord(story.word)"
        >
          <span v-for="(letter, index) in pageLetters" :key="`${story.word}-${index}`" class="cvc-letter">
            {{ letter }}
          </span>
        </button>
        <div class="line-row" :class="{ on: sentenceShown }">
          <p class="sentence" @click="sentenceShown && hearSentence({ skipBlend: true })">
            <template v-for="(bit, index) in sentenceBits" :key="`${bit.text}-${index}`">
              <button
                v-if="bit.focus"
                class="focus-word"
                type="button"
                :disabled="locked || !sentenceShown"
                @click.stop="hearWord(story.word)"
              >
                {{ bit.text }}
              </button>
              <span v-else>{{ bit.text }}</span>
            </template>
          </p>
          <button
            class="speaker"
            type="button"
            :disabled="locked"
            aria-label="听句子"
            @click="hearSentence({ skipBlend: true })"
          >
            🔊
          </button>
        </div>
        <div class="dots" aria-hidden="true">
          <span
            v-for="(_, index) in storyCount"
            :key="`dot-${index}`"
            class="dot"
            :class="{ on: index === storyIndex }"
          />
        </div>
      </template>
    </div>

    <p class="hint center">{{ hint }}</p>
    <big-button :disabled="!canPlay || locked || turning" @click="nextPage">
      {{ nextLabel }}
    </big-button>
    <big-button variant="listen" :disabled="locked || turning" @click="listenAgain">
      {{ listenLabel }}
    </big-button>
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :from-practice="isChapterPractice"
      :chapter-no="chapterNo"
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

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #b45309;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #b45309;
}

.page {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 18px 14px 16px;
  min-height: 292px;
}

.page.cover {
  background: linear-gradient(180deg, #fff6d0 0%, #fffdf3 76%);
}

.page.cover.ch2 {
  background: linear-gradient(180deg, #e7f6e3 0%, #fffdf3 76%);
}

.page.cover.ch3 {
  background: linear-gradient(180deg, #ffe8d2 0%, #fffdf3 76%);
}

.page.cover.ch4 {
  background: linear-gradient(180deg, #fff3b0 0%, #fffdf3 76%);
}

.page.cover.ch5 {
  background: linear-gradient(180deg, #ffe4c4 0%, #fffdf3 76%);
}

.page.cover.ch6 {
  background: linear-gradient(180deg, #d9f0ff 0%, #fffdf3 76%);
}

.page.cover.ch7 {
  background: linear-gradient(180deg, #e4f7d4 0%, #fffdf3 76%);
}

.page.cover.ch8 {
  background: linear-gradient(180deg, #d7e8ff 0%, #fffdf3 76%);
}

.page.cover.ch9 {
  background: linear-gradient(180deg, #d4f0c8 0%, #fffdf3 76%);
}

.page.cover.ch10 {
  background: linear-gradient(180deg, #ffe7c2 0%, #fffdf3 76%);
}

.page.revealed {
  background: linear-gradient(180deg, #fffdf6 0%, #fff8e4 100%);
}

.page-mark {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.cover-emoji {
  margin: 0;
  font-size: 64px;
  line-height: 1;
}

.cover-title {
  margin: 0;
  padding: 8px 16px;
  min-height: var(--touch);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 5px 0 rgba(244, 180, 0, 0.22);
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
}

.cover-title:active:not(:disabled) {
  transform: translateY(2px);
}

.cover-badge {
  margin: 0;
  font-size: 28px;
}

.pic-btn {
  display: grid;
  justify-items: center;
  padding: 4px;
  background: transparent;
}

.cvc {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 4px;
  background: transparent;
}

.cvc-letter {
  display: grid;
  place-items: center;
  min-width: 48px;
  min-height: 56px;
  padding: 0 8px;
  border-radius: 16px;
  background: #fff6d0;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.2);
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.blending .cvc-letter {
  animation: blendGlow 0.85s ease;
}

.blending .cvc-letter:nth-child(1) {
  animation-delay: 0.05s;
}

.blending .cvc-letter:nth-child(2) {
  animation-delay: 0.28s;
}

.blending .cvc-letter:nth-child(3) {
  animation-delay: 0.51s;
}

.blending .cvc-letter:nth-child(4) {
  animation-delay: 0.74s;
}

.blending .cvc-letter:nth-child(5) {
  animation-delay: 0.97s;
}

.line-row {
  display: grid;
  justify-items: center;
  gap: 10px;
  width: 100%;
  min-height: 96px;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}

.line-row.on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.sentence {
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 22px;
  font-weight: 750;
  line-height: 1.35;
  cursor: pointer;
}

.focus-word {
  display: inline;
  margin: 0 1px;
  padding: 0 4px;
  border-radius: 10px;
  background: #fff3c4;
  box-shadow: inset 0 -3px 0 rgba(244, 180, 0, 0.28);
  color: #9a3412;
  font: inherit;
  font-weight: 800;
}

.speaker {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(180deg, #a78bfa 0%, var(--grape) 100%);
  color: #fff;
  box-shadow: 0 6px 0 #5b4d9a;
  font-size: 32px;
}

.speaker:active:not(:disabled),
.pic-btn:active:not(:disabled),
.cvc:active:not(:disabled),
.sentence:active:not(:disabled) {
  transform: translateY(2px);
}

.dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5d7b2;
}

.dot.on {
  background: #f4b400;
  transform: scale(1.2);
}

.hint {
  margin: 4px 0 0;
}

.pop {
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}

@keyframes blendGlow {
  0%,
  100% {
    transform: scale(1);
    background: #fff6d0;
  }
  40% {
    transform: scale(1.16);
    background: #ffd36a;
    box-shadow: 0 0 0 10px rgba(244, 180, 0, 0.36);
  }
}
</style>
