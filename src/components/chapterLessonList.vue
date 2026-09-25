<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tweenShake } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { playNudge, playTap } from '../composables/useSfx'
import { getChapterNumber } from '../data/chapters'
import { comingSoonCopy, lessonLockHint } from '../data/todayTasks'

const props = defineProps<{
  chapterId: string
}>()

const LOCK_HINT = lessonLockHint()
const SOON_HINT = comingSoonCopy()

const router = useRouter()
const { getChapterProgress, getNextLevel } = useProgress()

const chapter = computed(() => getChapterProgress(props.chapterId))
const chapterNo = computed(() => getChapterNumber(props.chapterId))
const globalNext = computed(() => getNextLevel())

const rows = computed(() => {
  const soonId = chapter.value.lessons.find((item) => item.status === 'soon')?.id
  return chapter.value.lessons.map((lesson) => ({
    ...lesson,
    isNext: globalNext.value?.lessonId === lesson.id || (!globalNext.value && lesson.id === soonId),
  }))
})

const lockHint = ref('')
const hintTimer = ref<number | null>(null)

function clearHintTimer() {
  if (hintTimer.value != null) {
    window.clearTimeout(hintTimer.value)
    hintTimer.value = null
  }
}

function showHint(text: string) {
  lockHint.value = text
  clearHintTimer()
  hintTimer.value = window.setTimeout(() => {
    lockHint.value = ''
    hintTimer.value = null
  }, 2200)
}

function mark(lesson: (typeof rows.value)[number]): string {
  if (lesson.status === 'cleared') return '通关啦'
  if (lesson.status === 'soon') return SOON_HINT
  if (lesson.isNext) return '现在玩'
  if (lesson.status === 'unlocked') return '去玩'
  return '未开'
}

function openLesson(lesson: (typeof rows.value)[number], event: MouseEvent) {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (lesson.status === 'locked') {
    playNudge()
    void tweenShake(target, 6)
    showHint(LOCK_HINT)
    return
  }
  if (lesson.status === 'soon' || !lesson.playable) {
    playNudge()
    void tweenShake(target, 6)
    showHint(SOON_HINT)
    return
  }
  playTap()
  void router.push({ path: '/animal-island', query: { chapter: props.chapterId, lesson: lesson.id } })
}

onBeforeUnmount(() => {
  clearHintTimer()
})
</script>

<template>
  <div class="card lesson-card">
    <p class="progress-title">第{{ chapterNo }}章 · 选一课</p>
    <p class="range-line">{{ chapter.syllabusRange }}</p>
    <div class="lessons" role="list">
      <button
        v-for="lesson in rows"
        :key="lesson.id"
        class="lesson"
        :class="{
          done: lesson.status === 'cleared',
          locked: lesson.status === 'locked',
          soon: lesson.status === 'soon',
          next: lesson.isNext && lesson.playable,
        }"
        type="button"
        role="listitem"
        :data-lesson-entry="lesson.id"
        :data-lesson-status="lesson.status"
        :aria-label="`第${lesson.order}课 ${lesson.titleZh} ${lesson.syllabusRange}，${mark(lesson)}`"
        @click="openLesson(lesson, $event)"
      >
        <span class="lesson-emoji" aria-hidden="true">{{ lesson.status === 'locked' || lesson.status === 'soon' ? '🔒' : '📘' }}</span>
        <span class="lesson-copy">
          <b class="lesson-name">第{{ lesson.order }}课 · {{ lesson.titleZh }}</b>
          <small>{{ lesson.syllabusRange }} · {{ lesson.titleEn }}</small>
        </span>
        <span class="lesson-mark">{{ mark(lesson) }}</span>
      </button>
    </div>
    <p class="lock-hint" :class="{ show: Boolean(lockHint) }" aria-live="polite">
      {{ lockHint || '　' }}
    </p>
    <p class="parent-line">通关一课，下一课就会打开。还没做好的课会写「即将开放」。</p>
  </div>
</template>

<style scoped>
.lesson-card {
  margin-top: auto;
}

.progress-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.range-line {
  margin: 2px 0 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}

.lessons {
  display: grid;
  gap: 6px;
}

.lesson {
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

.lesson.done {
  background: #e4f8ec;
}

.lesson.locked,
.lesson.soon {
  background: #eef1f4;
  color: #7b8a96;
}

.lesson.next {
  background: #fff3c4;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.22);
}

.lesson:active {
  transform: translateY(2px);
}

.lesson-emoji {
  font-size: 24px;
}

.lesson-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.lesson-name {
  font-size: 16px;
  font-weight: 750;
}

.lesson-copy small {
  font-size: 12px;
  font-weight: 650;
  color: var(--muted);
}

.lesson.locked .lesson-copy small,
.lesson.soon .lesson-copy small {
  color: #c07a2a;
}

.lesson-mark {
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
</style>
