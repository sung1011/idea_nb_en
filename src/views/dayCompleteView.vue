<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import starBar from '../components/starBar.vue'
import chapterLevelLights from '../components/chapterLevelLights.vue'
import todayStarBar from '../components/todayStarBar.vue'
import { useProgress } from '../composables/useProgress'
import { tweenCelebrate, tweenPopUp } from '../composables/useMotion'
import { pickPraise, playSuccess, speak } from '../composables/useSpeech'
import { CHAPTER_1_ID } from '../data/chapters'
import { locationForChapterPractice } from '../data/playGallery'
import { stickerById } from '../data/stickers'
import { chapterPracticeCopy, practiceEntryCopy } from '../data/todayTasks'

const router = useRouter()
const { state, getChapterProgress, hasPractice, practiceChapterId, claimDayCompleteRewards } =
  useProgress()
const chapter = computed(() => getChapterProgress(CHAPTER_1_ID))

const claim = claimDayCompleteRewards()
const sticker = computed(() => (claim.stickerId ? stickerById(claim.stickerId) : null))

const burstEl = ref<HTMLElement | null>(null)
const stickerEl = ref<HTMLElement | null>(null)

const titleZh = computed(() => {
  if (!claim.ready) return '派对还没结束'
  return claim.freshClaim ? '派对成功' : '章节奖励还在'
})

const leadLine = computed(() => {
  if (!claim.ready) return '先把第一章派对玩完，小猫再发徽章。'
  if (claim.freshClaim && claim.stickerGranted) return '小猫把朋友请来啦，还送你一张贴纸！'
  if (claim.freshClaim) return '小猫把朋友请来啦，这张贴纸你已经贴过啦。'
  return chapterPracticeCopy()
})

const stickerLine = computed(() => {
  const name = sticker.value?.label ?? '贴纸'
  if (!claim.ready) return `通关后就能拿到「${name}」`
  if (claim.freshClaim && claim.stickerGranted) return `贴纸贴上啦！「${name}」`
  if (claim.freshClaim) return `「${name}」早就在你的贴纸里啦`
  return `章节徽章是「${name}」，想再玩就点已过的关`
})

const chapterLine = computed(() => {
  if (chapter.value.complete) return '第一章派对通关啦'
  return `第1章 ${chapter.value.clearedCount}/${chapter.value.levelTotal} 关`
})

onMounted(() => {
  if (!claim.ready) return
  playSuccess()
  void tweenCelebrate(burstEl.value)
  if (stickerEl.value) void tweenPopUp(stickerEl.value)
  void speak(pickPraise('finish'))
})
</script>

<template>
  <section class="screen complete">
    <header class="top-row">
      <span />
      <star-bar />
    </header>

    <div class="center grow party">
      <div class="burst-wrap">
        <span class="spark s1" aria-hidden="true">✨</span>
        <span class="spark s2" aria-hidden="true">⭐</span>
        <span class="spark s3" aria-hidden="true">🎈</span>
        <span class="spark s4" aria-hidden="true">🎉</span>
        <div ref="burstEl" class="burst popin" aria-hidden="true">🐱</div>
      </div>
      <h1 class="title-xl">Day Complete</h1>
      <p class="zh">{{ titleZh }}</p>
      <p class="sub">{{ leadLine }}</p>
      <today-star-bar class="today-loot" size="large" :celebrate-on-gain="false" />
      <chapter-level-lights class="chapter-loot" :chapter-id="CHAPTER_1_ID" :celebrate-on-gain="false" />

      <div
        v-if="sticker"
        ref="stickerEl"
        class="sticker-card"
        :class="{ fresh: claim.freshClaim && claim.ready, muted: !claim.ready }"
      >
        <span class="sticker-emoji" aria-hidden="true">{{ sticker.emoji }}</span>
        <p class="sticker-kicker">{{ claim.freshClaim && claim.stickerGranted ? '新贴纸' : '章节徽章' }}</p>
        <p class="sticker-name">{{ sticker.label }}</p>
        <p class="sticker-line">{{ stickerLine }}</p>
      </div>

      <div class="loot">
        <div class="loot-item">
          <span>⭐</span>
          <b>{{ state.stars }}</b>
          <small>总星星</small>
        </div>
        <div class="loot-item" :class="{ bump: chapter.complete }">
          <span>🏝️</span>
          <b>{{ chapter.clearedCount }}/{{ chapter.levelTotal }}</b>
          <small>{{ chapterLine }}</small>
        </div>
      </div>
    </div>

    <big-button @click="router.push('/')">回家</big-button>
    <big-button
      v-if="hasPractice"
      variant="soft"
      data-practice-entry
      @click="router.push(locationForChapterPractice(practiceChapterId ?? CHAPTER_1_ID))"
    >
      {{ practiceEntryCopy() }}
    </big-button>
    <button class="album-link" type="button" @click="router.push('/sticker-album')">看贴纸相册</button>
  </section>
</template>

<style scoped>
.complete {
  gap: 12px;
}

.party {
  justify-content: center;
}

.burst-wrap {
  position: relative;
  width: 140px;
  height: 120px;
  display: grid;
  place-items: center;
}

.burst {
  font-size: 76px;
  line-height: 1;
}

.spark {
  position: absolute;
  font-size: 22px;
  animation: sparkle 1.6s ease-in-out infinite;
}

.s1 {
  left: 4px;
  top: 8px;
}

.s2 {
  right: 0;
  top: 2px;
  animation-delay: 0.25s;
}

.s3 {
  left: 0;
  bottom: 10px;
  animation-delay: 0.45s;
}

.s4 {
  right: 6px;
  bottom: 6px;
  animation-delay: 0.7s;
}

.zh {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 650;
}

.today-loot {
  width: 100%;
  margin-top: 16px;
}

.chapter-loot {
  width: 100%;
  margin-top: 12px;
}

.sticker-card {
  width: 100%;
  margin-top: 14px;
  padding: 18px 16px 16px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.08);
}

.sticker-card.fresh {
  background: linear-gradient(180deg, #fff7d6 0%, #fff 62%);
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}

.sticker-card.muted {
  opacity: 0.72;
}

.sticker-emoji {
  display: block;
  font-size: 56px;
  line-height: 1;
}

.sticker-kicker {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.sticker-name {
  margin: 2px 0 0;
  font-size: 26px;
  font-weight: 700;
}

.sticker-line {
  margin: 6px 0 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--ink);
}

.loot {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 16px 0 8px;
}

.loot-item {
  background: rgba(255, 255, 255, 0.82);
  border-radius: 22px;
  padding: 14px 8px;
  display: grid;
  justify-items: center;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.loot-item.bump {
  background: #e4f8ec;
}

.loot-item span {
  font-size: 30px;
}

.loot-item b {
  font-size: 28px;
}

.loot-item small {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 650;
  text-align: center;
}

.album-link {
  margin-top: 8px;
  min-height: 48px;
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 4px;
}

@keyframes sparkle {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translateY(-8px) scale(1.12);
    opacity: 1;
  }
}
</style>
