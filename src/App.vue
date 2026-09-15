<script setup lang="ts">
import { useProgress } from './composables/useProgress'

useProgress()
</script>

<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>
