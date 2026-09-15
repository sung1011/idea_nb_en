<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'soft' | 'listen'
}>()
</script>

<template>
  <button class="big-btn" :class="variant ?? 'primary'" type="button">
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

.listen {
  background: linear-gradient(180deg, #a78bfa 0%, var(--grape) 100%);
  color: #fff;
  box-shadow: 0 8px 0 #5b4d9a;
}
</style>
