<script setup lang="ts">
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()

function startReview() {
  void router.push({ path: '/sound-fish', query: { review: '1' } })
}
</script>

<template>
  <section class="screen workshop">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">复习入口</p>
      <h1 class="title-lg">字母工坊</h1>
      <p class="sub">复习音族，不代替今日派对作业</p>
    </div>

    <div class="card family-card">
      <p class="family-title">{{ family.family }} 家族</p>
      <p class="family-note">小猫请客用的派对词：主人 cat，道具 hat / mat</p>
      <ul class="word-list">
        <li v-for="word in family.targets" :key="word">
          <span class="word-emoji">{{ wordEmoji(word, family) }}</span>
          <b>{{ word }}</b>
        </li>
      </ul>
    </div>

    <p class="hint center">复习重玩两关，不会再发首次通关星星。</p>
    <big-button variant="soft" @click="startReview">复习 {{ family.family }} 两关</big-button>
  </section>
</template>

<style scoped>
.workshop {
  gap: 14px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.family-card {
  margin-top: 8px;
}

.family-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
}

.family-note {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 15px;
}

.word-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.word-list li {
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 16px;
  background: #f3f7fb;
  font-size: 20px;
}

.word-emoji {
  font-size: 26px;
}

.hint {
  margin-top: auto;
}
</style>
