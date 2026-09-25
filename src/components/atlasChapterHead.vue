<script setup lang="ts">
import { meadowSrc } from '../meadow/meadowConfig'

defineProps<{
  chapterNo: number
  animalId: string
  animalZh: string
}>()
</script>

<template>
  <header class="chapter-head">
    <img v-if="animalId" class="animal" :src="meadowSrc(animalId)" alt="" />
    <b>第{{ chapterNo }}章</b>
    <span v-if="animalZh">{{ animalZh }}</span>
  </header>
</template>

<style scoped>
.chapter-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}

.animal {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

b {
  font-size: 18px;
}

span {
  color: var(--muted);
  font-size: 15px;
  font-weight: 650;
}
</style>
