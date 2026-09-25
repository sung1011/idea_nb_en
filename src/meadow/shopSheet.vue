<script setup lang="ts">
import { computed } from 'vue'
import { buyMeadowDecoration, meadowStarsLeft, persistState } from '../composables/useProgress'
import { MEADOW_DECORATIONS, meadowSrc, type MeadowDecorSave } from './meadowConfig'

const emit = defineEmits<{
  close: []
  bought: [item: MeadowDecorSave]
}>()

const starsLeft = computed(() => meadowStarsLeft())
const ownedIds = computed(() => new Set(persistState.meadow.decorations.map((item) => item.id)))

function owned(id: string) {
  return ownedIds.value.has(id)
}

function shortfall(price: number) {
  return Math.max(0, price - starsLeft.value)
}

function canBuy(id: string, price: number) {
  return !owned(id) && starsLeft.value >= price
}

function buy(id: string, price: number) {
  if (!canBuy(id, price)) return
  const row = buyMeadowDecoration(id)
  if (row) emit('bought', row)
}
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <div class="head">
        <h2 id="shop-title">小商店</h2>
        <p class="purse" aria-label="可以花的星星">⭐ {{ starsLeft }}</p>
        <button class="close" type="button" @click="emit('close')">关掉</button>
      </div>
      <div class="cards">
        <article v-for="item in MEADOW_DECORATIONS" :key="item.id" class="card">
          <img :src="meadowSrc(item.file)" alt="" draggable="false" />
          <p class="name">{{ item.zh }}</p>
          <p class="price">{{ item.price }} ⭐</p>
          <button
            class="buy"
            :class="{ short: !owned(item.id) && shortfall(item.price) > 0, owned: owned(item.id) }"
            type="button"
            :disabled="!canBuy(item.id, item.price)"
            @click="buy(item.id, item.price)"
          >
            <template v-if="owned(item.id)">已拥有</template>
            <template v-else-if="shortfall(item.price) > 0">还差 {{ shortfall(item.price) }} 颗星</template>
            <template v-else>买下</template>
          </button>
        </article>
      </div>
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
    0 -8px 0 #f0c36a,
    0 -16px 0 rgba(45, 58, 74, 0.08);
}

.head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.head h2 {
  margin: 0;
  font-size: 28px;
}

.purse {
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff4d2;
  color: #8a5a12;
  font-size: 18px;
  font-weight: 800;
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
  padding: 12px 10px 14px;
  border: 3px solid #f0c36a;
  border-radius: 24px;
  background: linear-gradient(180deg, #fffef8 0%, #fff1c9 100%);
  box-shadow:
    0 6px 0 #f4b400,
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
}

.card img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  object-position: center bottom;
}

.name {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.price {
  margin: 0;
  color: #8a5a12;
  font-size: 16px;
  font-weight: 750;
}

.buy {
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
}

.buy:disabled {
  box-shadow: none;
}

.buy.owned:disabled {
  background: #e7f8e4;
  color: #2f7d4a;
}

.buy.short:disabled {
  background: #e7f3ff;
  color: #5d7f9a;
}
</style>
