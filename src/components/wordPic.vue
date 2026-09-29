<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { wordEmoji, wordImage } from '../data/phonicsFamily'

const props = withDefaults(
  defineProps<{
    word: string
    size?: number
    decorative?: boolean
    wide?: boolean
  }>(),
  {
    decorative: true,
    wide: false,
  },
)

const failed = ref(false)
const src = computed(() => wordImage(props.word))
const sizeStyle = computed(() => {
  if (props.wide || !props.size) return undefined
  return {
    '--pic': `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.72)}px`,
  }
})

watch(
  () => props.word,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <span class="word-pic" :class="{ sized: Boolean(size) && !wide, wide }" :style="sizeStyle">
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

.word-pic.sized {
  width: var(--pic);
  height: var(--pic);
}

.word-pic.wide {
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
}

.word-pic img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.word-pic:not(.sized):not(.wide) img {
  width: 1em;
  height: 1em;
}
</style>
