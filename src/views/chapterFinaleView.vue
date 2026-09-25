<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playSuccess, speak } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getChapter } from '../data/chapters'
import { levelWordList } from '../data/gateWords'
import { stickerLabel } from '../data/stickers'
import { preloadWordCards } from '../data/phonicsFamily'

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
} = useChapterLevel('chapterFinale')
const words = computed(() => {
  const list = levelWordList(level.value)
  return list.length ? list : ['hop', 'pot', 'top']
})
const chapter = computed(() => getChapter(level.value?.chapterId))
const isBadge = computed(() => Boolean(level.value?.chapterStickerId))
const titleZh = computed(() => (isBadge.value ? (chapter.value?.kidTitle ?? '章节回顾') : (level.value?.titleZh ?? '小小回顾')))
const badgeName = computed(() => stickerLabel(level.value?.chapterStickerId || chapter.value?.stickerId || ''))
const recapLine = computed(() => `短回顾：再看一看 ${words.value.join(' / ')}`)
const celebrating = ref(false)
const locked = ref(false)
const cardEl = ref<HTMLElement | null>(null)

onMounted(() => {
  preloadWordCards(words.value)
  for (const word of words.value) unlockWord(word)
})

async function finish() {
  if (locked.value) return
  locked.value = true
  celebrating.value = true
  playSuccess()
  await tweenCelebrate(cardEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}
</script>

<template>
  <section class="screen finale">
    <gate-top-bar />

    <div class="hero center">
      <p class="eyebrow">{{ gateTag }}</p>
      <h1 class="title-xl">{{ titleZh }}</h1>
      <p class="sub">{{ recapLine }}</p>
    </div>

    <div ref="cardEl" class="card words" :class="{ pop: celebrating }">
      <div v-for="word in words" :key="word" class="word">
        <word-pic :word="word" :size="72" />
        <b>{{ word }}</b>
      </div>
    </div>

    <p class="hint center">
      {{
        !canPlay
          ? '先把前面的关卡通完哦。'
          : !isBadge
            ? '再看一看这课的词，过关就去下一课。'
            : isReplay
              ? `再玩一遍也可以，「${badgeName}」已经给你啦。`
              : `第一次过完这一章会拿到「${badgeName}」。`
      }}
    </p>
    <big-button :disabled="!canPlay || locked" @click="finish">我复习好了</big-button>
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
.finale {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.words {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.word {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 10px 6px;
}

.word b {
  font-size: 20px;
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
