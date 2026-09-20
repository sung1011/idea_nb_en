<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import levelClearSheet from '../components/levelClearSheet.vue'
import {
  canUseRecognition,
  createRecognizer,
  looselyHeard,
} from '../composables/useRecognition'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, tweenShake, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playNudge, playPop, playSuccess, speak, stopSpeech } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'
import wordPic from '../components/wordPic.vue'
import { gateEchoTitle } from '../data/todayTasks'

const {
  isReplay,
  gateTag,
  finishLevel,
  goAfterLevel,
  showClearSheet,
  lastResult,
  isChapterPractice,
  chapterComplete,
  chapterNo,
  chapterId,
  replayCleared,
  continueAfterClear,
  goPractice,
  goLobby,
  level,
  useLevelWords,
  takeRunWords,
} = useChapterLevel('echo')

const words = takeRunWords(3)
const echoTitle = computed(() => gateEchoTitle(level.value?.chapterId, useLevelWords.value))
const wordIndex = ref(0)
const listening = ref(false)
const celebrating = ref(false)
const locked = ref(false)
const status = ref('Listen, then say it.')
const micOk = canUseRecognition()
const cardEl = ref<HTMLElement | null>(null)

const word = computed(() => words[wordIndex.value] ?? words[0])
const progressText = computed(() => `${wordIndex.value + 1} / ${words.length}`)

let recognizer: ReturnType<typeof createRecognizer> = null

function stopMic() {
  listening.value = false
  try {
    recognizer?.stop()
  } catch {
    /* already stopped */
  }
}

async function finishGate() {
  celebrating.value = true
  status.value = 'Echo complete!'
  playSuccess()
  await tweenCelebrate(cardEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}

async function passWord() {
  if (locked.value) return
  locked.value = true
  stopMic()
  celebrating.value = true
  status.value = pickPraise('step')
  playPop()
  unlockWord(word.value)
  void tweenCelebrate(cardEl.value)
  await speak(status.value)
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  if (wordIndex.value >= words.length - 1) {
    await finishGate()
    return
  }
  wordIndex.value += 1
  celebrating.value = false
  locked.value = false
  await playCurrent()
}

function onHeard(transcript: string) {
  if (locked.value) return
  if (looselyHeard(transcript, word.value)) {
    void passWord()
    return
  }
  status.value = pickPraise('soft')
  listening.value = false
  playNudge()
  void tweenShake(cardEl.value)
  void speak(status.value)
}

function startListen() {
  if (!recognizer || locked.value) return
  try {
    recognizer.start()
    listening.value = true
    status.value = 'I am listening...'
  } catch {
    listening.value = false
    status.value = '点「我说好了」也可以'
  }
}

async function playCurrent() {
  stopMic()
  status.value = 'Listen, then say it.'
  await speak(word.value)
  if (micOk) {
    window.setTimeout(() => startListen(), 250)
  } else {
    status.value = '说一说，或点「我说好了」'
  }
}

onMounted(() => {
  recognizer = createRecognizer({
    onResult: onHeard,
    onEnd: () => {
      listening.value = false
    },
  })
  void playCurrent()
})

onUnmounted(() => {
  stopMic()
  stopSpeech()
})
</script>

<template>
  <section class="screen screen-cave cave">
    <gate-top-bar />

    <div class="center">
      <p class="gate-tag">{{ gateTag }}</p>
      <p v-if="isReplay" class="replay-hint">再玩一遍也可以，星星已经给你啦</p>
      <h1 class="title-lg">{{ echoTitle }}</h1>
      <p class="sub">{{ status }}</p>
    </div>

    <div ref="cardEl" class="echo card center" :class="{ popin: celebrating, listening }">
      <div class="art">
        <word-pic :word="word" :size="140" />
      </div>
      <p class="word">{{ word }}</p>
      <div class="rings" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>

    <p class="center hint">
      {{ progressText }} · {{ micOk ? '可以说，也可以点按钮' : '这台设备没有麦克风识别，点按钮就好' }}
    </p>
    <big-button variant="listen" :disabled="locked" @click="playCurrent">再听一次</big-button>
    <big-button :disabled="locked" @click="passWord">我说好了</big-button>
    <level-clear-sheet
      :open="showClearSheet"
      :chapter-complete="chapterComplete"
      :chapter-no="chapterNo"
      :chapter-id="chapterId"
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
.cave {
  gap: 12px;
}

.gate-tag {
  margin: 8px 0 0;
  font-weight: 700;
  color: #f5d0fe;
}

.replay-hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 650;
  color: #f5d0fe;
}

.echo {
  position: relative;
  overflow: hidden;
  min-height: 230px;
  justify-content: center;
}

.echo.listening {
  box-shadow: 0 0 0 4px rgba(196, 181, 253, 0.45);
}

.art {
  width: 140px;
  height: 140px;
  font-size: 84px;
  line-height: 1;
}

.word {
  margin: 8px 0 0;
  font-size: 40px;
  font-weight: 700;
}

.rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.rings span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 80px;
  height: 80px;
  margin: -40px 0 0 -40px;
  border: 3px solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  opacity: 0;
}

.listening .rings span {
  animation: pulse 1.6s ease-out infinite;
}

.listening .rings span:nth-child(2) {
  animation-delay: 0.35s;
}

.listening .rings span:nth-child(3) {
  animation-delay: 0.7s;
}

.hint {
  color: #d9d0f5;
}
</style>
