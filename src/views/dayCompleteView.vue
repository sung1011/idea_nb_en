<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import { useProgress } from '../composables/useProgress'
import { playSuccess, speak } from '../composables/useSpeech'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { state, allDoneToday, hasDecoration, hasSticker } = useProgress()

const rugOn = computed(() => hasDecoration(family.rewards.wordMorphDecoration.id))
const earOn = computed(() => hasSticker(family.rewards.soundFishSticker.id))
const starsLine = computed(() =>
  allDoneToday.value
    ? '小猫把朋友请来啦，星星已收进动物岛。'
    : '先把三关玩完，派对星星会亮起来。',
)

onMounted(() => {
  playSuccess()
  void speak('You did it!')
})
</script>

<template>
  <section class="screen complete">
    <header class="top-row">
      <span />
      <star-bar />
    </header>

    <div class="center grow party">
      <div class="burst popin" aria-hidden="true">🐱🎉</div>
      <h1 class="title-xl">Day Complete</h1>
      <p class="zh">派对成功</p>
      <p class="sub">{{ starsLine }}</p>

      <div class="loot">
        <div class="loot-item">
          <span>⭐</span>
          <b>{{ state.stars }}</b>
          <small>总星星</small>
        </div>
        <div class="loot-item">
          <span>📅</span>
          <b>{{ state.dayStars }}</b>
          <small>打卡天数</small>
        </div>
      </div>

      <div class="rewards card">
        <p class="reward" :class="{ on: earOn }">
          <span>👂</span>
          贴纸「{{ family.rewards.soundFishSticker.label }}」
          {{ earOn ? '已贴上' : '待解锁' }}
        </p>
        <p class="reward" :class="{ on: rugOn }">
          <span>🧶</span>
          装饰「{{ family.rewards.wordMorphDecoration.label }}」
          {{ rugOn ? '已放到派对上' : '待解锁' }}
        </p>
      </div>
    </div>

    <big-button @click="router.push('/')">回家</big-button>
  </section>
</template>

<style scoped>
.complete {
  gap: 12px;
}

.party {
  justify-content: center;
}

.burst {
  font-size: 76px;
  line-height: 1;
}

.zh {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 650;
}

.loot {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 18px 0 12px;
}

.loot-item {
  background: rgba(255, 255, 255, 0.82);
  border-radius: 22px;
  padding: 14px 8px;
  display: grid;
  justify-items: center;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.loot-item span {
  font-size: 30px;
}

.loot-item b {
  font-size: 28px;
}

.loot-item small {
  color: var(--muted);
}

.rewards {
  width: 100%;
  text-align: left;
}

.reward {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  min-height: 48px;
  font-weight: 650;
  color: var(--muted);
}

.reward + .reward {
  margin-top: 6px;
}

.reward.on {
  color: var(--ink);
}

.reward span {
  font-size: 26px;
}
</style>
