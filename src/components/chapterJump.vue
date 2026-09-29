<script setup lang="ts">
defineProps<{
  chapters: { chapterId: string; chapterNo: number }[]
}>()

function jump(chapterId: string) {
  const el = document.querySelector(`[data-chapter="${chapterId}"]`)
  if (!(el instanceof HTMLElement)) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <nav class="chapter-jump" aria-label="跳到某一章">
    <button
      v-for="chapter in chapters"
      :key="chapter.chapterId"
      type="button"
      @click="jump(chapter.chapterId)"
    >
      {{ chapter.chapterNo }}
    </button>
  </nav>
</template>

<style scoped>
.chapter-jump {
  position: sticky;
  top: 0;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  margin: 0 -2px;
  padding: 8px 2px;
  background: linear-gradient(180deg, rgba(184, 232, 245, 0.96), rgba(184, 232, 245, 0.92));
}

.chapter-jump button {
  flex: 0 0 44px;
  min-height: 44px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
}

.chapter-jump button:active {
  transform: translateY(2px);
}
</style>
