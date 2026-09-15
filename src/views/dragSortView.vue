<script setup lang="ts">
import { dragDirective } from '@vueuse/gesture'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import starBar from '../components/starBar.vue'
import { magnetPoint, nearestBasket, SNAP_RANGE } from '../composables/useDragSnap'
import { tweenCelebrate, tweenPulse, tweenShake, tweenSnapTo } from '../composables/useMotion'
import { usePlayMode } from '../composables/usePlayMode'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { getCurrentFamily, wordEmoji } from '../data/phonicsFamily'
import { shuffle } from '../data/playGallery'

type DragState = {
  first: boolean
  last: boolean
  dragging: boolean
  xy: [number, number]
}

const router = useRouter()
const family = getCurrentFamily()
const { afterGate, backPath, backLabel } = usePlayMode()
const vDrag = dragDirective()

const words = family.targets.slice(0, 3)
const baskets = ref(shuffle([...words]))
const trayOrder = ref(shuffle([...words]))
const placed = ref<Record<string, boolean>>(
  Object.fromEntries(words.map((word) => [word, false])),
)
const dragging = ref<string | null>(null)
const hoverWord = ref<string | null>(null)
const locked = ref(true)
const celebrating = ref(false)
const busy = ref(false)
const prompt = ref('')
const ghostEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const origin = ref({ x: 0, y: 0 })

const trayItems = computed(() => trayOrder.value.filter((word) => !placed.value[word]))
const demoWord = words.includes('cat') ? 'cat' : words[0]
const dragOptions = {
  preventWindowScrollY: true,
  useTouch: true,
  filterTaps: false,
}

function basketEl(word: string): HTMLElement | null {
  return document.querySelector(`[data-basket="${word}"]`)
}

function moveGhost(x: number, y: number) {
  if (ghostEl.value) {
    ghostEl.value.style.left = `${x}px`
    ghostEl.value.style.top = `${y}px`
  }
}

function onChipDrag(word: string) {
  return (state: DragState) => {
    if (locked.value || celebrating.value || busy.value) return
    if (dragging.value && dragging.value !== word) return

    const [x, y] = state.xy
    const hit = nearestBasket(x, y)

    if (state.first) {
      dragging.value = word
      origin.value = { x, y }
      const pulled = magnetPoint(x, y, hit)
      hoverWord.value = hit && hit.dist <= SNAP_RANGE ? hit.word : null
      playPop()
      void speak(word)
      void nextTick(() => moveGhost(pulled.x, pulled.y))
      return
    }

    if (state.dragging) {
      const pulled = magnetPoint(x, y, hit)
      moveGhost(pulled.x, pulled.y)
      hoverWord.value = hit && hit.dist <= SNAP_RANGE ? hit.word : null
    }

    if (state.last) {
      void dropAt(x, y)
    }
  }
}

async function onboard() {
  locked.value = true
  prompt.value = demoWord
  await speak(demoWord)
  const target = basketEl(demoWord)
  if (target) {
    target.classList.add('pulse')
    await tweenPulse(target)
    target.classList.remove('pulse')
  }
  locked.value = false
}

async function finish() {
  celebrating.value = true
  prompt.value = 'Party sorted!'
  playSuccess()
  await tweenCelebrate(titleEl.value)
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 400))
  void router.push(afterGate('/play-gallery'))
}

async function dropAt(x: number, y: number) {
  const word = dragging.value
  if (!word || locked.value || celebrating.value) {
    dragging.value = null
    hoverWord.value = null
    return
  }

  busy.value = true
  const hit = nearestBasket(x, y)
  const snapped = Boolean(hit && hit.dist <= SNAP_RANGE)

  if (!snapped || !hit) {
    await tweenSnapTo(ghostEl.value, origin.value)
    dragging.value = null
    hoverWord.value = null
    busy.value = false
    return
  }

  if (hit.word !== word) {
    playNudge()
    prompt.value = word
    hoverWord.value = hit.word
    await Promise.all([tweenShake(hit.el), tweenSnapTo(ghostEl.value, origin.value)])
    dragging.value = null
    hoverWord.value = null
    await speak(word)
    const correct = basketEl(word)
    if (correct) {
      correct.classList.add('pulse')
      await tweenPulse(correct)
      correct.classList.remove('pulse')
    }
    busy.value = false
    return
  }

  hoverWord.value = word
  await tweenSnapTo(ghostEl.value, { x: hit.cx, y: hit.cy })
  placed.value = { ...placed.value, [word]: true }
  playPop()
  prompt.value = 'Yes!'
  dragging.value = null
  hoverWord.value = null
  await speak(word)
  await tweenPulse(hit.el)
  busy.value = false
  if (words.every((item) => placed.value[item])) {
    await finish()
  }
}

onMounted(() => {
  void onboard()
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<template>
  <section class="screen sort">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center">
      <p class="gate-tag">Drag Sort</p>
      <h1 ref="titleEl" class="title-lg">{{ prompt }}</h1>
    </div>

    <div class="buckets">
      <div
        v-for="word in baskets"
        :key="word"
        :data-basket="word"
        class="bucket"
        :class="{
          on: placed[word],
          hover: hoverWord === word,
        }"
        :aria-label="word"
      >
        <span class="pic" aria-hidden="true">{{ wordEmoji(word, family) }}</span>
        <span class="bowl" aria-hidden="true" />
        <span v-if="placed[word]" class="landed">{{ word }}</span>
      </div>
    </div>

    <div class="tray">
      <button
        v-for="word in trayItems"
        :key="word"
        v-drag="onChipDrag(word)"
        class="chip"
        type="button"
        :class="{ dragging: dragging === word }"
        :aria-label="word"
        :drag-options="dragOptions"
      >
        {{ word }}
      </button>
    </div>

    <div ref="ghostEl" class="ghost" :class="{ show: Boolean(dragging) }">
      {{ dragging }}
    </div>
  </section>
</template>

<style scoped>
.sort {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #b45309;
}

.buckets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  min-height: 188px;
}

.bucket {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 176px;
  padding: 12px 6px 14px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 3px rgba(45, 58, 74, 0.06);
}

.bucket.on {
  background: #e4f8ec;
}

.bucket.hover {
  box-shadow: inset 0 0 0 4px rgba(255, 159, 67, 0.55);
}

.bucket.pulse {
  background: #ffe27a;
  box-shadow: 0 0 0 8px rgba(255, 226, 122, 0.45);
}

.pic {
  font-size: 52px;
  line-height: 1;
  filter: drop-shadow(0 6px 0 rgba(45, 58, 74, 0.08));
}

.bowl {
  width: 78%;
  height: 28px;
  margin-top: 4px;
  border-radius: 0 0 46px 46px;
  background:
    repeating-linear-gradient(
      90deg,
      #e8b86d 0 8px,
      #d7a257 8px 12px
    ),
    linear-gradient(180deg, #f3d19a 0%, #c9843a 100%);
  box-shadow:
    inset 0 6px 0 rgba(255, 255, 255, 0.28),
    0 6px 0 rgba(45, 58, 74, 0.1);
}

.landed {
  margin-top: 8px;
  min-height: 28px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff;
  font-size: 16px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.tray {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
}

.chip {
  min-width: 96px;
  min-height: 72px;
  padding: 8px 14px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  touch-action: none;
  user-select: none;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.chip.dragging {
  opacity: 0.35;
}

.ghost {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 20;
  min-width: 88px;
  min-height: 64px;
  padding: 8px 14px;
  margin: -32px 0 0 -44px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: #fff;
  font-size: 28px;
  font-weight: 750;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  box-shadow: 0 10px 0 rgba(45, 58, 74, 0.16);
}

.ghost.show {
  opacity: 1;
  visibility: visible;
}

.center .title-lg {
  min-height: 36px;
}
</style>
