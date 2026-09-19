<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { tweenPulse, tweenShake } from '../composables/useMotion'
import { useStickerAlbum, type AlbumSlot } from '../composables/useStickerAlbum'
import { playNudge, playPop } from '../composables/useSfx'

const router = useRouter()
const { slots, ownedCount, total, isEmpty } = useStickerAlbum()
const busy = ref(false)

async function onTap(item: AlbumSlot, event: MouseEvent) {
  if (busy.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  if (!item.owned) {
    playNudge()
    await tweenShake(target, 6)
    return
  }
  busy.value = true
  playPop()
  void tweenPulse(target)
  busy.value = false
}

function goIsland() {
  void router.push('/animal-island')
}
</script>

<template>
  <section class="screen album">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">Sticker Album</p>
      <h1 class="title-lg">贴纸相册</h1>
      <p class="sub">通关派对就能贴一张 · 看看你已经收集了哪些</p>
    </div>

    <p class="progress-line center">已收集 {{ ownedCount }} / {{ total }}</p>

    <div v-if="isEmpty" class="empty-card">
      <p class="empty-line">还没有贴纸，先去玩今日主线吧</p>
      <big-button class="empty-go" @click="goIsland">去动物岛</big-button>
    </div>

    <div class="grid" role="list">
      <button
        v-for="item in slots"
        :key="item.id"
        class="slot"
        :class="{ locked: !item.owned }"
        type="button"
        role="listitem"
        :aria-label="item.owned ? item.label : '还没拿到的贴纸'"
        @click="onTap(item, $event)"
      >
        <span class="pic" aria-hidden="true">{{ item.emoji }}</span>
        <span v-if="item.owned" class="label">{{ item.label }}</span>
        <span v-else class="mystery" aria-hidden="true">?</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.album {
  gap: 10px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.progress-line {
  margin: 4px 0 0;
  font-weight: 700;
}

.empty-card {
  margin-top: 8px;
  padding: 16px 14px 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
  display: grid;
  gap: 10px;
  justify-items: stretch;
}

.empty-line {
  margin: 0;
  text-align: center;
  font-size: 17px;
  font-weight: 750;
  line-height: 1.4;
}

.empty-go {
  min-height: 56px;
  font-size: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 8px;
  padding-bottom: 8px;
}

.slot {
  min-height: 118px;
  padding: 10px 6px 12px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
}

.slot:active {
  transform: translateY(2px);
}

.pic {
  font-size: 42px;
  line-height: 1;
}

.label {
  font-size: 15px;
  font-weight: 750;
}

.mystery {
  min-width: 28px;
  min-height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #e8eef4;
  color: var(--muted);
  font-size: 18px;
  font-weight: 800;
}

.locked {
  background: #d7dee6;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.locked .pic {
  filter: brightness(0) opacity(0.28);
}
</style>
