<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import chapterLevelLights from '../components/chapterLevelLights.vue'
import settingsButton from '../components/settingsButton.vue'
import starBar from '../components/starBar.vue'
import todayGoalBar from '../components/todayGoalBar.vue'
import { tweenCelebrate } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { locationForChapterPractice } from '../data/playGallery'
import { getCurrentFamily } from '../data/phonicsFamily'
import { practiceEntryCopy } from '../data/todayTasks'

const router = useRouter()
const family = getCurrentFamily()
const { chapter } = useProgress()
const heroEl = ref<HTMLElement | null>(null)

onMounted(() => {
  void tweenCelebrate(heroEl.value)
})

function goIsland() {
  void router.push('/animal-island')
}

function goGallery() {
  void router.push('/play-gallery')
}

function goPractice() {
  void router.push(locationForChapterPractice())
}

function goWorkshop() {
  void router.push('/letter-workshop')
}

function goAtlas() {
  void router.push('/word-atlas')
}

function goAlbum() {
  void router.push('/sticker-album')
}
</script>

<template>
  <section class="screen home">
    <header class="top-row">
      <star-bar />
      <div class="top-tools">
        <p class="day-chip">第1章 {{ chapter.clearedCount }}/{{ chapter.levelTotal }}</p>
        <settings-button />
      </div>
    </header>

    <div ref="heroEl" class="hero center">
      <p class="eyebrow">主题岛 · 第一章派对</p>
      <h1 class="title-xl">Star Words</h1>
      <p class="zh-title">星词岛</p>
      <p class="sub">先去动物岛，帮小猫办 {{ family.family }} 派对</p>
    </div>

    <today-goal-bar class="home-goal" />

    <div class="card island-card">
      <div class="island-preview">
        <span class="host floaty" aria-hidden="true">🐱</span>
        <div>
          <p class="island-name">动物岛</p>
          <p class="island-goal">帮小猫把 {{ family.family }} 朋友请来派对！</p>
        </div>
      </div>
      <chapter-level-lights class="home-level-lights" embedded :show-label="false" />
    </div>

    <big-button class="start-btn" @click="goIsland">去动物岛</big-button>
    <big-button
      v-if="chapter.complete"
      class="practice-btn"
      variant="soft"
      data-practice-entry
      @click="goPractice"
    >
      {{ practiceEntryCopy() }}
    </big-button>
    <big-button class="gallery-btn" variant="soft" @click="goGallery">玩法一览</big-button>
    <button class="album-btn" type="button" @click="goAlbum">
      <span aria-hidden="true">📒</span>
      贴纸相册
    </button>
    <div class="weak-links">
      <button class="workshop-link" type="button" @click="goWorkshop">字母工坊 / 复习音族</button>
      <button class="workshop-link" type="button" @click="goAtlas">单词图鉴</button>
    </div>
  </section>
</template>

<style scoped>
.home {
  gap: 10px;
}

.top-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-chip {
  margin: 0;
  min-height: 48px;
  display: grid;
  place-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  font-weight: 650;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.zh-title {
  margin: 2px 0 0;
  font-size: 22px;
  font-weight: 650;
}

.home-goal {
  margin-top: 14px;
}

.island-card {
  margin-top: 12px;
}

.island-preview {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  align-items: center;
}

.host {
  font-size: 48px;
  line-height: 1;
}

.island-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.island-goal {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 15px;
}

.home-level-lights {
  margin-top: 12px;
}

.start-btn {
  margin-top: auto;
}

.practice-btn,
.gallery-btn {
  margin-top: 10px;
}

.album-btn {
  width: 100%;
  margin-top: 10px;
  min-height: 56px;
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

.weak-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 16px;
  margin-top: 8px;
}

.workshop-link {
  min-height: 48px;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
