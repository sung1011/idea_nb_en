<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import todayGoalBar from '../components/todayGoalBar.vue'
import { tweenCelebrate, tweenPulse } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { state, gatesDone, gateTotal, allDoneToday, nextRoute, hasSticker } = useProgress()

const gates = [
  { id: 'soundFish', emoji: '🐠', label: '读词钓鱼' },
  { id: 'echoCave', emoji: '🎤', label: 'Echo Cave' },
] as const

const earOn = computed(() => hasSticker(family.rewards.soundFishSticker.id))
const startLabel = computed(() => {
  if (allDoneToday.value) return '看今日奖励'
  if (gatesDone.value > 0) return '继续派对'
  return '完整一日'
})

const hostEl = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)

function go() {
  void router.push(nextRoute.value)
}

onMounted(() => {
  void tweenCelebrate(hostEl.value)
  if (allDoneToday.value) void tweenPulse(progressEl.value)
})
</script>

<template>
  <section class="screen island-lobby">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">Animals Island</p>
      <h1 class="title-xl">动物岛</h1>
      <p class="sub">帮小猫把 {{ family.family }} 朋友请来派对</p>
    </div>

    <today-goal-bar class="island-goal" />

    <div class="island-wrap">
      <div class="sun" aria-hidden="true" />
      <div class="balloon b1" aria-hidden="true">🎈</div>
      <div class="balloon b2" aria-hidden="true">🎉</div>
      <div class="sea" aria-hidden="true">
        <div class="wave" />
      </div>
      <div class="island">
        <div ref="hostEl" class="guide floaty">🐱</div>
        <div v-if="earOn" class="deco ear popin">👂</div>
        <div class="prop hat" aria-hidden="true">🎩</div>
        <div class="palm">🌴</div>
      </div>
    </div>

    <p class="host-line center">小猫是派对主人 · hat / mat 是派对道具</p>

    <div class="card progress-card">
      <p ref="progressEl" class="progress-title">今日两关 · {{ gatesDone }}/{{ gateTotal }}</p>
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
        {{
          allDoneToday
            ? '今日派对已完成，星星已收好。'
            : '家长小记：没有对错惩罚，读错会再试一次。'
        }}
      </p>
    </div>

    <big-button class="start-btn" @click="go">{{ startLabel }}</big-button>
    <button class="gallery-link" type="button" @click="router.push('/play-gallery')">玩法一览</button>
  </section>
</template>

<style scoped>
.island-lobby {
  gap: 10px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.island-goal {
  margin: 4px 0 2px;
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

.balloon {
  position: absolute;
  font-size: 28px;
}

.b1 {
  left: 16px;
  top: 18px;
}

.b2 {
  right: 72px;
  top: 42px;
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

.prop.hat {
  position: absolute;
  left: 28px;
  top: 28px;
  font-size: 22px;
}

.palm {
  position: absolute;
  right: 16px;
  top: -38px;
  font-size: 36px;
}

.host-line {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--muted);
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

.gallery-link {
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
