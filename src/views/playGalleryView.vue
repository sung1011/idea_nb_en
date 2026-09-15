<script setup lang="ts">
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { playItems } from '../data/playGallery'

const router = useRouter()

function openPlay(path: string) {
  void router.push({ path, query: { demo: '1' } })
}
</script>

<template>
  <section class="screen gallery">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">Play gallery</p>
      <h1 class="title-lg">玩法一览</h1>
      <p class="sub">点进去试玩，不算今日作业，不加星星</p>
    </div>

    <div class="list">
      <button
        v-for="item in playItems"
        :key="item.id"
        class="play-card"
        type="button"
        @click="openPlay(item.path)"
      >
        <span class="play-emoji">{{ item.emoji }}</span>
        <span class="play-copy">
          <b>{{ item.zh }}</b>
          <small>{{ item.name }}</small>
        </span>
        <span class="go">试玩</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.gallery {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.list {
  display: grid;
  gap: 10px;
  margin-top: 8px;
  padding-bottom: 8px;
}

.play-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.1);
  text-align: left;
}

.play-card:active {
  transform: translateY(2px);
}

.play-emoji {
  font-size: 32px;
}

.play-copy {
  display: grid;
  gap: 2px;
}

.play-copy b {
  font-size: 18px;
}

.play-copy small {
  color: var(--muted);
  font-size: 13px;
}

.go {
  font-weight: 700;
  color: #b45309;
}
</style>
