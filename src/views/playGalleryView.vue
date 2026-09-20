<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { getChapterNumber } from '../data/chapters'
import {
  chapterPracticeItems,
  isChapterPracticeGallery,
  locationForClearedPractice,
  playItems,
  practiceChapterIdFromQuery,
} from '../data/playGallery'
import { chapterPracticeOnlyCopy, practiceEntryCopy, replayAgainCopy } from '../data/todayTasks'

const route = useRoute()
const router = useRouter()
type GalleryRow = {
  id: string
  emoji: string
  name: string
  zh: string
  path: string
  levelId?: string
}

const practiceChapterId = computed(() => practiceChapterIdFromQuery(route.query.chapter))
const isPractice = computed(() => isChapterPracticeGallery(route.query.chapter))
const practiceChapterNo = computed(() =>
  practiceChapterId.value ? getChapterNumber(practiceChapterId.value) : 1,
)
const items = computed<GalleryRow[]>(() => {
  if (isPractice.value) {
    return chapterPracticeItems(practiceChapterId.value ?? undefined).map((item) => ({
      id: item.id,
      emoji: item.emoji,
      name: item.name,
      zh: `第${item.order}关 · ${item.zh}`,
      path: item.path,
      levelId: item.levelId,
    }))
  }
  return playItems.map((item) => ({
    id: item.id,
    emoji: item.emoji,
    name: item.name,
    zh: item.zh,
    path: item.path,
  }))
})
const backTo = computed(() =>
  isPractice.value && practiceChapterId.value
    ? { path: '/animal-island', query: { chapter: practiceChapterId.value } }
    : isPractice.value
      ? '/animal-island'
      : '/',
)
const backLabel = computed(() => (isPractice.value ? '回岛' : '首页'))

function openPlay(path: string, levelId?: string) {
  if (isPractice.value && levelId) {
    void router.push(locationForClearedPractice({ path, levelId }))
    return
  }
  void router.push({ path, query: { demo: '1' } })
}
</script>

<template>
  <section
    class="screen gallery"
    :data-chapter-practice="isPractice ? '1' : '0'"
    :data-practice-chapter="practiceChapterId ?? undefined"
  >
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backTo)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">{{ isPractice ? '练一练' : 'Play gallery' }}</p>
      <h1 class="title-lg">
        {{ isPractice ? practiceEntryCopy(practiceChapterId ?? undefined) : '玩法一览' }}
      </h1>
      <p class="sub">
        {{
          isPractice ? chapterPracticeOnlyCopy(practiceChapterNo) : '点进去试玩，不算过关，不加星星'
        }}
      </p>
    </div>

    <div class="list">
      <button
        v-for="item in items"
        :key="item.id"
        class="play-card"
        type="button"
        :data-practice-level="item.levelId"
        @click="openPlay(item.path, item.levelId)"
      >
        <span class="play-emoji">{{ item.emoji }}</span>
        <span class="play-copy">
          <b>{{ item.zh }}</b>
          <small>{{ item.name }}</small>
        </span>
        <span class="go">{{ isPractice ? replayAgainCopy() : '试玩' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.gallery {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.list {
  display: grid;
  gap: 10px;
  margin-top: 8px;
  padding-bottom: 8px;
}

.play-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.1);
  text-align: left;
}

.play-card:active {
  transform: translateY(2px);
}

.play-emoji {
  font-size: 32px;
}

.play-copy {
  display: grid;
  gap: 2px;
}

.play-copy b {
  font-size: 18px;
}

.play-copy small {
  color: var(--muted);
  font-size: 13px;
}

.go {
  font-weight: 700;
  color: #b45309;
}
</style>
