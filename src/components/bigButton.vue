<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'soft' | 'outline' | 'listen' | 'danger'
  compact?: boolean
}>()
</script>

<template>
  <button class="big-btn" :class="[variant ?? 'primary', { compact }]" type="button">
    <slot />
  </button>
</template>

<style scoped>
.big-btn {
  width: 100%;
  min-height: var(--touch);
  padding: 16px 20px;
  border-radius: 999px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: transform 0.12s ease;
}

.big-btn:active:not(:disabled) {
  transform: translateY(3px);
}

.primary {
  background: linear-gradient(180deg, #ffc56d 0%, var(--btn) 100%);
  color: var(--btn-ink);
  box-shadow: 0 8px 0 #d97706;
}

.soft {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.12);
}

.outline {
  background: transparent;
  color: var(--ink);
  box-shadow: none;
  border: 3px solid rgba(45, 58, 74, 0.22);
}

.listen {
  background: linear-gradient(180deg, #a78bfa 0%, var(--grape) 100%);
  color: #fff;
  box-shadow: 0 8px 0 #5b4d9a;
}

.danger {
  background: linear-gradient(180deg, #ffb199 0%, #ff8a65 100%);
  color: #4a1808;
  box-shadow: 0 8px 0 #e07050;
}

.compact {
  min-height: 52px;
  padding: 12px 18px;
  font-size: 18px;
}
</style>
