<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    size?: 'lg' | 'md' | 'sm'
  }>(),
  { size: 'md' },
)
</script>

<template>
  <span class="number-clay" :class="[size, { wide: value >= 100 }]">{{ value }}</span>
</template>

<style scoped>
.number-clay {
  display: inline-grid;
  place-items: center;
  border-radius: 28px;
  border: 4px solid #f0c36a;
  background: linear-gradient(180deg, #fffef8 0%, #fff1c9 100%);
  color: #e07a12;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  box-shadow:
    0 8px 0 #f4b400,
    inset 0 3px 0 rgba(255, 255, 255, 0.9);
}

.lg {
  min-width: 148px;
  min-height: 112px;
  padding: 8px 22px 14px;
  font-size: 84px;
  border-radius: 36px;
}

.lg.wide {
  font-size: 64px;
  letter-spacing: -0.04em;
}

.md {
  min-width: 88px;
  min-height: 72px;
  padding: 6px 14px 10px;
  font-size: 40px;
}

.md.wide {
  font-size: 32px;
}

.sm {
  min-width: 72px;
  min-height: 64px;
  padding: 4px 10px 8px;
  font-size: 32px;
  border-width: 3px;
  border-radius: 22px;
  box-shadow:
    0 5px 0 #f4b400,
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
}

.sm.wide {
  font-size: 26px;
}
</style>
