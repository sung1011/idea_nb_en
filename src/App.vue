<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useProgress } from './composables/useProgress'

useProgress()
const route = useRoute()
</script>

<template>
  <div class="app-shell">
    <router-view :key="route.fullPath" />
  </div>
</template>
