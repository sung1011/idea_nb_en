<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import { dateKey, hatchMeadowEgg, locationForNextMainline, persistState, saveMeadowLayout } from '../composables/useProgress'
import { speak } from '../composables/useSpeech'
import hatchOverlay from './hatchOverlay.vue'
import { playBoing } from './meadowAudio'
import {
  animalByChapter,
  animalById,
  MEADOW_FOODS,
  meadowIsOpen,
  meadowRoster,
  meadowSrc,
  type MeadowAnimalId,
  type MeadowFoodId,
} from './meadowConfig'
import { createMeadowStage, type MeadowStage } from './meadowStage'

const router = useRouter()
const route = useRoute()
const roster = meadowRoster()
const fieldEl = ref<HTMLElement | null>(null)
const hatchId = ref<string | null>(null)
const foods = MEADOW_FOODS
let stage: MeadowStage | null = null
let hatchTimer = 0
let speechQueue: string[] = []
let speaking = false
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
    return def ? [{ id: row.id, name: def.name, x: row.x, y: row.y }] : []
  })
}

function mountStage() {
  if (!meadowOpen.value || !fieldEl.value || stage) return
  stage = createMeadowStage({
    field: fieldEl.value,
    animals: seeds(),
    onSpeak: (line) => say(line),
    onSave: (spots) => saveMeadowLayout(spots),
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

onMounted(async () => {
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
  window.clearTimeout(hatchTimer)
  stage?.destroy()
  stage = null
  foodDrag = null
  for (const ghost of ghosts) ghost.remove()
  ghosts.length = 0
})

function say(line: string) {
  speechQueue.push(line)
  if (speaking) return
  speaking = true
  const pump = () => {
    const next = speechQueue.shift()
    if (!next) {
      speaking = false
      return
    }
    void speak(next).finally(pump)
  }
  pump()
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

function onDock(id: MeadowAnimalId) {
  if (!ownedIds.value.has(id)) return
  stage?.callToCenter(id)
}

function onHatched() {
  const chapterId = hatchId.value
  if (!chapterId) return
  const def = animalByChapter(chapterId)
  hatchMeadowEgg(chapterId)
  hatchId.value = null
  const row = def ? persistState.meadow.owned.find((item) => item.id === def.id) : undefined
  if (stage && row && def) stage.upsert({ id: row.id, name: def.name, x: row.x, y: row.y })
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

@media (orientation: landscape) {
  .food {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
  }
}
</style>
