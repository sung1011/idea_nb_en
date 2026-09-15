<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { tweenCelebrate } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { state, gatesDone, allDoneToday } = useProgress()
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

function goWorkshop() {
  void router.push('/letter-workshop')
}
</script>

<template>
  <section class="screen home">
    <header class="top-row">
      <star-bar />
      <p class="day-chip">打卡 {{ state.dayStars }} 天</p>
    </header>

    <div ref="heroEl" class="hero center">
      <p class="eyebrow">每日主题岛</p>
      <h1 class="title-xl">Star Words</h1>
      <p class="zh-title">星词岛</p>
      <p class="sub">先去动物岛，帮小猫办 {{ family.family }} 派对</p>
    </div>

    <div class="card island-card">
      <div class="island-preview">
        <span class="host floaty" aria-hidden="true">🐱</span>
        <div>
          <p class="island-name">动物岛</p>
          <p class="island-goal">帮小猫把 {{ family.family }} 朋友请来派对！</p>
        </div>
      </div>
      <p class="progress-line" :class="{ done: allDoneToday }">
        今日进度 {{ gatesDone }}/3
        <template v-if="allDoneToday"> · 派对完成</template>
      </p>
    </div>

    <big-button class="start-btn" @click="goIsland">去动物岛</big-button>
    <big-button class="gallery-btn" variant="soft" @click="goGallery">玩法一览</big-button>
    <button class="workshop-link" type="button" @click="goWorkshop">字母工坊 / 复习音族</button>
  </section>
</template>

<style scoped>
.home {
  gap: 10px;
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

.island-card {
  margin-top: 18px;
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

.progress-line {
  margin: 14px 0 0;
  font-weight: 700;
}

.progress-line.done {
  color: var(--ok);
}

.start-btn {
  margin-top: auto;
}

.gallery-btn {
  margin-top: 10px;
}

.workshop-link {
  margin-top: 8px;
  min-height: 48px;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
