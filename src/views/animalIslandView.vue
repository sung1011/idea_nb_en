<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import chapterLevelLights from '../components/chapterLevelLights.vue'
import settingsButton from '../components/settingsButton.vue'
import starBar from '../components/starBar.vue'
import { tweenCelebrate, tweenPulse, tweenShake } from '../composables/useMotion'
import { useProgress } from '../composables/useProgress'
import { playNudge, playTap } from '../composables/useSfx'
import { getLevel, type PlayKind } from '../data/chapters'
import { getCurrentFamily } from '../data/phonicsFamily'

const PLAY_EMOJI: Record<PlayKind, string> = {
  flashFlip: '🃏',
  whackWord: '🐹',
  dragSort: '🧺',
  wordFish: '🐠',
  echo: '🎤',
  chapterFinale: '🎉',
}

const STATUS_LABEL: Record<'locked' | 'unlocked' | 'cleared', string> = {
  locked: '未开',
  unlocked: '去玩',
  cleared: '过啦',
}

const LOCK_HINT = '先过上一关吧'

const router = useRouter()
const family = getCurrentFamily()
const { chapter, nextLevel, nextRoute, hasSticker } = useProgress()

const levelRows = computed(() => {
  const nextId = nextLevel.value?.id
  return chapter.value.levels.map((item, index) => ({
    ...item,
    order: getLevel(item.id)?.order ?? index + 1,
    emoji: PLAY_EMOJI[item.play],
    isNext: item.id === nextId,
    playable: item.status === 'unlocked' || item.status === 'cleared',
  }))
})

const earOn = computed(() => hasSticker(family.rewards.soundFishSticker.id))
const startLabel = computed(() => {
  if (chapter.value.complete || !nextLevel.value) return '看章节奖励'
  const order = nextLevel.value.order
  return `去第${order}关 · ${nextLevel.value.titleZh}`
})

const hostEl = ref<HTMLElement | null>(null)
const nextRowEl = ref<HTMLElement | null>(null)
const lockHint = ref('')
const hintTimer = ref<number | null>(null)

function clearHintTimer() {
  if (hintTimer.value != null) {
    window.clearTimeout(hintTimer.value)
    hintTimer.value = null
  }
}

function showLockHint() {
  lockHint.value = LOCK_HINT
  clearHintTimer()
  hintTimer.value = window.setTimeout(() => {
    lockHint.value = ''
    hintTimer.value = null
  }, 2200)
}

function bindNextRow(el: Element | null, isNext: boolean) {
  if (isNext && el instanceof HTMLElement) nextRowEl.value = el
}

function go() {
  playTap()
  void router.push(nextRoute.value)
}

function onLevelTap(row: (typeof levelRows.value)[number], event: MouseEvent) {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (!row.playable) {
    playNudge()
    void tweenShake(target, 6)
    showLockHint()
    return
  }
  playTap()
  void router.push(row.route)
}

onMounted(() => {
  void tweenCelebrate(hostEl.value)
  if (nextRowEl.value) void tweenPulse(nextRowEl.value)
})

onBeforeUnmount(() => {
  clearHintTimer()
})
</script>

<template>
  <section class="screen island-lobby">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push('/')">首页</button>
      <div class="top-tools">
        <star-bar />
        <settings-button />
      </div>
    </header>

    <div class="hero center">
      <p class="eyebrow">Animals Island</p>
      <h1 class="title-xl">动物岛</h1>
      <p class="sub">帮小猫把 {{ family.family }} 朋友请来派对</p>
    </div>

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

    <chapter-level-lights class="island-level-lights" />

    <div class="card progress-card">
      <p class="progress-title">第1章 {{ chapter.clearedCount }}/{{ chapter.levelTotal }} 关</p>
      <div class="gates" role="list">
        <button
          v-for="row in levelRows"
          :key="row.id"
          :ref="(el) => bindNextRow(el as Element | null, row.isNext)"
          class="gate"
          :class="{
            done: row.status === 'cleared',
            locked: row.status === 'locked',
            next: row.isNext,
          }"
          type="button"
          role="listitem"
          :data-chapter-level="row.id"
          :data-level-status="row.status"
          :data-next-level="row.isNext ? '1' : '0'"
          :aria-label="`第${row.order}关 ${row.titleZh}，${row.isNext ? '现在玩' : STATUS_LABEL[row.status]}`"
          @click="onLevelTap(row, $event)"
        >
          <span class="gate-emoji" aria-hidden="true">{{ row.status === 'locked' ? '🔒' : row.emoji }}</span>
          <span class="gate-copy">
            <b class="gate-name">第{{ row.order }}关 · {{ row.titleZh }}</b>
            <small>{{ row.titleEn }}</small>
          </span>
          <span class="gate-mark">
            <span
              class="gate-star"
              :class="{ on: row.status === 'cleared' }"
              aria-hidden="true"
            >⭐</span>
            {{ row.isNext ? '现在玩' : STATUS_LABEL[row.status] }}
          </span>
        </button>
      </div>
      <p class="lock-hint" :class="{ show: Boolean(lockHint) }" aria-live="polite">
        {{ lockHint || '　' }}
      </p>
      <p class="parent-line">
        {{
          chapter.complete
            ? '第一章派对通关啦，随时还能再玩。'
            : '家长小记：通关立刻开下一关，不用等明天。'
        }}
      </p>
    </div>

    <big-button class="start-btn" data-next-level-cta @click="go">{{ startLabel }}</big-button>
    <button class="album-btn" type="button" @click="router.push('/sticker-album')">
      <span aria-hidden="true">📒</span>
      贴纸相册
    </button>
    <button class="gallery-link" type="button" @click="router.push('/play-gallery')">玩法一览</button>
  </section>
</template>

<style scoped>
.island-lobby {
  gap: 10px;
}

.top-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.island-wrap {
  position: relative;
  height: 168px;
  margin: 2px 0 4px;
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

.island-level-lights {
  margin: 2px 0 4px;
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
  gap: 6px;
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
  color: inherit;
  text-align: left;
}

.gate.done {
  background: #e4f8ec;
}

.gate.locked {
  background: #eef1f4;
  color: #7b8a96;
}

.gate.next {
  background: #fff3c4;
  box-shadow: 0 4px 0 rgba(244, 180, 0, 0.22);
}

.gate:active {
  transform: translateY(2px);
}

.gate-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.gate-name {
  font-size: 16px;
  font-weight: 750;
}

.gate-copy small {
  font-size: 12px;
  font-weight: 650;
  color: var(--muted);
}

.gate.locked .gate-copy small {
  color: #9aa8b3;
}

.gate-mark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 750;
  white-space: nowrap;
}

.gate-star {
  font-size: 20px;
  filter: grayscale(0.4);
  opacity: 0.55;
}

.gate-star.on {
  filter: none;
  opacity: 1;
}

.gate-emoji {
  font-size: 24px;
}

.lock-hint {
  margin: 10px 0 0;
  min-height: 20px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: transparent;
}

.lock-hint.show {
  color: #c07a2a;
}

.parent-line {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.start-btn {
  margin-top: 14px;
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
