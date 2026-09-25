<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import atlasChapterHead from '../components/atlasChapterHead.vue'
import numberClay from '../components/numberClay.vue'
import starBar from '../components/starBar.vue'
import wordPic from '../components/wordPic.vue'
import { tweenPulse } from '../composables/useMotion'
import { playPop, speak, stopSpeech } from '../composables/useSpeech'
import { useSentenceAtlas } from '../composables/useSentenceAtlas'

type SentenceRow = {
  word: string
  zh: string
  sentence: string
  numeral?: number
  unlocked: boolean
}

const router = useRouter()
const { chapters, unlockedCount, total } = useSentenceAtlas()
const busy = ref(false)

async function onTap(row: SentenceRow, event: MouseEvent) {
  if (!row.unlocked || busy.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  busy.value = true
  playPop()
  void tweenPulse(target)
  await speak(row.sentence)
  busy.value = false
}

function onLeave() {
  stopSpeech()
  void router.push('/')
}
</script>

<template>
  <section class="screen atlas">
    <header class="top-row">
      <button class="ghost-btn" type="button" @click="onLeave">首页</button>
      <star-bar />
    </header>

    <div class="hero center">
      <p class="eyebrow">Sentence Atlas</p>
      <h1 class="title-lg">句子图鉴</h1>
      <p class="sub">点开学过的句子听听看 · 逛图鉴不加星星</p>
    </div>

    <p class="progress-line center">已打开 {{ unlockedCount }} / {{ total }}</p>

    <div class="book">
      <section v-for="group in chapters" :key="group.chapterId" class="chapter" :data-chapter="group.chapterId">
        <atlas-chapter-head :chapter-no="group.chapterNo" :animal-id="group.animalId" :animal-zh="group.animalZh" />
        <section v-for="lesson in group.lessons" :key="lesson.lessonId" class="lesson" :data-lesson="lesson.lessonId">
          <p class="lesson-tag">第{{ lesson.order }}课<span v-if="lesson.review"> · 复习</span></p>
          <div class="rows">
            <button
              v-for="(row, index) in lesson.rows"
              :key="`${lesson.lessonId}-${index}`"
              class="sentence-row"
              :class="{ locked: !row.unlocked }"
              type="button"
              :data-sentence="row.sentence"
              :aria-label="row.unlocked ? row.sentence : 'locked sentence'"
              @click="onTap(row, $event)"
            >
              <span class="thumb">
                <number-clay v-if="row.numeral != null" :value="row.numeral" size="sm" />
                <word-pic v-else :word="row.word" :size="48" />
              </span>
              <span class="copy">
                <b>{{ row.sentence }}</b>
                <small v-if="row.zh">{{ row.zh }}</small>
              </span>
            </button>
          </div>
        </section>
      </section>
    </div>
  </section>
</template>

<style scoped>
.atlas {
  gap: 10px;
}

.eyebrow {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.progress-line {
  margin: 4px 0 0;
  font-weight: 700;
}

.book {
  display: grid;
  gap: 18px;
  margin-top: 4px;
  padding-bottom: 12px;
}

.lesson {
  margin-top: 8px;
}

.lesson-tag {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 750;
  color: var(--muted);
}

.rows {
  display: grid;
  gap: 8px;
}

.sentence-row {
  width: 100%;
  min-height: 64px;
  padding: 8px 10px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.1);
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 10px;
  align-items: center;
  text-align: left;
}

.sentence-row:active:not(.locked) {
  transform: translateY(2px);
}

.thumb {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
}

.thumb :deep(.number-clay) {
  transform: scale(0.62);
}

.copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.copy b {
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
}

.copy small {
  font-size: 13px;
  font-weight: 650;
  color: #8a7564;
}

.locked {
  background: #e4e9ee;
  box-shadow: 0 6px 0 rgba(45, 58, 74, 0.06);
  color: #8b97a3;
}

.locked .thumb {
  filter: grayscale(1) brightness(0.7);
}

.locked .copy b,
.locked .copy small {
  color: #8b97a3;
}
</style>
