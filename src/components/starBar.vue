<script setup lang="ts">
import { useProgress } from '../composables/useProgress'

const { state } = useProgress()
</script>

<template>
  <div class="stars" aria-label="星星数量">
    <span class="star" aria-hidden="true">⭐</span>
    <strong>{{ state.stars }}</strong>
  </div>
</template>

<style scoped>
.stars {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.1);
  font-size: 22px;
}

.star {
  font-size: 26px;
}

strong {
  font-size: 22px;
}
</style>
