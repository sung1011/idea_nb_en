<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import bigButton from '../components/bigButton.vue'
import gateTopBar from '../components/gateTopBar.vue'
import wordPic from '../components/wordPic.vue'
import { useChapterLevel } from '../composables/useChapterLevel'
import { tweenCelebrate, waitAfterStar } from '../composables/useMotion'
import { pickPraise, playSuccess, speak } from '../composables/useSpeech'
import { unlockWord } from '../composables/useWordAtlas'

const { level, isReplay, canPlay, gateTag, finishLevel, goAfterLevel } = useChapterLevel('chapterFinale')
const words = computed(() => level.value?.words ?? ['cat', 'hat', 'mat'])
const celebrating = ref(false)
const locked = ref(false)
const cardEl = ref<HTMLElement | null>(null)

onMounted(() => {
  for (const word of words.value) unlockWord(word)
})

async function finish() {
  if (locked.value) return
  locked.value = true
  celebrating.value = true
  playSuccess()
  await tweenCelebrate(cardEl.value)
  const result = finishLevel()
  await speak(pickPraise(result.firstClear ? 'finish' : 'soft'))
  await waitAfterStar(result.starsAwarded)
  goAfterLevel(result)
}
</script>

<template>
  <section class="screen finale">
    <gate-top-bar />

    <div class="hero center">
      <p class="eyebrow">{{ gateTag }}</p>
      <h1 class="title-xl">-at 派对</h1>
      <p class="sub">短回顾：再看一看 cat / hat / mat</p>
    </div>

    <div ref="cardEl" class="card words" :class="{ pop: celebrating }">
      <div v-for="word in words" :key="word" class="word">
        <word-pic :word="word" :size="72" />
        <b>{{ word }}</b>
      </div>
    </div>

    <p class="hint center">
      {{
        !canPlay
          ? '先把前面的关卡通完哦。'
          : isReplay
            ? '再玩一遍也可以，章节徽章已经给你啦。'
            : '第一次过关会拿到章节徽章。'
      }}
    </p>
    <big-button :disabled="!canPlay || locked" @click="finish">我复习好了</big-button>
  </section>
</template>

<style scoped>
.finale {
  gap: 12px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.words {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.word {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 10px 6px;
}

.word b {
  font-size: 20px;
}

.hint {
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.pop {
  box-shadow: 0 10px 0 rgba(244, 180, 0, 0.18);
}
</style>
