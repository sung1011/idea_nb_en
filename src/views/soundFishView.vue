<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import soundFishStage from '../components/soundFishStage.vue'
import { waitAfterStar } from '../composables/useMotion'
import { useChapterLevel } from '../composables/useChapterLevel'
import {
  canUseRecognition,
  createRecognizer,
  matchSpokenWord,
} from '../composables/useRecognition'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import { getCurrentFamily, sampleWords } from '../data/phonicsFamily'

const family = getCurrentFamily()
const {
  isReplay,
  gateTag,
  finishLevel,
  goAfterLevel,
  showClearSheet,
  lastResult,
  isChapterPractice,
  chapterComplete,
  replayCleared,
  continueAfterClear,
  goPractice,
  goLobby,
} = useChapterLevel('wordFish')

const words = sampleWords(3)
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
  const result = finishLevel({ sticker: family.rewards.soundFishSticker.id })
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function catchWord(word: string) {
  if (locked.value || caught.value.includes(word)) return
  locked.value = true
  stopMic()
  const cheer = pickPraise('step')
  prompt.value = `${cheer} ${word}`
  playPop()
  unlockWord(word)
  await stageRef.value?.liftFish(word)
  caught.value = [...caught.value, word]
  await speak(cheer)
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
    await speak(pickPraise('soft'))
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
    <gate-top-bar />

    <div class="center head">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
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
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :from-practice="isChapterPractice"
      :has-next="Boolean(lastResult?.nextLevelId)"
      @replay="replayCleared"
      @next="continueAfterClear"
      @practice="goPractice"
      @lobby="goLobby"
    />
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

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #0e7490;
}

.head {
  margin-bottom: 4px;
}

.hint {
  margin: 0 0 8px;
}
</style>
