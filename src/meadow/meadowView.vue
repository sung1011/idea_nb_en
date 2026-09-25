<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import {
  dateKey,
  feedMeadowAnimal,
  flushMeadowClock,
  hatchMeadowEgg,
  locationForNextMainline,
  persistState,
  saveMeadowAccessory,
  saveMeadowDecor,
  saveMeadowHearts,
  saveMeadowLayout,
} from '../composables/useProgress'
import { speak } from '../composables/useSpeech'
import hatchOverlay from './hatchOverlay.vue'
import { playBoing, playHeartChime } from './meadowAudio'
import {
  accessoryBanner,
  addHearts,
  animalByChapter,
  animalById,
  HEART_GAIN_FAVORITE,
  HEART_GAIN_FEED,
  heartFillPercent,
  MEADOW_ACCESSORIES,
  MEADOW_FOODS,
  meadowEffectiveNow,
  meadowIsOpen,
  meadowRoster,
  meadowSrc,
  meadowStarsAvailable,
  trickBanner,
  type MeadowAccessoryId,
  type MeadowAnimalId,
  type MeadowDecorSave,
  type MeadowFoodId,
} from './meadowConfig'
import { createMeadowStage, type MeadowStage } from './meadowStage'
import shopSheet from './shopSheet.vue'

const router = useRouter()
const route = useRoute()
const roster = meadowRoster()
const fieldEl = ref<HTMLElement | null>(null)
const hatchId = ref<string | null>(null)
const cardId = ref<MeadowAnimalId | null>(null)
const shopOpen = ref(false)
const starsLeft = computed(() => meadowStarsAvailable(persistState.lifetime.totalStars, persistState.meadow.spentStars))
const bannerText = ref('')
const bannerQueue: string[] = []
let bannerTimer = 0
const foods = MEADOW_FOODS
let stage: MeadowStage | null = null
let hatchTimer = 0
let speechQueue: string[] = []
let speaking = false
let speechGen = 0
const ghosts: HTMLImageElement[] = []

type FoodDrag = {
  id: MeadowFoodId
  name: string
  file: string
  pointerId: number
  slot: HTMLElement
  ghost: HTMLImageElement
}

let foodDrag: FoodDrag | null = null

const meadowOpen = computed(() => meadowIsOpen(persistState.meadow, dateKey()))
const ownedIds = computed(() => new Set(persistState.meadow.owned.map((item) => item.id)))
const hatchAnimal = computed(() => (hatchId.value ? animalByChapter(hatchId.value) : null))
const showEmpty = computed(
  () => meadowOpen.value && persistState.meadow.owned.length === 0 && persistState.meadow.pendingEggs.length === 0 && !hatchId.value,
)

function seeds() {
  return persistState.meadow.owned.flatMap((row) => {
    const def = animalById(row.id)
    return def
      ? [{
          id: row.id,
          name: def.name,
          x: row.x,
          y: row.y,
          hearts: row.hearts,
          accessory: row.accessory,
          lastFedAt: row.lastFedAt,
        }]
      : []
  })
}

function showBanner(text: string) {
  bannerQueue.push(text)
  if (bannerText.value) return
  const next = bannerQueue.shift()
  if (!next) return
  bannerText.value = next
  bannerTimer = window.setTimeout(advanceBanner, 2200)
}

function advanceBanner() {
  const next = bannerQueue.shift()
  bannerText.value = next ?? ''
  if (next) bannerTimer = window.setTimeout(advanceBanner, 2200)
}

function awardHearts(id: MeadowAnimalId, gain: number) {
  const row = persistState.meadow.owned.find((item) => item.id === id)
  if (!row) return
  const bump = addHearts(row.hearts, gain)
  if (bump.value === row.hearts) return
  saveMeadowHearts(id, bump.value)
  stage?.noteHearts(id, bump.value, true, bump.crossedWhole)
  if (bump.unlockedAccessory) showBanner(accessoryBanner(id))
  if (bump.unlockedTrick) showBanner(trickBanner(id))
}

function mountStage() {
  if (!meadowOpen.value || !fieldEl.value || stage) return
  stage = createMeadowStage({
    field: fieldEl.value,
    animals: seeds(),
    onSpeak: (line, immediate) => say(line, immediate),
    onSave: (spots) => saveMeadowLayout(spots),
    onHeartGain: (id, gain) => awardHearts(id, gain),
    hungerNow: () => meadowEffectiveNow(persistState.meadow),
    onFedClock: (id) => feedMeadowAnimal(id),
    decorations: persistState.meadow.decorations.map((item) => ({ ...item })),
    onDecorLine: (line) => sayDecor(line),
    onSaveDecor: (id, x, y) => saveMeadowDecor(id, x, y),
  })
}

function queueHatch(delay: number) {
  window.clearTimeout(hatchTimer)
  hatchTimer = window.setTimeout(() => {
    if (!meadowOpen.value) return
    const next = persistState.meadow.pendingEggs[0]
    if (!next || !animalByChapter(next)) {
      stage?.setPaused(false)
      return
    }
    hatchId.value = next
    stage?.setPaused(true)
  }, delay)
}

function onVisibility() {
  if (document.visibilityState === 'hidden') flushMeadowClock()
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibility)
  await nextTick()
  mountStage()
  if (!meadowOpen.value) return
  const welcome = route.query.welcome === '1'
  if (welcome) {
    stage?.setPaused(true)
    queueHatch(900)
    return
  }
  if (persistState.meadow.pendingEggs.length) {
    stage?.setPaused(true)
    queueHatch(0)
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  window.clearTimeout(hatchTimer)
  window.clearTimeout(bannerTimer)
  flushMeadowClock()
  stage?.destroy()
  stage = null
  foodDrag = null
  for (const ghost of ghosts) ghost.remove()
  ghosts.length = 0
})

function pumpSpeech() {
  const next = speechQueue.shift()
  if (!next) {
    speaking = false
    return
  }
  speaking = true
  const gen = speechGen
  void speak(next).finally(() => {
    if (gen !== speechGen) return
    pumpSpeech()
  })
}

function sayDecor(line: string) {
  if (speaking || speechQueue.length) return
  say(line)
}

function say(line: string, immediate = false) {
  if (immediate) {
    speechQueue.length = 0
    speechGen += 1
    const gen = speechGen
    speaking = true
    void speak(line).finally(() => {
      if (gen !== speechGen) return
      speaking = false
      pumpSpeech()
    })
    return
  }
  speechQueue.push(line)
  if (!speaking) pumpSpeech()
}

function placeGhost(ghost: HTMLImageElement, x: number, y: number, scale: number) {
  ghost.style.left = `${x}px`
  ghost.style.top = `${y}px`
  ghost.style.transform = `translate(-50%, -62%) scale(${scale})`
}

function makeGhost(file: string, x: number, y: number) {
  const ghost = document.createElement('img')
  ghost.className = 'food-ghost'
  ghost.alt = ''
  ghost.draggable = false
  ghost.src = meadowSrc(file)
  placeGhost(ghost, x, y, 1.18)
  document.body.appendChild(ghost)
  ghosts.push(ghost)
  return ghost
}

function dropGhost(ghost: HTMLImageElement) {
  const index = ghosts.indexOf(ghost)
  if (index >= 0) ghosts.splice(index, 1)
  ghost.remove()
}

function flyGhost(ghost: HTMLImageElement, x: number, y: number, scale: number, arc: boolean) {
  const fromX = Number.parseFloat(ghost.style.left)
  const fromY = Number.parseFloat(ghost.style.top)
  const dx = x - fromX
  const dy = y - fromY
  const end = `translate(calc(-50% + ${dx}px), calc(-62% + ${dy}px)) scale(${scale})`
  const frames: Keyframe[] = arc
    ? [
        { transform: 'translate(-50%, -62%) scale(1.18)' },
        { transform: `translate(calc(-50% + ${dx}px), calc(-62% + ${dy - 16}px)) scale(${scale + 0.08})`, offset: 0.7 },
        { transform: end },
      ]
    : [{ transform: 'translate(-50%, -62%) scale(1.18)' }, { transform: end }]
  const anim = ghost.animate(frames, {
    duration: arc ? 420 : 280,
    easing: arc ? 'cubic-bezier(0.2, 1.35, 0.36, 1)' : 'ease-in',
  })
  void anim.finished.finally(() => dropGhost(ghost))
}

function onFoodDown(id: MeadowFoodId, name: string, file: string, event: PointerEvent) {
  if (foodDrag || event.button !== 0) return
  const slot = event.currentTarget
  if (!(slot instanceof HTMLElement)) return
  event.preventDefault()
  slot.setPointerCapture(event.pointerId)
  const ghost = makeGhost(file, event.clientX, event.clientY)
  foodDrag = { id, name, file, pointerId: event.pointerId, slot, ghost }
  say(name)
  stage?.hoverFood(event.clientX, event.clientY)
}

function onFoodMove(event: PointerEvent) {
  if (!foodDrag || foodDrag.pointerId !== event.pointerId) return
  placeGhost(foodDrag.ghost, event.clientX, event.clientY, 1.18)
  stage?.hoverFood(event.clientX, event.clientY)
}

function onFoodUp(event: PointerEvent) {
  if (!foodDrag || foodDrag.pointerId !== event.pointerId) return
  const drag = foodDrag
  foodDrag = null
  if (drag.slot.hasPointerCapture(event.pointerId)) drag.slot.releasePointerCapture(event.pointerId)
  stage?.clearFoodHover()
  const dropped = stage?.dropFood(drag.id, event.clientX, event.clientY) ?? { result: 'miss' as const }
  if (dropped.result === 'eaten') {
    flyGhost(drag.ghost, dropped.mouth.x, dropped.mouth.y, 0.15, false)
    awardHearts(dropped.animalId, dropped.favorite ? HEART_GAIN_FAVORITE : HEART_GAIN_FEED)
    return
  }
  if (dropped.result === 'miss') playBoing()
  const home = drag.slot.getBoundingClientRect()
  flyGhost(drag.ghost, home.left + home.width / 2, home.top + home.height / 2, 0.72, true)
}

function goHome() {
  void router.push('/')
}

function goLesson() {
  void router.push(locationForNextMainline())
}

const card = computed(() => {
  if (!cardId.value) return null
  const row = persistState.meadow.owned.find((item) => item.id === cardId.value)
  const def = animalById(cardId.value)
  if (!row || !def) return null
  return { id: row.id, zh: def.zh, hearts: row.hearts, accessory: row.accessory }
})

function onDock(id: MeadowAnimalId) {
  if (!ownedIds.value.has(id)) return
  cardId.value = cardId.value === id ? null : id
  stage?.callToCenter(id)
}

function closeCard() {
  cardId.value = null
}

function wear(accessory: MeadowAccessoryId) {
  const id = cardId.value
  if (!id) return
  const row = persistState.meadow.owned.find((item) => item.id === id)
  if (!row || row.hearts < 3 || row.accessory === accessory) return
  saveMeadowAccessory(id, accessory)
  stage?.setAccessory(id, accessory)
}

function onBought(row: MeadowDecorSave) {
  shopOpen.value = false
  playHeartChime()
  stage?.addDecoration(row, true)
}

function onHatched() {
  const chapterId = hatchId.value
  if (!chapterId) return
  const def = animalByChapter(chapterId)
  hatchMeadowEgg(chapterId)
  hatchId.value = null
  const row = def ? persistState.meadow.owned.find((item) => item.id === def.id) : undefined
  if (stage && row && def) {
    stage.upsert({
      id: row.id,
      name: def.name,
      x: row.x,
      y: row.y,
      hearts: row.hearts,
      accessory: row.accessory,
      lastFedAt: row.lastFedAt,
    })
  }
  else mountStage()
  if (persistState.meadow.pendingEggs.length) {
    stage?.setPaused(true)
    queueHatch(420)
    return
  }
  stage?.setPaused(false)
}
</script>

<template>
  <Teleport to="body">
    <div class="meadow-root">
      <button class="back" type="button" @click="goHome">首页</button>
      <div v-if="meadowOpen" class="meadow-tools">
        <p class="star-purse" aria-label="可以花的星星">⭐ {{ starsLeft }}</p>
        <button class="shop-open" type="button" @click="shopOpen = true">小商店</button>
      </div>
      <p v-if="bannerText" class="banner">{{ bannerText }}</p>

      <div v-if="!meadowOpen" class="gate">
        <div class="sils" aria-hidden="true">
          <img v-for="animal in roster" :key="animal.id" :src="meadowSrc(animal.id)" alt="" />
        </div>
        <p>今天先玩 1 关，小动物在草地等你哦</p>
        <big-button @click="goLesson">去玩这一课</big-button>
      </div>

      <template v-else>
        <div class="sky" aria-hidden="true"></div>
        <div class="field-wrap">
          <div class="decor" aria-hidden="true">
            <span class="bush b1"></span>
            <span class="bush b2"></span>
            <span class="bush b3"></span>
            <span class="flower f1"></span>
            <span class="flower f2"></span>
            <span class="flower f3"></span>
          </div>
          <div ref="fieldEl" class="field"></div>
          <div v-if="showEmpty" class="empty">
            <div class="sils" aria-hidden="true">
              <img v-for="animal in roster" :key="animal.id" :src="meadowSrc(animal.id)" alt="" />
            </div>
            <p>完成第1章，就能孵出第一只小动物！</p>
          </div>
        </div>
        <div class="tray" aria-label="食物">
          <button
            v-for="food in foods"
            :key="food.id"
            class="food"
            type="button"
            :aria-label="food.name"
            @pointerdown="onFoodDown(food.id, food.name, food.file, $event)"
            @pointermove="onFoodMove"
            @pointerup="onFoodUp"
            @pointercancel="onFoodUp"
          >
            <img :src="meadowSrc(food.file)" alt="" draggable="false" />
          </button>
        </div>
        <div v-if="card" class="info-card">
          <div class="info-top">
            <p class="info-name">{{ card.zh }}</p>
            <button class="info-close" type="button" @click="closeCard">关闭</button>
          </div>
          <div class="info-hearts" aria-label="爱心">
            <span v-for="n in 5" :key="n" class="bit">
              ♥
              <i :style="{ width: `${heartFillPercent(card.hearts, n - 1)}%` }">♥</i>
            </span>
          </div>
          <p v-if="card.hearts >= 5" class="trick">会跳舞啦！</p>
          <div v-if="card.hearts >= 3" class="acc-row">
            <button type="button" :class="{ on: card.accessory === 'none' }" @click="wear('none')">无</button>
            <button
              v-for="item in MEADOW_ACCESSORIES"
              :key="item.id"
              type="button"
              :class="{ on: card.accessory === item.id }"
              @click="wear(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="dock">
          <button
            v-for="animal in roster"
            :key="animal.id"
            class="slot"
            :class="{ locked: !ownedIds.has(animal.id) }"
            type="button"
            :aria-label="ownedIds.has(animal.id) ? animal.name : `第${animal.chapterNo}章`"
            @click="onDock(animal.id)"
          >
            <img :class="{ sil: !ownedIds.has(animal.id) }" :src="meadowSrc(animal.id)" alt="" draggable="false" />
            <span v-if="!ownedIds.has(animal.id)" class="slot-label">第{{ animal.chapterNo }}章</span>
          </button>
        </div>
      </template>

      <hatch-overlay v-if="hatchAnimal" :key="hatchAnimal.chapterId" :animal="hatchAnimal" @done="onHatched" />
      <shop-sheet v-if="shopOpen" @close="shopOpen = false" @bought="onBought" />
    </div>
  </Teleport>
</template>

<style scoped>
.meadow-root {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #c5ecff 0%, #d9f5c8 20%, #b6e58a 20%, #8ed56a 100%);
  touch-action: manipulation;
  user-select: none;
}

.sky {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 20%;
  background: linear-gradient(180deg, #b9e6ff 0%, #e7f7ff 72%, rgba(198, 236, 255, 0) 100%);
  pointer-events: none;
}

.banner {
  position: absolute;
  z-index: 9;
  top: calc(64px + env(safe-area-inset-top));
  left: 50%;
  max-width: calc(100% - 32px);
  margin: 0;
  padding: 10px 16px;
  border-radius: 999px;
  background: #fff7e8;
  color: #9a3d55;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 6px 0 rgba(214, 120, 90, 0.28);
  transform: translateX(-50%);
  pointer-events: none;
}

.meadow-tools {
  position: absolute;
  z-index: 6;
  top: calc(10px + env(safe-area-inset-top));
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-purse {
  margin: 0;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 999px;
  background: #fff4d2;
  color: #8a5a12;
  font-size: 18px;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
}

.shop-open {
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 4px 0 #f0c36a;
}

.back {
  position: absolute;
  z-index: 6;
  top: calc(10px + env(safe-area-inset-top));
  left: 12px;
  min-width: 72px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
  font-size: 18px;
  font-weight: 750;
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.12);
}

.field-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.field {
  position: absolute;
  inset: 0;
}

.decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.bush {
  position: absolute;
  width: 78px;
  height: 42px;
  border-radius: 40px 40px 16px 16px;
  background: #7dce6a;
  box-shadow:
    inset 0 -8px 0 rgba(45, 100, 40, 0.16),
    0 6px 0 rgba(55, 110, 40, 0.16);
}

.b1 {
  left: 6%;
  bottom: 18%;
}

.b2 {
  right: 8%;
  top: 28%;
  width: 64px;
}

.b3 {
  left: 38%;
  bottom: 8%;
  width: 92px;
  height: 36px;
  background: #6fc45e;
}

.flower {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ff8fab;
  box-shadow:
    -12px 6px 0 #ffd166,
    12px 7px 0 #c9b6ff,
    0 16px 0 #6fc45e;
}

.f1 {
  left: 18%;
  top: 34%;
}

.f2 {
  right: 18%;
  bottom: 28%;
  background: #ffd166;
}

.f3 {
  left: 62%;
  top: 22%;
  background: #fff;
}

.empty {
  position: absolute;
  z-index: 4;
  left: 18px;
  right: 18px;
  top: 28%;
  margin: 0;
  padding: 16px 14px;
  border-radius: 24px;
  background: rgba(255, 253, 246, 0.9);
  text-align: center;
  pointer-events: none;
}

.empty p {
  margin: 10px 0 0;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.35;
}

.tray {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 6px 8px 4px;
  background: rgba(255, 247, 224, 0.9);
}

.food {
  flex: 1 1 0;
  min-width: 48px;
  height: 58px;
  padding: 2px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 rgba(214, 164, 72, 0.28);
  touch-action: none;
}

.food img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.info-card {
  position: relative;
  z-index: 7;
  margin: 0 10px 4px;
  padding: 10px 12px 12px;
  border-radius: 22px;
  background: rgba(255, 253, 246, 0.96);
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.1);
}

.info-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.info-name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.info-close {
  min-width: 64px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 16px;
  font-weight: 750;
}

.info-hearts {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.info-hearts .bit {
  position: relative;
  font-size: 22px;
  line-height: 1;
  color: #ffd0dc;
}

.info-hearts .bit i {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  height: 100%;
  color: #ff4d7a;
  font-style: normal;
  white-space: nowrap;
}

.trick {
  margin: 6px 0 0;
  font-size: 16px;
  font-weight: 800;
  color: #c45c7a;
}

.acc-row {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.acc-row button {
  flex: 1 1 0;
  min-height: 44px;
  padding: 0 4px;
  border-radius: 14px;
  background: #fff;
  color: var(--ink);
  font-size: 15px;
  font-weight: 750;
  box-shadow: 0 3px 0 rgba(45, 58, 74, 0.08);
}

.acc-row button.on {
  background: #ffe3ee;
  box-shadow: 0 3px 0 #f2a3bf;
}

.dock {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 10px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.62);
}

.slot {
  flex: 0 0 68px;
  width: 68px;
  height: 76px;
  padding: 4px 4px 2px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 0 rgba(45, 58, 74, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.slot img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  object-position: center bottom;
}

.slot img.sil {
  filter: brightness(0);
  opacity: 0.38;
}

.slot-label {
  font-size: 11px;
  font-weight: 750;
  color: var(--muted);
  line-height: 1.1;
}

.gate {
  margin: auto 16px;
  width: min(100% - 32px, 420px);
  padding: 18px 16px 16px;
  border-radius: 28px;
  background: rgba(255, 253, 246, 0.95);
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  gap: 12px;
  text-align: center;
}

.gate p {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
  line-height: 1.35;
}

.sils {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.sils img {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  object-fit: contain;
  filter: brightness(0);
  opacity: 0.38;
}
</style>

<style>
.meadow-actor {
  position: absolute;
  width: var(--sprite, 96px);
  height: var(--sprite, 96px);
  touch-action: none;
  z-index: 2;
}

.meadow-body {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  will-change: transform;
}

.meadow-sprite {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  pointer-events: none;
  -webkit-user-drag: none;
}

.meadow-acc {
  position: absolute;
  z-index: 2;
  aspect-ratio: 1;
  pointer-events: none;
}

.meadow-acc img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center center;
}

.meadow-acc img.is-pop {
  animation: meadow-acc-pop 0.35s ease-out;
}

.meadow-actor.is-hidden .meadow-sprite,
.meadow-actor.is-hidden .meadow-acc,
.meadow-actor.is-hidden .meadow-zzz,
.meadow-actor.is-hidden .meadow-shadow,
.meadow-actor.is-hidden .meadow-bubble {
  visibility: hidden;
}

.meadow-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 6;
  width: max-content;
  max-width: 176px;
  margin: 0;
  padding: 8px 10px 10px;
  border: 3px solid #f0c36a;
  border-radius: 22px;
  background: linear-gradient(180deg, #fffef8 0%, #fff1c9 100%);
  box-shadow:
    0 6px 0 #f4b400,
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
  color: #2d3a4a;
  font-family: 'Fredoka', 'PingFang SC', 'Noto Sans SC', sans-serif;
  display: grid;
  justify-items: center;
  gap: 2px;
  transform: translateX(-50%);
  animation: meadow-bubble-in 0.28s cubic-bezier(0.2, 1.4, 0.36, 1);
}

.meadow-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -9px;
  width: 14px;
  height: 14px;
  background: #fff1c9;
  border-right: 3px solid #f0c36a;
  border-bottom: 3px solid #f0c36a;
  transform: translateX(-50%) rotate(45deg);
}

.meadow-bubble.is-sentence {
  max-width: 210px;
  padding: 10px 12px 12px;
}

.meadow-bubble p,
.meadow-bubble b {
  margin: 0;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
  text-align: center;
}

.meadow-bubble-card {
  width: 84px;
  height: 48px;
  object-fit: contain;
  pointer-events: none;
}

.meadow-bubble-emoji {
  font-size: 36px;
  line-height: 1;
}

.meadow-bubble-num {
  min-width: 64px;
  padding: 2px 10px 6px;
  border-radius: 16px;
  border: 3px solid #f0c36a;
  background: linear-gradient(180deg, #fffef8 0%, #fff6d8 100%);
  color: #e07a12;
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 4px 0 #f4b400;
}

.meadow-bubble-num.wide {
  font-size: 26px;
}

.meadow-bubble.is-leaving {
  animation: meadow-bubble-out 0.28s ease-in forwards;
  pointer-events: none;
}

@keyframes meadow-bubble-in {
  from {
    transform: translateX(-50%) scale(0.35);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

@keyframes meadow-bubble-out {
  to {
    transform: translateX(-50%) scale(1.18);
    opacity: 0;
  }
}

.meadow-meter {
  position: absolute;
  z-index: 130;
  display: flex;
  gap: 2px;
  transform: translate(-50%, -100%);
  pointer-events: none;
}

.meadow-meter .bit {
  position: relative;
  font-size: 14px;
  line-height: 1;
  color: #ffd0dc;
}

.meadow-meter .bit i {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  height: 100%;
  color: #ff4d7a;
  font-style: normal;
  white-space: nowrap;
}

.meadow-note {
  position: absolute;
  z-index: 130;
  font-size: 22px;
  font-weight: 800;
  color: #7c5cbf;
  pointer-events: none;
  animation: meadow-note 0.9s ease-out forwards;
}

.meadow-cloud {
  position: absolute;
  z-index: 120;
  width: calc(var(--sprite, 96px) * 1.9);
  height: calc(var(--sprite, 96px) * 1.45);
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: meadow-roll 0.7s ease-in-out infinite;
}

.meadow-cloud .puff {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #fff 0%, #f6f0e4 64%, rgba(246, 240, 228, 0.15) 78%, transparent 80%);
}

.meadow-cloud .p1 {
  width: 64%;
  height: 68%;
  left: 4%;
  top: 16%;
}

.meadow-cloud .p2 {
  width: 56%;
  height: 58%;
  right: 2%;
  top: 6%;
}

.meadow-cloud .p3 {
  width: 50%;
  height: 52%;
  left: 26%;
  bottom: 0;
}

.meadow-cloud .peek {
  position: absolute;
  z-index: 2;
  width: 48%;
  height: 48%;
  object-fit: cover;
  object-position: center 38%;
  border-radius: 46%;
  animation: meadow-peek 0.42s ease-in-out infinite alternate;
}

.meadow-cloud .peek-a {
  left: 10%;
  top: 22%;
}

.meadow-cloud .peek-b {
  right: 8%;
  bottom: 12%;
  animation-delay: -0.2s;
}

.meadow-cloud .swirl {
  position: absolute;
  width: 22px;
  height: 22px;
  border: 3px solid transparent;
  border-top-color: #f0b429;
  border-right-color: #f0b429;
  border-radius: 50%;
  animation: meadow-swirl 0.55s linear infinite;
}

.meadow-cloud .s1 {
  left: 18%;
  top: 8%;
}

.meadow-cloud .s2 {
  right: 14%;
  bottom: 18%;
  animation-direction: reverse;
}

.meadow-cloud .star {
  position: absolute;
  color: #ffd166;
  font-size: 16px;
  animation: meadow-star 0.6s ease-in-out infinite;
}

.meadow-cloud .t1 {
  left: 8%;
  bottom: 20%;
}

.meadow-cloud .t2 {
  right: 10%;
  top: 12%;
  animation-delay: -0.2s;
}

.meadow-cloud .t3 {
  left: 46%;
  top: 0;
  animation-delay: -0.35s;
}

.meadow-shadow {
  position: absolute;
  left: 16%;
  width: 68%;
  bottom: 2%;
  height: 12%;
  border-radius: 50%;
  background: rgba(35, 60, 25, 0.4);
  transform-origin: center;
  pointer-events: none;
}

.meadow-zzz {
  display: none;
  position: absolute;
  left: 58%;
  top: 0;
  z-index: 2;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 2px 0 rgba(45, 58, 74, 0.25);
  pointer-events: none;
  animation: meadow-zzz 1.5s ease-in-out infinite;
}

.meadow-actor.is-nap .meadow-zzz {
  display: block;
}

.meadow-actor.is-hungry:not(.is-play) .meadow-sprite {
  transform-origin: 50% 100%;
  animation: meadow-hungry 1.8s ease-in-out infinite;
  filter: saturate(0.62) brightness(0.9);
}

@keyframes meadow-hungry {
  0%,
  100% {
    transform: translateY(8%) rotate(-8deg) scale(1.05, 0.88);
  }
  50% {
    transform: translateY(3%) rotate(-3deg) scale(1.02, 0.94);
  }
}

.meadow-decor {
  position: absolute;
  touch-action: none;
  z-index: 3;
}

.meadow-decor img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  pointer-events: none;
  -webkit-user-drag: none;
}

.meadow-decor.is-fire img {
  transform-origin: 50% 78%;
  animation: meadow-flame 0.48s ease-in-out infinite;
}

.meadow-decor.is-dropping {
  animation: meadow-drop 0.72s cubic-bezier(0.18, 1.35, 0.36, 1) both;
}

.meadow-decor.is-tap img {
  animation: meadow-decor-tap 0.35s ease-out;
}

.meadow-ripple,
.meadow-spark,
.meadow-splash {
  position: absolute;
  pointer-events: none;
}

.meadow-ripple {
  left: 18%;
  right: 18%;
  bottom: 18%;
  height: 22%;
  border-radius: 50%;
  border: 3px solid rgba(120, 190, 230, 0.85);
  animation: meadow-ripple 0.7s ease-out forwards;
}

.meadow-spark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffe08a;
  box-shadow: 0 0 0 2px #ff9f43;
  animation: meadow-spark 0.55s ease-out forwards;
}

.meadow-splash {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ad7f5;
  z-index: 30;
  animation: meadow-splash 0.55s ease-out forwards;
}

.meadow-mallow {
  position: absolute;
  left: 68%;
  top: 8%;
  width: 7px;
  height: 46%;
  border-radius: 4px;
  background: #c4a574;
  transform: rotate(-32deg);
  transform-origin: bottom center;
  pointer-events: none;
  z-index: 4;
}

.meadow-mallow i {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff8ee;
  transform: translateX(-50%);
  box-shadow: 0 0 0 3px #f3d2a2;
}

@keyframes meadow-flame {
  0%,
  100% {
    transform: scale(1, 1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05, 0.94);
    opacity: 0.78;
  }
}

@keyframes meadow-drop {
  0% {
    transform: translateY(-48vh) scale(0.82);
  }
  68% {
    transform: translateY(10px) scale(1.06, 0.9);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes meadow-decor-tap {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.08, 0.92);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes meadow-ripple {
  from {
    transform: scale(0.4);
    opacity: 0.9;
  }
  to {
    transform: scale(1.6);
    opacity: 0;
  }
}

@keyframes meadow-spark {
  to {
    transform: translate(var(--dx), var(--dy)) scale(0.4);
    opacity: 0;
  }
}

@keyframes meadow-splash {
  to {
    transform: translate(var(--dx), var(--dy)) scale(0.5);
    opacity: 0;
  }
}

.meadow-heart {
  position: absolute;
  z-index: 45;
  font-size: 18px;
  color: #ff5d8f;
  pointer-events: none;
  animation: meadow-heart 0.9s ease-out forwards;
}

@keyframes meadow-zzz {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

@keyframes meadow-heart {
  from {
    transform: translate(-50%, 0) scale(0.6);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -58px) scale(1.15);
    opacity: 0;
  }
}

.food-ghost {
  position: fixed;
  z-index: 70;
  width: 84px;
  height: 84px;
  object-fit: contain;
  pointer-events: none;
}

.meadow-crumb {
  position: absolute;
  z-index: 46;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: #e2b56a;
  box-shadow: 0 0 0 2px rgba(255, 248, 230, 0.7);
  pointer-events: none;
  animation: meadow-crumb 0.55s ease-out forwards;
}

@keyframes meadow-crumb {
  to {
    transform: translate(var(--dx), var(--dy)) scale(0.35);
    opacity: 0;
  }
}

@keyframes meadow-acc-pop {
  0% {
    transform: scale(0.2);
  }
  70% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes meadow-note {
  from {
    transform: translate(-50%, 0) rotate(-10deg);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -56px) rotate(14deg);
    opacity: 0;
  }
}

@keyframes meadow-roll {
  50% {
    transform: translate(-50%, -50%) rotate(7deg) scale(1.05);
  }
}

@keyframes meadow-peek {
  from {
    transform: translate(8px, 10px) rotate(-18deg) scale(0.78);
    opacity: 0.72;
  }
  to {
    transform: translate(-6px, -14px) rotate(16deg) scale(1.08);
    opacity: 1;
  }
}

@keyframes meadow-swirl {
  to {
    transform: rotate(360deg);
  }
}

@keyframes meadow-star {
  50% {
    transform: scale(1.25);
  }
}

@media (orientation: landscape) {
  .food {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
  }
}
</style>
