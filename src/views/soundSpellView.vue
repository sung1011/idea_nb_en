<script setup lang="ts">
import { dragDirective } from '@vueuse/gesture'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import wordPic from '../components/wordPic.vue'
import { magnetPoint, nearestBasket, SNAP_RANGE } from '../composables/useDragSnap'
import { useChapterLevel } from '../composables/useChapterLevel'
import { flyStarFrom, tweenCelebrate, tweenPulse, tweenShake, tweenSnapTo, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { buildSpellTiles, nextEmptySlot, wordLetters, type SpellTile } from '../data/spellTiles'
import { gateSpellHint, gateSpellPrompt, gateSpellSub } from '../data/todayTasks'

type BoardTile = SpellTile & { used: boolean }

type DragState = {
  first: boolean
  last: boolean
  dragging: boolean
  xy: [number, number]
}

const {
  isReplay,
  canPlay,
  gateTag,
  finishLevel,
  goAfterLevel,
  showClearSheet,
  lastResult,
  isChapterPractice,
  chapterComplete,
  chapterNo,
  replayCleared,
  continueAfterClear,
  goLobby,
  themeHint,
  takeRunWords,
} = useChapterLevel('soundSpell')

const vDrag = dragDirective()
const words = takeRunWords(3)
const spellSub = computed(() => gateSpellSub(themeHint.value))
const wordIndex = ref(0)
const slots = ref<Array<string | null>>([])
const tiles = ref<BoardTile[]>([])
const prompt = ref(gateSpellPrompt())
const locked = ref(true)
const busy = ref(false)
const celebrating = ref(false)
const revealed = ref(false)
const done = ref(false)
const shakingTile = ref('')
const shakingSlot = ref(-1)
const dragging = ref<string | null>(null)
const hoverSlot = ref<number | null>(null)
const origin = ref({ x: 0, y: 0 })
const pulledFar = ref(false)
const titleEl = ref<HTMLElement | null>(null)
const boardEl = ref<HTMLElement | null>(null)
const ghostEl = ref<HTMLElement | null>(null)

let alive = true

const target = computed(() => (words[wordIndex.value] || words[0] || 'cap').toLowerCase())
const letters = computed(() => wordLetters(target.value))
const progressText = computed(() => `${wordIndex.value + 1} / ${words.length}`)
const nextSlot = computed(() => nextEmptySlot(slots.value))
const dragTile = computed(() => tiles.value.find((tile) => tile.id === dragging.value) ?? null)
const dragOptions = {
  preventWindowScrollY: true,
  useTouch: true,
  filterTaps: true,
}

function slotEl(index: number): HTMLElement | null {
  return document.querySelector(`[data-spell-slot="${index}"]`)
}

function tileEl(id: string): HTMLElement | null {
  return document.querySelector(`[data-spell-tile="${id}"]`)
}

function resetBoard() {
  slots.value = letters.value.map(() => null)
  tiles.value = buildSpellTiles(target.value, words).map((tile) => ({ ...tile, used: false }))
  celebrating.value = false
  revealed.value = false
  shakingTile.value = ''
  shakingSlot.value = -1
}

function moveGhost(x: number, y: number) {
  if (ghostEl.value) {
    ghostEl.value.style.left = `${x}px`
    ghostEl.value.style.top = `${y}px`
  }
}

async function ask() {
  if (!alive) return
  locked.value = true
  busy.value = false
  resetBoard()
  prompt.value = gateSpellPrompt()
  await speak(target.value)
  if (!alive) return
  locked.value = !canPlay.value
}

async function hearWord() {
  if (done.value) return
  playPop()
  await speak(target.value)
}

function placeLetter(ch: string, slotIndex: number, tileId: string): boolean {
  if (slots.value[slotIndex] || letters.value[slotIndex] !== ch) return false
  slots.value = slots.value.map((slot, index) => (index === slotIndex ? ch : slot))
  tiles.value = tiles.value.map((tile) => (tile.id === tileId ? { ...tile, used: true } : tile))
  return true
}

async function softMiss(targetEl: unknown, slotIndex = -1) {
  playNudge()
  prompt.value = pickPraise('soft')
  shakingSlot.value = slotIndex
  await tweenShake(targetEl)
  if (!alive) return
  shakingTile.value = ''
  shakingSlot.value = -1
  void speak(target.value)
}

async function afterPlace(source: Element | null, slotIndex: number) {
  playPop()
  const filled = slotEl(slotIndex)
  if (filled) void tweenPulse(filled)
  if (slots.value.every(Boolean)) {
    await succeedWord(source)
    return
  }
}

async function succeedWord(source: Element | null) {
  if (!alive) return
  locked.value = true
  celebrating.value = true
  revealed.value = true
  prompt.value = pickPraise('step')
  unlockWord(target.value)
  void flyStarFrom(source)
  await Promise.all([tweenCelebrate(boardEl.value), speak(prompt.value)])
  if (!alive) return
  await speak(target.value)
  if (!alive) return
  await new Promise<void>((resolve) => window.setTimeout(resolve, 420))
  if (wordIndex.value >= words.length - 1) {
    await finishGate()
    return
  }
  wordIndex.value += 1
  await ask()
}

async function finishGate() {
  if (!alive) return
  done.value = true
  celebrating.value = true
  prompt.value = pickPraise('finish')
  playSuccess()
  await tweenCelebrate(titleEl.value)
  const result = finishLevel()
  await speak(prompt.value)
  if (!alive) return
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function pickTile(tile: BoardTile, event?: Event) {
  if (locked.value || busy.value || done.value || tile.used || !canPlay.value) return
  if (dragging.value && pulledFar.value) return
  dragging.value = null
  hoverSlot.value = null
  pulledFar.value = false
  const index = nextSlot.value
  const el = event?.currentTarget instanceof Element ? event.currentTarget : tileEl(tile.id)
  if (index < 0) return
  busy.value = true
  if (letters.value[index] !== tile.ch) {
    shakingTile.value = tile.id
    await softMiss(el)
    busy.value = false
    return
  }
  placeLetter(tile.ch, index, tile.id)
  await afterPlace(el, index)
  busy.value = false
}

function onTileDrag(tileId: string) {
  return (state: DragState) => {
    if (locked.value || busy.value || done.value || !canPlay.value) return
    const tile = tiles.value.find((item) => item.id === tileId && !item.used)
    if (!tile) return
    if (dragging.value && dragging.value !== tileId) return

    const [x, y] = state.xy
    const hit = nearestBasket(x, y, '[data-spell-slot]')

    if (state.first) {
      pulledFar.value = false
      origin.value = { x, y }
      return
    }

    if (state.dragging) {
      if (Math.hypot(x - origin.value.x, y - origin.value.y) > 12) {
        if (!dragging.value) {
          dragging.value = tileId
          playPop()
        }
        pulledFar.value = true
      }
      const pulled = magnetPoint(x, y, hit)
      void nextTick(() => moveGhost(pulled.x, pulled.y))
      hoverSlot.value = hit && hit.dist <= SNAP_RANGE ? Number(hit.word) : null
    }

    if (state.last) {
      void dropAt(x, y)
    }
  }
}

async function dropAt(x: number, y: number) {
  const tile = dragTile.value
  const wasDrag = pulledFar.value
  if (!tile || locked.value || celebrating.value || done.value) {
    dragging.value = null
    hoverSlot.value = null
    pulledFar.value = false
    return
  }
  if (!wasDrag) {
    dragging.value = null
    hoverSlot.value = null
    pulledFar.value = false
    return
  }

  busy.value = true
  const hit = nearestBasket(x, y, '[data-spell-slot]')
  const slotIndex = hit ? Number(hit.word) : -1
  const snapped = Boolean(hit && hit.dist <= SNAP_RANGE && slotIndex >= 0)

  if (!snapped || !hit) {
    await tweenSnapTo(ghostEl.value, origin.value)
    dragging.value = null
    hoverSlot.value = null
    pulledFar.value = false
    busy.value = false
    return
  }

  const ok = !slots.value[slotIndex] && letters.value[slotIndex] === tile.ch
  if (!ok) {
    shakingTile.value = tile.id
    shakingSlot.value = slotIndex
    hoverSlot.value = slotIndex
    await Promise.all([softMiss(hit.el, slotIndex), tweenSnapTo(ghostEl.value, origin.value)])
    dragging.value = null
    hoverSlot.value = null
    pulledFar.value = false
    busy.value = false
    return
  }

  hoverSlot.value = slotIndex
  await tweenSnapTo(ghostEl.value, { x: hit.cx, y: hit.cy })
  placeLetter(tile.ch, slotIndex, tile.id)
  dragging.value = null
  hoverSlot.value = null
  pulledFar.value = false
  await afterPlace(hit.el, slotIndex)
  busy.value = false
}

onMounted(() => {
  resetBoard()
  void ask()
})

onUnmounted(() => {
  alive = false
  stopSpeech()
})
</script>

<template>
  <section class="screen spell">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再拼一遍也可以，星星已经给你啦</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
      <p class="sub">{{ spellSub }}</p>
    </div>

    <div ref="boardEl" class="card board" :class="{ pop: celebrating }">
      <button class="pic-btn" type="button" :disabled="done" @click="hearWord">
        <word-pic :word="target" :size="96" />
        <b v-if="revealed" class="word-reveal">{{ target }}</b>
      </button>
      <button class="speaker" type="button" :disabled="done" aria-label="再听一次" @click="hearWord">
        🔊
      </button>
      <div class="slots" aria-label="字母格子">
        <span
          v-for="(_, index) in letters"
          :key="`slot-${index}`"
          :data-spell-slot="index"
          :data-basket="String(index)"
          class="slot"
          :class="{
            on: Boolean(slots[index]),
            next: nextSlot === index && !celebrating,
            shake: shakingSlot === index,
            hover: hoverSlot === index,
          }"
        >
          {{ slots[index] ?? '' }}
        </span>
      </div>
      <div class="tiles">
        <button
          v-for="tile in tiles"
          v-show="!tile.used"
          :key="tile.id"
          v-drag="onTileDrag(tile.id)"
          :data-spell-tile="tile.id"
          class="tile"
          type="button"
          :class="{ shake: shakingTile === tile.id, dragging: dragging === tile.id }"
          :disabled="!canPlay || locked || done"
          :aria-label="tile.ch"
          :drag-options="dragOptions"
          @click="pickTile(tile, $event)"
        >
          {{ tile.ch }}
        </button>
      </div>
    </div>

    <p class="hint center">
      {{
        !canPlay
          ? '先把前面的关卡通完哦。'
          : `${progressText} · ${gateSpellHint()}`
      }}
    </p>
    <big-button variant="listen" :disabled="done" @click="hearWord">再听一次</big-button>
    <div ref="ghostEl" class="ghost" :class="{ show: Boolean(dragging) }">
      {{ dragTile?.ch }}
    </div>
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :chapter-no="chapterNo"
      :from-practice="isChapterPractice"
      :has-next="Boolean(lastResult?.nextLevelId)"
      @replay="replayCleared"
      @next="continueAfterClear"
      @lobby="goLobby"
    />
  </section>
</template>

<style scoped>
.spell {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0f766e;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #0f766e;
}

.board {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-top: 8px;
  padding: 16px 12px 18px;
}

.pic-btn {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 4px;
  background: transparent;
}

.word-reveal {
  font-size: 32px;
  letter-spacing: 0.04em;
}

.speaker {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(180deg, #a78bfa 0%, var(--grape) 100%);
  color: #fff;
  box-shadow: 0 6px 0 #5b4d9a;
  font-size: 32px;
}

.speaker:active:not(:disabled) {
  transform: translateY(2px);
}

.slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.slot {
  display: grid;
  place-items: center;
  width: 64px;
  height: 72px;
  border-radius: 18px;
  background: #eef6f4;
  border: 3px dashed #c5d8d2;
  font-size: 32px;
  font-weight: 800;
  text-transform: lowercase;
}

.slot.on {
  background: #fff6d0;
  border: 3px solid #f4b400;
}

.slot.next {
  box-shadow: 0 0 0 6px rgba(139, 124, 246, 0.22);
  border-color: #8b7cf6;
}

.slot.hover {
  box-shadow: inset 0 0 0 4px rgba(255, 159, 67, 0.55);
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.tile {
  min-width: 64px;
  min-height: 64px;
  padding: 0 14px;
  border-radius: 18px;
  background: #fff3c4;
  box-shadow: 0 5px 0 rgba(244, 180, 0, 0.28);
  font-size: 28px;
  font-weight: 800;
  text-transform: lowercase;
  touch-action: none;
  user-select: none;
}

.tile:nth-child(2n) {
  background: #ffe0c2;
  box-shadow: 0 5px 0 rgba(255, 143, 67, 0.28);
}

.tile:nth-child(3n) {
  background: #d9f3ff;
  box-shadow: 0 5px 0 rgba(61, 184, 199, 0.28);
}

.tile:active:not(:disabled) {
  transform: translateY(2px);
}

.tile.dragging {
  opacity: 0.35;
}

.ghost {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 20;
  min-width: 64px;
  min-height: 64px;
  margin: -32px 0 0 -32px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #fff3c4;
  font-size: 28px;
  font-weight: 800;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  box-shadow: 0 8px 0 rgba(244, 180, 0, 0.28);
  text-transform: lowercase;
}

.ghost.show {
  opacity: 1;
  visibility: visible;
}

.hint {
  margin: 0;
}

.pop {
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}
</style>
