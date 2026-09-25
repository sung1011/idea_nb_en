<script setup lang="ts">
import { computed } from 'vue'
import { persistState } from '../composables/useProgress'
import { animalById, meadowDecoration, meadowSrc, type MeadowAnimalId } from './meadowConfig'

const emit = defineEmits<{
  close: []
  takePet: [id: MeadowAnimalId]
  takeDecor: [id: string]
}>()

const pets = computed(() =>
  persistState.meadow.owned.flatMap((row) => {
    if (!(row.storedAt > 0)) return []
    const def = animalById(row.id)
    return def ? [{ id: row.id, zh: def.zh, file: row.id }] : []
  }),
)

const decors = computed(() =>
  persistState.meadow.decorations.flatMap((row) => {
    if (!row.stored) return []
    const def = meadowDecoration(row.id)
    return def ? [{ id: row.id, zh: def.zh, file: def.file }] : []
  }),
)

const empty = computed(() => pets.value.length + decors.value.length === 0)
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="basket-title">
      <div class="head">
        <h2 id="basket-title">收纳篮</h2>
        <button class="close" type="button" @click="emit('close')">关掉</button>
      </div>
      <p v-if="empty" class="empty">篮子是空的</p>
      <template v-else>
        <h3>小动物</h3>
        <div v-if="pets.length" class="cards">
          <button v-for="item in pets" :key="item.id" class="card" type="button" @click="emit('takePet', item.id)">
            <img :src="meadowSrc(item.file)" alt="" draggable="false" />
            <span>{{ item.zh }}</span>
          </button>
        </div>
        <p v-else class="empty">没有小动物</p>
        <h3>装饰</h3>
        <div v-if="decors.length" class="cards">
          <button v-for="item in decors" :key="item.id" class="card" type="button" @click="emit('takeDecor', item.id)">
            <img :src="meadowSrc(item.file)" alt="" draggable="false" />
            <span>{{ item.zh }}</span>
          </button>
        </div>
        <p v-else class="empty">没有装饰</p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  background: rgba(14, 42, 58, 0.28);
}

.sheet {
  width: 100%;
  max-height: min(78dvh, 640px);
  overflow: auto;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius: 32px 32px 0 0;
  background: #fffdf6;
  box-shadow:
    0 -8px 0 #e7c48a,
    0 -16px 0 rgba(45, 58, 74, 0.08);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.head h2,
h3 {
  margin: 0;
}

.head h2 {
  font-size: 28px;
}

h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #8a5a12;
}

.close {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 16px;
  font-weight: 750;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 10px 8px 12px;
  border-radius: 22px;
  background: #fff8ee;
  box-shadow: 0 4px 0 #f0d7a8;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
}

.card img {
  width: 84px;
  height: 84px;
  object-fit: contain;
}

.empty {
  margin: 8px 0 0;
  color: #8a7564;
  font-size: 16px;
  font-weight: 700;
}
</style>
