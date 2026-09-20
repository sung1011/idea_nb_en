<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { tweenCelebrate, tweenPulse } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'

const props = withDefaults(
  defineProps<{
    size?: 'compact' | 'default' | 'large'
    showLabel?: boolean
    celebrateOnGain?: boolean
  }>(),
  {
    size: 'default',
    showLabel: true,
    celebrateOnGain: true,
  },
)

const { today, ensureTodayTask } = useProgress()
ensureTodayTask()

const earned = computed(() => Math.max(0, Math.floor(today.starsEarned)))
const goal = computed(() => Math.max(1, Math.floor(today.starsGoal ?? 4)))
const filledCount = computed(() => Math.min(earned.value, goal.value))
const slots = computed(() =>
  Array.from({ length: goal.value }, (_, index) => ({
    index,
    filled: index < filledCount.value,
  })),
)
const labelText = computed(() => `过关星星 ${filledCount.value}/${goal.value}`)

const popping = ref<number | null>(null)
const starMap = new Map<number, HTMLElement>()

function bindStar(el: Element | null, index: number) {
  if (el instanceof HTMLElement) starMap.set(index, el)
  else starMap.delete(index)
}

watch(earned, async (next, prev) => {
  if (!props.celebrateOnGain) return
  if (typeof prev !== 'number' || next <= prev) return
  const just = Math.min(next, goal.value) - 1
  if (just < 0) return
  popping.value = just
  await nextTick()
  const el = starMap.get(just)
  if (el) {
    await Promise.all([tweenCelebrate(el), tweenPulse(el)])
  }
  if (popping.value === just) popping.value = null
})
</script>

<template>
  <div
    class="today-stars"
    :class="[size, { done: filledCount >= goal }]"
    data-today-star-bar
    :aria-label="labelText"
  >
    <p v-if="showLabel" class="today-stars-label">过关星星</p>
    <div class="today-stars-row">
      <span
        v-for="slot in slots"
        :key="slot.index"
        :ref="(el) => bindStar(el as Element | null, slot.index)"
        class="slot"
        :class="{ on: slot.filled, pop: popping === slot.index }"
        :data-today-star-slot="slot.filled ? 'filled' : 'empty'"
        aria-hidden="true"
      >
        ⭐
      </span>
    </div>
    <p class="today-stars-count">{{ filledCount }}/{{ goal }}</p>
  </div>
</template>

<style scoped>
.today-stars {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 22px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.1);
}

.today-stars.done {
  background: #fff6d0;
  box-shadow: 0 6px 0 rgba(244, 180, 0, 0.2);
}

.today-stars-label {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.today-stars-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.slot {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #fff8e4;
  border: 2px dashed #e4c56a;
  font-size: 28px;
  line-height: 1;
  filter: grayscale(0.35);
  opacity: 0.72;
}

.slot.on {
  background: #ffe27a;
  border: 2px solid #f4b400;
  filter: none;
  opacity: 1;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.28);
}

.slot.pop {
  animation: popin 0.45s ease;
}

.today-stars-count {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.today-stars.compact {
  padding: 6px 10px;
  border-radius: 20px;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.08);
}

.today-stars.compact .today-stars-label {
  font-size: 14px;
}

.today-stars.compact .today-stars-row {
  gap: 6px;
}

.today-stars.compact .slot {
  width: 36px;
  height: 36px;
  font-size: 24px;
}

.today-stars.compact .today-stars-count {
  font-size: 15px;
}

.today-stars.large {
  padding: 12px 16px;
  border-radius: 26px;
}

.today-stars.large .today-stars-label {
  font-size: 18px;
}

.today-stars.large .today-stars-row {
  gap: 10px;
}

.today-stars.large .slot {
  width: 52px;
  height: 52px;
  font-size: 34px;
}

.today-stars.large .today-stars-count {
  font-size: 20px;
}
</style>
