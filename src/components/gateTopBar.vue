<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayMode } from '../composables/usePlayMode'
import starBar from './starBar.vue'
import todayStarBar from './todayStarBar.vue'

const router = useRouter()
const { isPractice, backPath, backLabel } = usePlayMode()
</script>

<template>
  <header class="top-row">
    <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
    <today-star-bar v-if="!isPractice" size="compact" :show-label="false" />
    <star-bar v-else />
  </header>
</template>
