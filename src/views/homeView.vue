<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { useProgress } from '../composables/useProgress'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { state, gatesDone, allDoneToday, nextRoute, startLabel, hasDecoration, hasSticker } =
  useProgress()

const gates = [
  { id: 'soundFish', emoji: '🐠', label: 'Sound Fish' },
  { id: 'wordMorph', emoji: '🪄', label: 'Word Morph' },
  { id: 'echoCave', emoji: '🎤', label: 'Echo Cave' },
] as const

const rugOn = computed(() => hasDecoration(family.rewards.wordMorphDecoration.id))
const earOn = computed(() => hasSticker(family.rewards.soundFishSticker.id))

function go() {
  void router.push(nextRoute.value)
}
</script>

<template>
  <section class="screen home">
    <header class="top-row">
      <star-bar />
      <p class="day-chip">打卡 {{ state.dayStars }} 天</p>
    </header>

    <div class="hero center">
      <p class="eyebrow">每日自然拼读</p>
      <h1 class="title-xl">Star Words</h1>
      <p class="zh-title">星词岛</p>
      <p class="sub">今日目标：读完 {{ family.family }} 家族 · {{ family.targets.join(' / ') }}</p>
    </div>

    <div class="island-wrap">
      <div class="sun" aria-hidden="true" />
      <div class="cloud c1" aria-hidden="true" />
      <div class="cloud c2" aria-hidden="true" />
      <div class="sea" aria-hidden="true">
        <div class="wave" />
      </div>
      <div class="island">
        <div class="guide floaty">⭐</div>
        <div v-if="earOn" class="deco ear popin">👂</div>
        <div v-if="rugOn" class="deco rug popin">🧶</div>
        <div class="palm">🌴</div>
      </div>
    </div>

    <div class="card progress-card">
      <p class="progress-title">今日三关 · {{ gatesDone }}/3</p>
      <div class="gates">
        <div
          v-for="gate in gates"
          :key="gate.id"
          class="gate"
          :class="{ done: state.daily.gates[gate.id] }"
        >
          <span class="gate-emoji">{{ gate.emoji }}</span>
          <span>{{ gate.label }}</span>
          <b>{{ state.daily.gates[gate.id] ? '好' : '待' }}</b>
        </div>
      </div>
      <p class="parent-line">
        {{ allDoneToday ? '今日目标已完成，星星已收好。' : '家长小记：没有对错惩罚，做错会再听一遍。' }}
      </p>
    </div>

    <big-button class="start-btn" @click="go">{{ startLabel }}</big-button>
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

.island-wrap {
  position: relative;
  height: 210px;
  margin: 4px 0 8px;
}

.sun {
  position: absolute;
  right: 18px;
  top: 8px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #ffe27a;
  box-shadow: 0 0 0 8px rgba(255, 226, 122, 0.35);
}

.cloud {
  position: absolute;
  background: #fff;
  border-radius: 999px;
  width: 70px;
  height: 24px;
  opacity: 0.9;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: #fff;
  border-radius: 50%;
}

.cloud::before {
  width: 28px;
  height: 28px;
  left: 10px;
  top: -14px;
}

.cloud::after {
  width: 36px;
  height: 36px;
  right: 12px;
  top: -18px;
}

.c1 {
  left: 12px;
  top: 18px;
}

.c2 {
  right: 70px;
  top: 48px;
  transform: scale(0.8);
}

.sea {
  position: absolute;
  left: -18px;
  right: -18px;
  bottom: 18px;
  height: 54px;
  overflow: hidden;
}

.wave {
  width: 200%;
  height: 54px;
  background: radial-gradient(circle at 25px 0, var(--ocean) 24px, transparent 25px) repeat-x;
  background-size: 50px 54px;
  animation: wave 4s linear infinite;
  opacity: 0.85;
}

.island {
  position: absolute;
  left: 50%;
  bottom: 28px;
  width: 230px;
  height: 92px;
  margin-left: -115px;
  background: radial-gradient(ellipse at 50% 40%, #98e09a, var(--island) 70%);
  border-radius: 50%;
  box-shadow: 0 16px 0 rgba(45, 138, 122, 0.18);
}

.guide {
  position: absolute;
  left: 50%;
  top: -46px;
  margin-left: -28px;
  font-size: 56px;
  filter: drop-shadow(0 6px 0 rgba(244, 180, 0, 0.25));
}

.deco {
  position: absolute;
  font-size: 34px;
}

.ear {
  left: 18px;
  top: -8px;
}

.rug {
  right: 28px;
  top: 18px;
}

.palm {
  position: absolute;
  right: 16px;
  top: -38px;
  font-size: 36px;
}

.progress-card {
  margin-top: auto;
}

.progress-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
}

.gates {
  display: grid;
  gap: 8px;
}

.gate {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 16px;
  background: #f3f7fb;
  font-weight: 650;
}

.gate.done {
  background: #e4f8ec;
}

.gate-emoji {
  font-size: 24px;
}

.parent-line {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.start-btn {
  margin-top: 14px;
}
</style>
