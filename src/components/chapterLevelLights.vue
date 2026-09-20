<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { tweenCelebrate, tweenPulse } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { chapterPracticeCopy } from '../data/todayTasks'

const props = withDefaults(
  defineProps<{
    celebrateOnGain?: boolean
    showLabel?: boolean
    embedded?: boolean
  }>(),
  {
    celebrateOnGain: true,
    showLabel: true,
    embedded: false,
  },
)

const { chapter } = useProgress()

const cap = computed(() => Math.max(1, chapter.value.levelTotal))
const lit = computed(() => Math.min(cap.value, Math.max(0, chapter.value.clearedCount)))
const full = computed(() => chapter.value.complete || lit.value >= cap.value)
const labelText = computed(() => `第1章 ${lit.value}/${cap.value} 关`)
const teaserText = chapterPracticeCopy()
const slots = computed(() =>
  Array.from({ length: cap.value }, (_, index) => ({
    index,
    order: index + 1,
    filled: index < lit.value,
  })),
)

const popping = ref<number | null>(null)
const cellMap = new Map<number, HTMLElement>()

function bindCell(el: Element | null, index: number) {
  if (el instanceof HTMLElement) cellMap.set(index, el)
  else cellMap.delete(index)
}

async function celebrateCell(index: number) {
  popping.value = index
  await nextTick()
  const el = cellMap.get(index)
  if (el) {
    await Promise.all([tweenCelebrate(el), tweenPulse(el)])
  }
  if (popping.value === index) popping.value = null
}

watch(lit, async (next, prev) => {
  if (!props.celebrateOnGain) return
  if (typeof prev !== 'number' || next <= prev) return
  const just = next - 1
  if (just < 0) return
  await celebrateCell(just)
})

onMounted(() => {
  if (!props.celebrateOnGain || lit.value <= 0) return
  if (!chapter.value.complete) return
  void celebrateCell(lit.value - 1)
})
</script>

<template>
  <div
    class="chapter-lights"
    :class="{ full, embedded }"
    data-chapter-level-lights
    :aria-label="labelText"
    aria-live="polite"
  >
    <p v-if="showLabel" class="chapter-lights-label">{{ labelText }}</p>
    <div class="chapter-lights-row" role="list">
      <span
        v-for="slot in slots"
        :key="slot.order"
        :ref="(el) => bindCell(el as Element | null, slot.index)"
        class="cell"
        :class="{ on: slot.filled, pop: popping === slot.index }"
        :data-chapter-level-slot="slot.filled ? 'filled' : 'empty'"
        :data-chapter-level-order="slot.order"
        role="listitem"
        :aria-label="slot.filled ? `第 ${slot.order} 关过啦` : `第 ${slot.order} 关还没过`"
      >
        <span class="cell-face" aria-hidden="true">{{ slot.filled ? '⭐' : slot.order }}</span>
      </span>
    </div>
    <p v-if="full" class="chapter-lights-teaser">{{ teaserText }}</p>
  </div>
</template>

<style scoped>
.chapter-lights {
  width: 100%;
  padding: 12px 12px 10px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.chapter-lights.full {
  background: linear-gradient(180deg, #fff6d0 0%, #fffdf3 72%);
  box-shadow: 0 8px 0 rgba(244, 180, 0, 0.18);
}

.chapter-lights.embedded {
  padding: 8px 0 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.chapter-lights.embedded.full {
  background: transparent;
  box-shadow: none;
}

.chapter-lights-label {
  margin: 0 0 8px;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.chapter-lights-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  align-items: center;
}

.cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-height: 38px;
  border-radius: 50%;
  background: #eef6f4;
  border: 2px dashed #c5d8d2;
  color: #8aa0aa;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.78;
}

.cell.on {
  background: #ffe27a;
  border: 2px solid #f4b400;
  color: var(--ink);
  font-size: 20px;
  filter: none;
  opacity: 1;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.28);
}

.cell.pop {
  animation: popin 0.45s ease;
}

.cell-face {
  display: grid;
  place-items: center;
}

.chapter-lights-teaser {
  margin: 8px 0 0;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--ok);
}
</style>
