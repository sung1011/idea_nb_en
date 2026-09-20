<script setup lang="ts">
import { computed } from 'vue'
import {
  chapterPracticeCopy,
  practiceEntryCopy,
  replayAgainCopy,
} from '../data/todayTasks'
import bigButton from './bigButton.vue'

const props = defineProps<{
  open: boolean
  chapterComplete?: boolean
  fromPractice?: boolean
  hasNext?: boolean
}>()

const emit = defineEmits<{
  replay: []
  next: []
  practice: []
  lobby: []
}>()

const title = computed(() => (props.chapterComplete ? '过关啦' : '又玩了一遍'))
const lead = computed(() =>
  props.chapterComplete ? chapterPracticeCopy() : '再玩一遍也可以，星星已经给你啦',
)
const showPractice = computed(() => Boolean(props.chapterComplete))
const showNext = computed(() => Boolean(props.hasNext) && !props.fromPractice)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="clear-mask"
      data-level-clear-sheet
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-sheet-title"
    >
      <div class="clear-card">
        <p class="eyebrow">Nice!</p>
        <h2 id="clear-sheet-title" class="title">{{ title }}</h2>
        <p class="lead">{{ lead }}</p>
        <big-button data-clear-replay @click="emit('replay')">{{ replayAgainCopy() }}</big-button>
        <big-button v-if="showNext" variant="soft" data-clear-next @click="emit('next')">
          去下一关
        </big-button>
        <big-button
          v-if="showPractice"
          variant="soft"
          data-practice-entry
          @click="emit('practice')"
        >
          {{ practiceEntryCopy() }}
        </big-button>
        <button class="lobby-link" type="button" data-clear-lobby @click="emit('lobby')">回岛</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.clear-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(14, 42, 58, 0.46);
}

.clear-card {
  width: min(100%, 360px);
  padding: 22px 18px 16px;
  border-radius: 28px;
  background: #fffdf6;
  box-shadow: 0 12px 0 rgba(45, 58, 74, 0.16);
  display: grid;
  gap: 10px;
}

.eyebrow {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.lead {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
}

.lobby-link {
  min-height: 48px;
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
