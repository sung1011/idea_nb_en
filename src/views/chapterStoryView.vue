<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { claimChapterStoryStar, isChapterStoryUnlocked } from '../composables/useProgress'
import { speakStoryLine, warmChapterStoryAudio } from '../composables/useSpeech'
import { CHAPTER_LOBBY_EMOJI, chapterKidTitle, getChapter, getChapterNumber } from '../data/chapters'
import { getChapterStory, storyAudioFile } from '../data/chapterStories'

const CLAY = ['#ffe8c2', '#d7f3c8', '#cfe9ff', '#ffe0ea', '#fff3b0', '#e4d9ff', '#d4f4ef', '#ffd7c2']

const route = useRoute()
const router = useRouter()
const pageIndex = ref(0)
const starNote = ref('')

const chapterId = computed(() => {
  const raw = route.params.chapterId
  return typeof raw === 'string' ? raw : ''
})
const story = computed(() => getChapterStory(chapterId.value))
const unlocked = computed(() => isChapterStoryUnlocked(chapterId.value))
const chapterNo = computed(() => getChapterNumber(chapterId.value) || 1)
const titleZh = computed(() => story.value?.titleZh || chapterKidTitle(chapterId.value) || '这一章的故事')
const titleEn = computed(() => story.value?.titleEn || getChapter(chapterId.value)?.titleEn || 'Story')
const pages = computed(() => (unlocked.value ? story.value?.pages ?? [] : []))
const page = computed(() => pages.value[pageIndex.value])
const pageCount = computed(() => pages.value.length)
const isLast = computed(() => pageCount.value > 0 && pageIndex.value >= pageCount.value - 1)

watch(chapterId, () => {
  pageIndex.value = 0
  starNote.value = ''
})

watch(
  () => [chapterId.value, unlocked.value, pageCount.value] as const,
  () => {
    if (!unlocked.value || pageCount.value < 1) return
    const files: string[] = []
    for (let page = 1; page <= pageCount.value; page += 1) {
      files.push(storyAudioFile(chapterNo.value, page, 'en'))
      files.push(storyAudioFile(chapterNo.value, page, 'zh'))
    }
    void warmChapterStoryAudio(files)
  },
  { immediate: true },
)

function clayColor(hint: string, index: number): string {
  let hash = index * 17
  for (const ch of hint) hash = (hash + ch.charCodeAt(0) * 13) % 997
  return CLAY[hash % CLAY.length] ?? CLAY[0]
}

function sceneEmoji(hint: string): string {
  const found = hint.match(/\p{Extended_Pictographic}/u)
  if (found?.[0]) return found[0]
  return CHAPTER_LOBBY_EMOJI[chapterId.value] ?? '📖'
}

function hearEn() {
  if (!page.value) return
  void speakStoryLine(storyAudioFile(chapterNo.value, pageIndex.value + 1, 'en'), page.value.en, 'en-US')
}

function hearZh() {
  if (!page.value) return
  void speakStoryLine(storyAudioFile(chapterNo.value, pageIndex.value + 1, 'zh'), page.value.zh, 'zh-CN')
}

function goPrev() {
  if (pageIndex.value <= 0) return
  pageIndex.value -= 1
  starNote.value = ''
}

function goNext() {
  if (!isLast.value) {
    pageIndex.value += 1
    starNote.value = ''
    return
  }
  const fresh = claimChapterStoryStar(chapterId.value)
  starNote.value = fresh ? '听完啦，一颗星星送给你！' : '这个故事你已经听完啦。'
}
</script>

<template>
  <section class="screen story">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/animal-island')">回岛</button>
      <star-bar />
    </header>

    <div v-if="!unlocked || !page" class="card gate center">
      <p class="gate-emoji" aria-hidden="true">📖</p>
      <h1 class="title-lg">第{{ chapterNo }}章故事</h1>
      <p class="sub">先把这一章的四课玩完，故事就打开啦。</p>
      <big-button @click="router.push('/animal-island')">去动物岛</big-button>
    </div>

    <template v-else>
      <p class="kicker">第{{ chapterNo }}章故事</p>
      <h1 class="title-lg">{{ titleZh }}</h1>
      <p class="title-en">{{ titleEn }}</p>

      <div class="scene" :style="{ background: clayColor(page.sceneHint, pageIndex) }" aria-hidden="true">
        <span class="scene-emoji">{{ sceneEmoji(page.sceneHint) }}</span>
      </div>

      <button class="line en" type="button" @click="hearEn">{{ page.en }}</button>
      <button class="line zh" type="button" @click="hearZh">{{ page.zh }}</button>
      <p class="page-no">第 {{ pageIndex + 1 }} 页 · 共 {{ pageCount }} 页</p>
      <p v-if="starNote" class="star-note">{{ starNote }}</p>

      <div class="nav">
        <big-button variant="soft" :disabled="pageIndex <= 0" @click="goPrev">上一页</big-button>
        <big-button @click="goNext">{{ isLast ? '听完啦' : '下一页' }}</big-button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.story {
  gap: 10px;
  padding-bottom: max(16px, calc(12px + env(safe-area-inset-bottom)));
}

.kicker {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 750;
  color: #9a5b12;
}

.title-en {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--muted);
}

.scene {
  min-height: 168px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.scene-emoji {
  font-size: 72px;
  line-height: 1;
}

.line {
  width: 100%;
  padding: 14px 16px;
  border-radius: 22px;
  text-align: left;
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.08);
}

.line.en {
  background: #fff;
  color: var(--ink);
  font-size: 26px;
  font-weight: 800;
  line-height: 1.3;
}

.line.zh {
  background: #fff7e8;
  color: #3d5164;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.page-no {
  margin: 0;
  text-align: center;
  font-size: 15px;
  font-weight: 750;
  color: var(--muted);
}

.star-note {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: #15803d;
}

.nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: auto;
}

.gate {
  gap: 12px;
  margin-top: 24px;
}

.gate-emoji {
  margin: 0;
  font-size: 64px;
  line-height: 1;
}
</style>
