<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import chapterLevelLights from '../components/chapterLevelLights.vue'
import chapterLevelList from '../components/chapterLevelList.vue'
import settingsButton from '../components/settingsButton.vue'
import starBar from '../components/starBar.vue'
import { tweenCelebrate, tweenPulse, tweenShake } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { playNudge, playTap } from '../composables/useSfx'
import {
  CHAPTER_LOBBY_EMOJI,
  chapterKidTitle,
  getChapter,
  getChapterNumber,
  isAnimalsChapterId,
  listChapters,
} from '../data/chapters'
import { getCurrentFamily } from '../data/phonicsFamily'
import {
  chapterLockHint,
  nextLevelCtaCopy,
} from '../data/todayTasks'

const CHAPTER_LOCK_HINT = chapterLockHint()

const router = useRouter()
const route = useRoute()
const family = getCurrentFamily()
const {
  nextLevel,
  nextRoute,
  isChapterUnlocked,
  getChapterProgress,
} = useProgress()

const selectedChapterId = computed(() => {
  const raw = route.query.chapter
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !isAnimalsChapterId(value)) return ''
  if (!isChapterUnlocked(value)) return ''
  return value
})

const selectedChapter = computed(() => (selectedChapterId.value ? getChapter(selectedChapterId.value) : undefined))
const selectedKidTitle = computed(() =>
  selectedChapterId.value ? chapterKidTitle(selectedChapterId.value) : '',
)

const chapterRows = computed(() => {
  const nextId = nextLevel.value?.chapterId
  return listChapters().map((item, index) => {
    const progress = getChapterProgress(item.id)
    const unlocked = isChapterUnlocked(item.id)
    return {
      id: item.id,
      order: index + 1,
      kidTitle: chapterKidTitle(item.id),
      titleEn: item.titleEn,
      emoji: CHAPTER_LOBBY_EMOJI[item.id] ?? '🏝️',
      unlocked,
      complete: progress.complete,
      clearedCount: progress.clearedCount,
      levelTotal: progress.levelTotal,
      isNext: unlocked && item.id === nextId,
    }
  })
})

const startLabel = computed(() => {
  if (!nextLevel.value) return '看章节奖励'
  return nextLevelCtaCopy(
    nextLevel.value.order,
    nextLevel.value.titleZh,
    getChapterNumber(nextLevel.value.chapterId),
  )
})

const hostEl = ref<HTMLElement | null>(null)
const nextRowEl = ref<HTMLElement | null>(null)
const lockHint = ref('')
const hintTimer = ref<number | null>(null)

function clearHintTimer() {
  if (hintTimer.value != null) {
    window.clearTimeout(hintTimer.value)
    hintTimer.value = null
  }
}

function showChapterLockHint() {
  lockHint.value = CHAPTER_LOCK_HINT
  clearHintTimer()
  hintTimer.value = window.setTimeout(() => {
    lockHint.value = ''
    hintTimer.value = null
  }, 2200)
}

function bindNextRow(el: Element | null, isNext: boolean) {
  if (isNext && el instanceof HTMLElement) nextRowEl.value = el
}

function goChapters() {
  playTap()
  void router.replace({ path: '/animal-island' })
}

function openChapter(row: (typeof chapterRows.value)[number], event: MouseEvent) {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (!row.unlocked) {
    playNudge()
    void tweenShake(target, 6)
    showChapterLockHint()
    return
  }
  playTap()
  void router.push({ path: '/animal-island', query: { chapter: row.id } })
}

function goNext() {
  playTap()
  void router.push(nextRoute.value)
}

onMounted(() => {
  void tweenCelebrate(hostEl.value)
  if (nextRowEl.value) void tweenPulse(nextRowEl.value)
})

onBeforeUnmount(() => {
  clearHintTimer()
})
</script>

<template>
  <section class="screen island-lobby">
    <header class="top-row">
      <button
        v-if="selectedChapterId"
        class="ghost-btn"
        type="button"
        data-back-chapters
        @click="goChapters"
      >
        章节
      </button>
      <button v-else class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <div class="top-tools">
        <star-bar />
        <settings-button />
      </div>
    </header>

    <div class="hero center">
      <p class="eyebrow">Animals Island</p>
      <h1 class="title-xl">{{ selectedKidTitle || '动物岛' }}</h1>
      <p class="sub">
        {{
          selectedChapter
            ? `第${getChapterNumber(selectedChapter.id)}章 · 帮小猫把朋友请来`
            : `三章小派对，先帮小猫办 ${family.family} 派对`
        }}
      </p>
    </div>

    <div class="island-wrap">
      <div class="sun" aria-hidden="true" />
      <div class="balloon b1" aria-hidden="true">🎈</div>
      <div class="balloon b2" aria-hidden="true">🎉</div>
      <div class="sea" aria-hidden="true">
        <div class="wave" />
      </div>
      <div class="island">
        <div ref="hostEl" class="guide floaty">🐱</div>
        <div class="prop hat" aria-hidden="true">🎩</div>
        <div class="palm">🌴</div>
      </div>
    </div>

    <p class="host-line center">
      {{ selectedKidTitle ? `现在玩「${selectedKidTitle}」` : '小猫是派对主人 · 一章一章来玩' }}
    </p>

    <template v-if="selectedChapterId">
      <chapter-level-lights class="island-level-lights" :chapter-id="selectedChapterId" />
      <chapter-level-list :chapter-id="selectedChapterId" />
    </template>

    <template v-else>
      <div class="card chapter-card">
        <p class="progress-title">选一章开始玩</p>
        <div class="chapters" role="list">
          <button
            v-for="row in chapterRows"
            :key="row.id"
            :ref="(el) => bindNextRow(el as Element | null, row.isNext)"
            class="chapter"
            :class="{
              done: row.complete,
              locked: !row.unlocked,
              next: row.isNext,
            }"
            type="button"
            role="listitem"
            :data-chapter-entry="row.id"
            :data-chapter-unlocked="row.unlocked ? '1' : '0'"
            :data-next-chapter="row.isNext ? '1' : '0'"
            :aria-label="`${row.kidTitle}，${row.unlocked ? `${row.clearedCount}/${row.levelTotal} 关` : CHAPTER_LOCK_HINT}`"
            @click="openChapter(row, $event)"
          >
            <span class="chapter-emoji" aria-hidden="true">{{ row.unlocked ? row.emoji : '🔒' }}</span>
            <span class="chapter-copy">
              <b class="chapter-name">第{{ row.order }}章 · {{ row.kidTitle }}</b>
              <small>
                {{
                  row.unlocked
                    ? `${row.clearedCount}/${row.levelTotal} 关`
                    : CHAPTER_LOCK_HINT
                }}
              </small>
            </span>
            <span class="chapter-mark">
              {{ row.complete ? '通关啦' : row.isNext ? '现在玩' : row.unlocked ? '去玩' : '未开' }}
            </span>
          </button>
        </div>
        <p class="lock-hint" :class="{ show: Boolean(lockHint) }" aria-live="polite">
          {{ lockHint || '　' }}
        </p>
        <p class="parent-line">通关一章，下一章就会打开。</p>
      </div>

      <big-button class="start-btn" data-next-level-cta @click="goNext">{{ startLabel }}</big-button>
    </template>

    <button class="album-btn" type="button" @click="router.push('/sticker-album')">
      <span aria-hidden="true">📒</span>
      贴纸相册
    </button>
    <button class="gallery-link" type="button" @click="router.push('/play-gallery')">玩法一览</button>
  </section>
</template>

<style scoped>
.island-lobby {
  gap: 10px;
}

.top-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.island-wrap {
  position: relative;
  height: 168px;
  margin: 2px 0 4px;
}

.sun {
  position: absolute;
  right: 18px;
  top: 8px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #ffe27a;
  box-shadow: 0 0 0 8px rgba(255, 226, 122, 0.35);
}

.balloon {
  position: absolute;
  font-size: 28px;
}

.b1 {
  left: 16px;
  top: 18px;
}

.b2 {
  right: 72px;
  top: 42px;
}

.sea {
  position: absolute;
  left: -18px;
  right: -18px;
  bottom: 18px;
  height: 54px;
  overflow: hidden;
}

.wave {
  width: 200%;
  height: 54px;
  background: radial-gradient(circle at 25px 0, var(--ocean) 24px, transparent 25px) repeat-x;
  background-size: 50px 54px;
  animation: wave 4s linear infinite;
  opacity: 0.85;
}

.island {
  position: absolute;
  left: 50%;
  bottom: 28px;
  width: 230px;
  height: 92px;
  margin-left: -115px;
  background: radial-gradient(ellipse at 50% 40%, #98e09a, var(--island) 70%);
  border-radius: 50%;
  box-shadow: 0 16px 0 rgba(45, 138, 122, 0.18);
}

.guide {
  position: absolute;
  left: 50%;
  top: -46px;
  margin-left: -28px;
  font-size: 56px;
  filter: drop-shadow(0 6px 0 rgba(244, 180, 0, 0.25));
}

.prop.hat {
  position: absolute;
  left: 28px;
  top: 28px;
  font-size: 22px;
}

.palm {
  position: absolute;
  right: 16px;
  top: -38px;
  font-size: 36px;
}

.host-line {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--muted);
}

.island-level-lights {
  margin: 2px 0 4px;
}

.chapter-card {
  margin-top: auto;
}

.progress-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
}

.chapters {
  display: grid;
  gap: 6px;
}

.chapter {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 16px;
  background: #f3f7fb;
  font-weight: 650;
  color: inherit;
  text-align: left;
}

.chapter.done {
  background: #e4f8ec;
}

.chapter.locked {
  background: #eef1f4;
  color: #7b8a96;
}

.chapter.next {
  background: #fff3c4;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.22);
}

.chapter:active {
  transform: translateY(2px);
}

.chapter-emoji {
  font-size: 24px;
}

.chapter-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.chapter-name {
  font-size: 16px;
  font-weight: 750;
}

.chapter-copy small {
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}

.chapter.locked .chapter-copy small {
  color: #c07a2a;
}

.chapter-mark {
  font-size: 14px;
  font-weight: 750;
  white-space: nowrap;
}

.lock-hint {
  margin: 10px 0 0;
  min-height: 20px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: transparent;
}

.lock-hint.show {
  color: #c07a2a;
}

.parent-line {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.start-btn {
  margin-top: 14px;
}

.album-btn {
  width: 100%;
  margin-top: 10px;
  min-height: 56px;
  padding: 0 18px;
  border-radius: 999px;
  background: #fff7d6;
  color: var(--ink);
  font-size: 20px;
  font-weight: 750;
  box-shadow: 0 6px 0 rgba(244, 180, 0, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.album-btn:active {
  transform: translateY(2px);
}

.gallery-link {
  margin-top: 8px;
  min-height: 48px;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
