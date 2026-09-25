<script setup lang="ts">
import { ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import { playPop, playSuccess } from '../composables/useSfx'
import { speak } from '../composables/useSpeech'
import { introLine, meadowSrc, type MeadowAnimalDef } from './meadowConfig'

const props = defineProps<{
  animal: MeadowAnimalDef
}>()

const emit = defineEmits<{
  done: []
}>()

const taps = ref(0)
const popped = ref(false)
const shaking = ref(false)

function tapEgg() {
  if (popped.value) return
  taps.value += 1
  shaking.value = false
  requestAnimationFrame(() => {
    shaking.value = true
  })
  if (taps.value >= 3) {
    popped.value = true
    playSuccess()
    void speak(introLine(props.animal.name))
    return
  }
  playPop()
  window.setTimeout(() => {
    shaking.value = false
  }, taps.value >= 2 ? 500 : 420)
}

function finish() {
  emit('done')
}
</script>

<template>
  <Teleport to="body">
    <div class="hatch-mask" role="dialog" aria-modal="true" aria-label="孵化小动物">
      <div class="hatch-card">
        <p class="kicker">{{ popped ? '它出来啦！' : '轻轻点三下' }}</p>
        <div class="stage">
          <button v-if="!popped" class="egg-hit" type="button" aria-label="点蛋" @click="tapEgg">
            <img
              class="egg"
              :class="{ wobble: !shaking, shake: shaking, hard: taps >= 2 }"
              :src="meadowSrc('egg')"
              alt=""
              draggable="false"
            />
            <svg class="cracks" viewBox="0 0 100 100" aria-hidden="true">
              <g v-if="taps >= 1" class="crack">
                <path d="M50 38 L44 50 L52 58" />
              </g>
              <g v-if="taps >= 2" class="crack wide">
                <path d="M50 38 L60 49 L54 66" />
                <path d="M44 50 L34 56" />
                <path d="M52 58 L62 64" />
              </g>
            </svg>
          </button>
          <div v-else class="born">
            <span v-for="n in 8" :key="n" class="star" :style="{ '--i': String(n) }" aria-hidden="true">⭐</span>
            <img class="animal" :src="meadowSrc(animal.id)" :alt="animal.name" draggable="false" />
          </div>
        </div>
        <big-button v-if="popped" @click="finish">去草地看看</big-button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hatch-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: radial-gradient(circle at 50% 38%, rgba(255, 244, 214, 0.55), rgba(18, 52, 42, 0.55));
}

.hatch-card {
  width: min(100%, 420px);
  padding: 22px 18px 18px;
  border-radius: 32px;
  background: rgba(255, 253, 246, 0.96);
  box-shadow: 0 12px 0 rgba(45, 58, 74, 0.16);
  display: grid;
  justify-items: center;
  gap: 8px;
}

.kicker {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
}

.stage {
  position: relative;
  width: min(78vw, 300px);
  height: min(72vw, 280px);
  display: grid;
  place-items: center;
}

.egg-hit {
  position: relative;
  width: 92%;
  height: 92%;
  padding: 0;
  background: transparent;
  border-radius: 40%;
}

.egg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: 50% 80%;
}

.egg.wobble {
  animation: wobble 1.5s ease-in-out infinite;
}

.egg.shake {
  animation: shake 0.42s ease;
}

.egg.shake.hard {
  animation-duration: 0.5s;
}

.cracks {
  position: absolute;
  inset: 8% 10% 6%;
  width: 80%;
  height: 86%;
  pointer-events: none;
}

.crack path {
  fill: none;
  stroke: #5c4636;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.crack.wide path {
  stroke-width: 3.4;
}

.born {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.animal {
  width: 88%;
  height: 88%;
  object-fit: contain;
  object-position: center bottom;
  animation: pop-out 0.55s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}

.star {
  position: absolute;
  left: 46%;
  top: 42%;
  font-size: 22px;
  animation: burst 0.7s ease-out forwards;
}

.hatch-card :deep(.big-btn) {
  margin-top: 8px;
}

@keyframes wobble {
  0%,
  100% {
    transform: rotate(-4deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: rotate(0) translateX(0);
  }
  20% {
    transform: rotate(-10deg) translateX(-6px);
  }
  45% {
    transform: rotate(12deg) translateX(7px);
  }
  70% {
    transform: rotate(-8deg) translateX(-4px);
  }
}

@keyframes pop-out {
  0% {
    transform: translateY(28px) scale(0.35, 0.55);
  }
  60% {
    transform: translateY(-14px) scale(1.08, 0.92);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes burst {
  to {
    transform: rotate(calc(var(--i) * 45deg)) translateY(-92px) scale(1.15);
    opacity: 0;
  }
}
</style>
