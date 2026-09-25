<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgress } from '../composables/useProgress'
import { playTap } from '../composables/useSfx'
import { getChapterNumber, getLesson } from '../data/chapters'
import {
  comingSoonCopy,
  focusWordHint,
  lessonProgressCopy,
  nextLevelCopy,
  nextLevelCtaCopy,
} from '../data/todayTasks'
import todayStarBar from './todayStarBar.vue'

const router = useRouter()
const { today, lesson, nextLevel, nextRoute, ensureTodayTask } = useProgress()
ensureTodayTask()

const chapterNo = computed(() => getChapterNumber(lesson.value?.chapterId ?? ''))
const lessonNo = computed(() => lesson.value?.order ?? 1)
const soon = computed(() => lesson.value?.status === 'soon')
const done = computed(() => !nextLevel.value && lesson.value?.status === 'cleared')
const progressText = computed(() =>
  lessonProgressCopy(chapterNo.value, lessonNo.value, lesson.value?.clearedCount ?? 0, lesson.value?.levelTotal ?? 0, {
    soon: soon.value,
    clearedLesson: done.value,
  }),
)
const nextLine = computed(() => {
  if (nextLevel.value) return nextLevelCopy(nextLevel.value.titleZh)
  if (soon.value) return comingSoonCopy()
  return '课表先玩到这里啦'
})
const ctaLabel = computed(() => {
  if (soon.value) return comingSoonCopy()
  if (!nextLevel.value) return '看章节奖励'
  const meta = getLesson(nextLevel.value.lessonId)
  return nextLevelCtaCopy(
    nextLevel.value.order,
    nextLevel.value.titleZh,
    getChapterNumber(nextLevel.value.chapterId),
    meta?.order,
  )
})
const focusLine = computed(() => {
  if (done.value) return ''
  const word = today.focusWord?.trim()
  return word ? focusWordHint(word) : ''
})

function goNext() {
  playTap()
  void router.push(nextRoute.value)
}
</script>

<template>
  <div class="goal-bar" :class="{ done }" data-chapter-goal-bar aria-live="polite">
    <div class="goal-main">
      <span class="goal-mark" aria-hidden="true">{{ done ? '✓' : '🎯' }}</span>
      <div class="goal-copy">
        <p class="goal-task">{{ progressText }}</p>
        <p class="goal-next">{{ nextLine }}</p>
        <p v-if="focusLine" class="goal-focus">{{ focusLine }}</p>
      </div>
    </div>
    <today-star-bar class="goal-stars" size="compact" />
    <button class="goal-cta" type="button" data-next-level-cta @click="goNext">
      {{ ctaLabel }}
    </button>
    <p v-if="done" class="goal-ok">做好啦</p>
  </div>
</template>

<style scoped>
.goal-bar {
  width: 100%;
  padding: 12px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.goal-bar.done {
  background: #e4f8ec;
  box-shadow: 0 8px 0 rgba(76, 175, 122, 0.16);
}

.goal-main {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  align-items: center;
}

.goal-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff6d8;
  font-size: 18px;
  font-weight: 800;
}

.goal-bar.done .goal-mark {
  background: #c8f0d6;
  color: var(--ok);
}

.goal-copy {
  min-width: 0;
}

.goal-task {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
  line-height: 1.25;
}

.goal-next {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.goal-focus {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: var(--muted);
}

.goal-stars {
  width: 100%;
  margin-top: 10px;
}

.goal-cta {
  width: 100%;
  margin-top: 10px;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffc56d 0%, var(--btn) 100%);
  color: var(--btn-ink);
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 6px 0 #d97706;
}

.goal-cta:active {
  transform: translateY(2px);
}

.goal-ok {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ok);
}
</style>
