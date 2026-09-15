<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import bigButton from '../components/bigButton.vue'
import soundFishStage from '../components/soundFishStage.vue'
import starBar from '../components/starBar.vue'
import { usePlayMode } from '../composables/usePlayMode'
import { useProgress } from '../composables/useProgress'
import {
  canUseRecognition,
  createRecognizer,
  matchSpokenWord,
} from '../composables/useRecognition'
import { playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getCurrentFamily } from '../data/phonicsFamily'

const router = useRouter()
const family = getCurrentFamily()
const { completeGate } = useProgress()
const { isPractice, afterGate, backPath, backLabel } = usePlayMode()

const words = family.targets
const caught = ref<string[]>([])
const locked = ref(false)
const listening = ref(false)
const celebrating = ref(false)
const prompt = ref('Read a word!')
const micOk = ref(canUseRecognition())
const stageRef = ref<{
  liftFish: (word: string) => Promise<void>
  nudgeRemaining: () => void
} | null>(null)

const remaining = computed(() => words.filter((word) => !caught.value.includes(word)))
const progressText = computed(() => `${caught.value.length} / ${words.length}`)

let recognizer: ReturnType<typeof createRecognizer> = null

function stopMic() {
  listening.value = false
  try {
    recognizer?.stop()
  } catch {
    /* already stopped */
  }
}

function startListen() {
  if (!recognizer || !micOk.value || locked.value || !remaining.value.length) return
  try {
    recognizer.start()
    listening.value = true
    prompt.value = 'I am listening...'
  } catch {
    listening.value = false
    prompt.value = '点小鱼也能钓上来'
  }
}

async function replayPrompt() {
  if (locked.value) return
  stopMic()
  prompt.value = remaining.value.length ? 'Read a word!' : 'Nice fishing!'
  await speak('Read a word!')
  if (micOk.value && remaining.value.length && !locked.value) {
    window.setTimeout(() => startListen(), 250)
  }
}

async function finishGate() {
  celebrating.value = true
  prompt.value = 'Nice fishing!'
  playSuccess()
  if (!isPractice.value) {
    completeGate('soundFish', { sticker: family.rewards.soundFishSticker.id })
  }
  await speak('Great job!')
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  void router.push(afterGate('/echo-cave'))
}

async function catchWord(word: string) {
  if (locked.value || caught.value.includes(word)) return
  locked.value = true
  stopMic()
  prompt.value = `Yes! ${word}`
  playPop()
  unlockWord(word)
  await stageRef.value?.liftFish(word)
  caught.value = [...caught.value, word]
  await speak(word)
  if (!remaining.value.length) {
    await finishGate()
    return
  }
  locked.value = false
  prompt.value = 'Read a word!'
  if (micOk.value) {
    window.setTimeout(() => startListen(), 280)
  } else {
    prompt.value = '再说一个，或点下一条小鱼'
  }
}

function missSpeak() {
  if (locked.value) return
  listening.value = false
  prompt.value = '再读一个词，或点小鱼'
  playNudge()
  stageRef.value?.nudgeRemaining()
  void (async () => {
    await speak('Try again!')
    if (micOk.value && remaining.value.length && !locked.value) {
      window.setTimeout(() => startListen(), 250)
    }
  })()
}

function onHeard(transcript: string) {
  if (locked.value) return
  const hit = matchSpokenWord(transcript, remaining.value)
  if (hit) {
    void catchWord(hit)
    return
  }
  missSpeak()
}

function onTapFish(word: string) {
  void catchWord(word)
}

async function onHearFish(word: string) {
  if (locked.value || caught.value.includes(word)) return
  stopMic()
  prompt.value = word
  await speak(word)
  if (micOk.value && remaining.value.length && !locked.value) {
    window.setTimeout(() => startListen(), 250)
  }
}

onMounted(() => {
  recognizer = createRecognizer({
    onResult: onHeard,
    onEnd: () => {
      listening.value = false
    },
    onError: (error) => {
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        micOk.value = false
        prompt.value = '点小鱼钓上来，或点 ♪ 先听'
      }
    },
  })
  void replayPrompt()
})

onUnmounted(() => {
  stopMic()
  stopSpeech()
})
</script>

<template>
  <section class="screen fish">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="router.push(backPath)">{{ backLabel }}</button>
      <star-bar />
    </header>

    <div class="center head">
      <p class="gate-tag">Gate 1 · Word Fish</p>
      <h1 class="title-lg">读词钓鱼</h1>
      <p class="sub">小猫请客 · {{ prompt }}</p>
    </div>

    <sound-fish-stage
      ref="stageRef"
      :words="words"
      :caught="caught"
      :locked="locked"
      :listening="listening"
      @tap="onTapFish"
      @hear="onHearFish"
    />

    <p class="center hint">
      {{ progressText }} ·
      {{
        micOk
          ? '读出鱼身上的单词，或点小鱼钓上来'
          : '点小鱼钓上来，点 ♪ 可以先听'
      }}
    </p>
    <big-button variant="listen" :disabled="locked || celebrating" @click="replayPrompt">
      再听提示
    </big-button>
  </section>
</template>

<style scoped>
.fish {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #0e7490;
}

.head {
  margin-bottom: 4px;
}

.hint {
  margin: 0 0 8px;
}
</style>
