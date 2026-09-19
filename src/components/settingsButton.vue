<script setup lang="ts">
import { ref } from 'vue'
import { playTap } from '../composables/useSfx'
import settingsDialog from './settingsDialog.vue'

const open = ref(false)

function openSettings() {
  playTap()
  open.value = true
}
</script>

<template>
  <button class="gear-btn" type="button" aria-label="设置" @click="openSettings">
    <span aria-hidden="true">⚙️</span>
  </button>
  <settings-dialog v-model="open" />
</template>

<style scoped>
.gear-btn {
  display: grid;
  place-items: center;
  width: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
  font-size: 22px;
}
</style>
