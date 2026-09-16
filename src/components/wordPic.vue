<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { wordEmoji, wordImage } from '../data/phonicsFamily'

const props = withDefaults(
  defineProps<{
    word: string
    size?: number
    decorative?: boolean
  }>(),
  {
    decorative: true,
  },
)

const failed = ref(false)
const src = computed(() => wordImage(props.word))
const sizeStyle = computed(() =>
  props.size
    ? {
        width: `${props.size}px`,
        height: `${props.size}px`,
        fontSize: `${Math.round(props.size * 0.72)}px`,
      }
    : undefined,
)

watch(
  () => props.word,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <span class="word-pic" :class="{ sized: Boolean(size) }" :style="sizeStyle">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="decorative ? '' : word"
      :aria-hidden="decorative ? true : undefined"
      decoding="async"
      @error="failed = true"
    />
    <span v-else :aria-hidden="decorative ? true : undefined">{{ wordEmoji(word) }}</span>
  </span>
</template>

<style scoped>
.word-pic {
  display: grid;
  place-items: center;
  line-height: 1;
}

.word-pic img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.word-pic:not(.sized) img {
  width: 1em;
  height: 1em;
}
</style>
