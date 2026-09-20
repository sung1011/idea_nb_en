<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tweenPulse, tweenShake } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { playNudge, playTap } from '../composables/useSfx'
import { getChapterNumber, getLevel } from '../data/chapters'
import { PLAY_KIND_EMOJI, locationForChapterPractice } from '../data/playGallery'
import {
  chapterPracticeCopy,
  levelLockHint,
  nextLevelCtaCopy,
  practiceEntryCopy,
  replayAgainCopy,
  replayClearedHintCopy,
} from '../data/todayTasks'
import bigButton from './bigButton.vue'

const props = defineProps<{
  chapterId: string
}>()

const STATUS_LABEL: Record<'locked' | 'unlocked' | 'cleared', string> = {
  locked: '未开',
  unlocked: '去玩',
  cleared: replayAgainCopy(),
}

const LOCK_HINT = levelLockHint()

const router = useRouter()
const {
  getChapterProgress,
  getNextLevel,
  locationForLevel,
  locationForNextMainline,
} = useProgress()

const chapter = computed(() => getChapterProgress(props.chapterId))
const chapterNo = computed(() => getChapterNumber(props.chapterId))
const chapterNext = computed(() => getNextLevel(props.chapterId))
const globalNext = computed(() => getNextLevel())

const levelRows = computed(() => {
  const nextId = chapterNext.value?.id ?? (globalNext.value?.chapterId === props.chapterId ? globalNext.value.id : '')
  return chapter.value.levels.map((item, index) => ({
    ...item,
    order: getLevel(item.id)?.order ?? index + 1,
    emoji: PLAY_KIND_EMOJI[item.play],
    isNext: item.id === nextId,
    playable: item.status === 'unlocked' || item.status === 'cleared',
  }))
})

const startLabel = computed(() => {
  if (chapterNext.value) return nextLevelCtaCopy(chapterNext.value.order, chapterNext.value.titleZh)
  if (globalNext.value) {
    return nextLevelCtaCopy(
      globalNext.value.order,
      globalNext.value.titleZh,
      getChapterNumber(globalNext.value.chapterId),
    )
  }
  return '看章节奖励'
})

const parentLine = computed(() => {
  if (chapter.value.complete) return chapterPracticeCopy(chapterNo.value)
  if (chapter.value.clearedCount > 0) return replayClearedHintCopy()
  return '家长小记：通关立刻开下一关。'
})

const nextRowEl = ref<HTMLElement | null>(null)
const lockHint = ref('')
const hintTimer = ref<number | null>(null)

function clearHintTimer() {
  if (hintTimer.value != null) {
    window.clearTimeout(hintTimer.value)
    hintTimer.value = null
  }
}

function showLockHint() {
  lockHint.value = LOCK_HINT
  clearHintTimer()
  hintTimer.value = window.setTimeout(() => {
    lockHint.value = ''
    hintTimer.value = null
  }, 2200)
}

function bindNextRow(el: Element | null, isNext: boolean) {
  if (isNext && el instanceof HTMLElement) nextRowEl.value = el
}

function goPractice() {
  playTap()
  void router.push(locationForChapterPractice(props.chapterId))
}

function go() {
  playTap()
  if (chapterNext.value) {
    void router.push(locationForLevel(chapterNext.value))
    return
  }
  void router.push(locationForNextMainline())
}

function onLevelTap(row: (typeof levelRows.value)[number], event: MouseEvent) {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (!row.playable) {
    playNudge()
    void tweenShake(target, 6)
    showLockHint()
    return
  }
  playTap()
  const def = getLevel(row.id)
  void router.push(def ? locationForLevel(def) : row.route)
}

onMounted(() => {
  if (nextRowEl.value) void tweenPulse(nextRowEl.value)
})

onBeforeUnmount(() => {
  clearHintTimer()
})
</script>

<template>
  <div class="chapter-levels">
    <div class="card progress-card">
      <p class="progress-title">第{{ chapterNo }}章 {{ chapter.clearedCount }}/{{ chapter.levelTotal }} 关</p>
      <div class="gates" role="list">
        <button
          v-for="row in levelRows"
          :key="row.id"
          :ref="(el) => bindNextRow(el as Element | null, row.isNext)"
          class="gate"
          :class="{
            done: row.status === 'cleared',
            locked: row.status === 'locked',
            next: row.isNext,
          }"
          type="button"
          role="listitem"
          :data-chapter-level="row.id"
          :data-level-status="row.status"
          :data-next-level="row.isNext ? '1' : '0'"
          :data-level-replay="row.status === 'cleared' ? '1' : '0'"
          :aria-label="`第${row.order}关 ${row.titleZh}，${row.isNext ? '现在玩' : STATUS_LABEL[row.status]}`"
          @click="onLevelTap(row, $event)"
        >
          <span class="gate-emoji" aria-hidden="true">{{ row.status === 'locked' ? '🔒' : row.emoji }}</span>
          <span class="gate-copy">
            <b class="gate-name">第{{ row.order }}关 · {{ row.titleZh }}</b>
            <small>{{ row.titleEn }}</small>
          </span>
          <span class="gate-mark">
            <span
              class="gate-star"
              :class="{ on: row.status === 'cleared' }"
              aria-hidden="true"
            >⭐</span>
            {{ row.isNext ? '现在玩' : STATUS_LABEL[row.status] }}
          </span>
        </button>
      </div>
      <p class="lock-hint" :class="{ show: Boolean(lockHint) }" aria-live="polite">
        {{ lockHint || '　' }}
      </p>
      <p class="parent-line">{{ parentLine }}</p>
    </div>

    <big-button
      v-if="chapter.complete"
      class="practice-btn"
      variant="soft"
      data-practice-entry
      @click="goPractice"
    >
      {{ practiceEntryCopy() }}
    </big-button>
    <big-button class="start-btn" data-next-level-cta @click="go">{{ startLabel }}</big-button>
  </div>
</template>

<style scoped>
.chapter-levels {
  display: grid;
  gap: 0;
}

.progress-card {
  margin-top: auto;
}

.progress-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
}

.gates {
  display: grid;
  gap: 6px;
}

.gate {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 16px;
  background: #f3f7fb;
  font-weight: 650;
  color: inherit;
  text-align: left;
}

.gate.done {
  background: #e4f8ec;
}

.gate.locked {
  background: #eef1f4;
  color: #7b8a96;
}

.gate.next {
  background: #fff3c4;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.22);
}

.gate:active {
  transform: translateY(2px);
}

.gate-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.gate-name {
  font-size: 16px;
  font-weight: 750;
}

.gate-copy small {
  font-size: 12px;
  font-weight: 650;
  color: var(--muted);
}

.gate.locked .gate-copy small {
  color: #9aa8b3;
}

.gate-mark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 750;
  white-space: nowrap;
}

.gate-star {
  font-size: 20px;
  filter: grayscale(0.4);
  opacity: 0.55;
}

.gate-star.on {
  filter: none;
  opacity: 1;
}

.gate-emoji {
  font-size: 24px;
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

.practice-btn {
  margin-top: 14px;
}

.start-btn {
  margin-top: 14px;
}

.practice-btn + .start-btn {
  margin-top: 10px;
}
</style>
