<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '../composables/useProgress'
import { focusWordHint, mainTaskCopy } from '../data/todayTasks'
import todayStarBar from './todayStarBar.vue'

const { today, ensureTodayTask } = useProgress()
ensureTodayTask()

const taskText = computed(() => mainTaskCopy(today.mainTaskId))
const done = computed(() => today.mainTaskDone || today.completed)
const focusLine = computed(() => {
  const word = today.focusWord?.trim()
  return word ? focusWordHint(word) : ''
})
</script>

<template>
  <div class="goal-bar" :class="{ done }" aria-live="polite">
    <div class="goal-main">
      <span class="goal-mark" aria-hidden="true">{{ done ? '✓' : '🎯' }}</span>
      <div class="goal-copy">
        <p class="goal-task">{{ taskText }}</p>
        <p v-if="focusLine" class="goal-focus">{{ focusLine }}</p>
      </div>
    </div>
    <today-star-bar class="goal-stars" size="compact" />
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

.goal-ok {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ok);
}
</style>
