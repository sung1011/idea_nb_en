<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { tweenCelebrate, tweenPulse } from '../composables/useMotion'
import { ISLAND_DAY_CAP, useProgress } from '../composables/useProgress'

const props = withDefaults(
  defineProps<{
    celebrateOnGain?: boolean
  }>(),
  {
    celebrateOnGain: true,
  },
)

const { lifetime, today } = useProgress()

const cap = ISLAND_DAY_CAP
const litDays = computed(() => {
  const n = Math.max(0, Math.floor(lifetime.animalsIslandDays))
  return Math.min(cap, n)
})
const full = computed(() => litDays.value >= cap)
const labelText = computed(() => `小岛亮了 ${litDays.value}/${cap} 天`)
const teaserText = '小岛天天都亮啦，明天还来玩'
const slots = computed(() =>
  Array.from({ length: cap }, (_, index) => ({
    index,
    day: index + 1,
    filled: index < litDays.value,
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

watch(litDays, async (next, prev) => {
  if (!props.celebrateOnGain) return
  if (typeof prev !== 'number' || next <= prev) return
  const just = next - 1
  if (just < 0) return
  await celebrateCell(just)
})

onMounted(() => {
  if (!props.celebrateOnGain || litDays.value <= 0) return
  if (!today.completed) return
  void celebrateCell(litDays.value - 1)
})
</script>

<template>
  <div
    class="island-days"
    :class="{ full }"
    data-island-day-cells
    :aria-label="labelText"
    aria-live="polite"
  >
    <p class="island-days-label">{{ labelText }}</p>
    <div class="island-days-row" role="list">
      <span
        v-for="slot in slots"
        :key="slot.day"
        :ref="(el) => bindCell(el as Element | null, slot.index)"
        class="cell"
        :class="{ on: slot.filled, pop: popping === slot.index }"
        :data-island-day-slot="slot.filled ? 'filled' : 'empty'"
        :data-island-day="slot.day"
        role="listitem"
        :aria-label="slot.filled ? `第 ${slot.day} 天亮了` : `第 ${slot.day} 天还没亮`"
      >
        <span class="cell-face" aria-hidden="true">{{ slot.filled ? '☀️' : slot.day }}</span>
      </span>
    </div>
    <p v-if="full" class="island-days-teaser">{{ teaserText }}</p>
  </div>
</template>

<style scoped>
.island-days {
  width: 100%;
  padding: 12px 12px 10px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.island-days.full {
  background: linear-gradient(180deg, #fff6d0 0%, #fffdf3 72%);
  box-shadow: 0 8px 0 rgba(244, 180, 0, 0.18);
}

.island-days-label {
  margin: 0 0 8px;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.island-days-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
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

.island-days-teaser {
  margin: 8px 0 0;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--ok);
}
</style>
