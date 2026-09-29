<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import settingsButton from '../components/settingsButton.vue'
import starBar from '../components/starBar.vue'
import todayGoalBar from '../components/todayGoalBar.vue'
import { tweenCelebrate } from '../composables/useMotion'
import { dateKey, persistState } from '../composables/useProgress'
import { meadowIsOpen } from '../meadow/meadowConfig'

const router = useRouter()
const heroEl = ref<HTMLElement | null>(null)
const meadowLocked = computed(() => !meadowIsOpen(persistState.meadow, dateKey()))

onMounted(() => {
  void tweenCelebrate(heroEl.value)
})

function goGallery() {
  void router.push('/play-gallery')
}

function goAtlas() {
  void router.push('/word-atlas')
}

function goSentences() {
  void router.push('/sentence-atlas')
}

function goAlbum() {
  void router.push('/sticker-album')
}

function goMeadow() {
  void router.push('/star-meadow')
}
</script>

<template>
  <section class="screen home">
    <header class="top-row">
      <star-bar />
      <div class="top-tools">
        <settings-button />
      </div>
    </header>

    <div ref="heroEl" class="hero center">
      <p class="eyebrow">主题岛 · 学校课表</p>
      <h1 class="title-xl">Star Words</h1>
      <p class="zh-title">星词岛</p>
      <p class="sub">从第 1 课开始，跟着学校一课一课玩</p>
    </div>

    <today-goal-bar class="home-goal" />

    <button class="meadow-btn" type="button" @click="goMeadow">
      <span aria-hidden="true">🌿</span>
      星星草地
      <span v-if="meadowLocked" class="lock-badge" aria-label="还没开门">🔒</span>
    </button>
    <button class="album-btn" type="button" @click="goAlbum">
      <span aria-hidden="true">📒</span>
      贴纸相册
    </button>
    <div class="atlas-row">
      <button class="atlas-chip" type="button" @click="goAtlas">单词图鉴</button>
      <button class="atlas-chip" type="button" @click="goSentences">句子图鉴</button>
    </div>
    <div class="weak-links">
      <button class="weak-link" type="button" @click="goGallery">玩法一览</button>
    </div>
  </section>
</template>

<style scoped>
.home {
  gap: 4px;
  max-height: 100dvh;
  overflow: auto;
  padding-top: 10px;
  padding-bottom: 8px;
}

.top-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eyebrow {
  margin: 2px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.home :deep(.title-xl) {
  margin-top: 0;
  font-size: 32px;
}

.zh-title {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
}

.sub {
  margin-top: 2px;
  font-size: 15px;
}

.home-goal {
  margin-top: 4px;
}

.album-btn {
  width: 100%;
  margin-top: 0;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 999px;
  background: #fff7d6;
  color: var(--ink);
  font-size: 20px;
  font-weight: 750;
  box-shadow: 0 6px 0 rgba(244, 180, 0, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.album-btn:active {
  transform: translateY(2px);
}

.meadow-btn {
  position: relative;
  width: 100%;
  margin-top: 0;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 999px;
  background: #e7f8e4;
  color: var(--ink);
  font-size: 20px;
  font-weight: 750;
  box-shadow: 0 6px 0 rgba(70, 150, 80, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.meadow-btn:active {
  transform: translateY(2px);
}

.lock-badge {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #fff;
  font-size: 14px;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 0 rgba(45, 58, 74, 0.12);
}

.atlas-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.atlas-chip {
  min-height: 52px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 18px;
  font-weight: 750;
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.12);
}

.atlas-chip:active {
  transform: translateY(2px);
}

.weak-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 16px;
  margin-top: 0;
}

@media (max-height: 700px) {
  .eyebrow,
  .sub {
    display: none;
  }

  .home :deep(.big-btn),
  .meadow-btn,
  .album-btn {
    min-height: 48px;
  }
}

.weak-link {
  min-height: 44px;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
