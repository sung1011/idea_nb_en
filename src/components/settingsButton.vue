<script setup lang="ts">
import { computed, ref } from 'vue'
import { playTap } from '../composables/useSfx'
import { useAppUpdate } from '../composables/useAppUpdate'
import appUpdateBubble from './appUpdateBubble.vue'
import settingsDialog from './settingsDialog.vue'

const open = ref(false)
const gearRef = ref<HTMLElement | null>(null)
const { updateReady } = useAppUpdate()
const gearLabel = computed(() => (updateReady.value ? '设置，有新版本' : '设置'))

function openSettings() {
  playTap()
  open.value = true
}
</script>

<template>
  <div class="gear-wrap">
    <button
      ref="gearRef"
      class="gear-btn"
      type="button"
      :aria-label="gearLabel"
      @click="openSettings"
    >
      <span aria-hidden="true">⚙️</span>
      <span v-if="updateReady" class="dot" aria-hidden="true"></span>
    </button>
  </div>
  <app-update-bubble :anchor="gearRef" />
  <settings-dialog v-model="open" />
</template>

<style scoped>
.gear-wrap {
  position: relative;
}

.gear-btn {
  position: relative;
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

.dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff5a5a;
  box-shadow: 0 0 0 2px #fffdf6;
}
</style>
