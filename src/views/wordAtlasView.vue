<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import atlasChapterHead from '../components/atlasChapterHead.vue'
import numberClay from '../components/numberClay.vue'
import starBar from '../components/starBar.vue'
import wordPic from '../components/wordPic.vue'
import { tweenPulse, tweenShake } from '../composables/useMotion'
import { playNudge, playPop, speak, stopSpeech } from '../composables/useSpeech'
import { useWordAtlas } from '../composables/useWordAtlas'

type AtlasCard = {
  word: string
  zh: string
  numeral?: number
  unlocked: boolean
}

const router = useRouter()
const { chapters, unlockedCount, total } = useWordAtlas()
const busy = ref(false)

async function onTap(item: AtlasCard, event: MouseEvent) {
  if (busy.value) return
  const target = event.currentTarget instanceof Element ? event.currentTarget : null
  if (!item.unlocked) {
    playNudge()
    await tweenShake(target, 6)
    return
  }
  busy.value = true
  playPop()
  void tweenPulse(target)
  await speak(item.word)
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
      <p class="eyebrow">Word Atlas</p>
      <h1 class="title-lg">单词图鉴</h1>
      <p class="sub">点开认识的词听听看 · 逛图鉴不加星星</p>
    </div>

    <p class="progress-line center">已收集 {{ unlockedCount }} / {{ total }}</p>

    <div class="book">
      <section v-for="group in chapters" :key="group.chapterId" class="chapter" :data-chapter="group.chapterId">
        <atlas-chapter-head :chapter-no="group.chapterNo" :animal-id="group.animalId" :animal-zh="group.animalZh" />
        <div class="grid">
          <button
            v-for="item in group.words"
            :key="item.word"
            class="card-btn"
            :class="{ locked: !item.unlocked }"
            type="button"
            :data-word="item.word"
            :aria-label="item.unlocked ? item.word : 'locked word'"
            @click="onTap(item, $event)"
          >
            <span class="pic">
              <number-clay v-if="item.numeral != null" :value="item.numeral" size="sm" />
              <word-pic v-else :word="item.word" :size="64" />
            </span>
            <template v-if="item.unlocked">
              <span class="word">{{ item.word }}</span>
              <span v-if="item.zh" class="zh">{{ item.zh }}</span>
            </template>
            <span v-else class="mystery" aria-hidden="true">?</span>
          </button>
        </div>
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
  padding-bottom: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card-btn {
  min-height: 118px;
  min-width: 0;
  padding: 10px 6px 12px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.12);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
}

.card-btn:active {
  transform: translateY(2px);
}

.pic {
  width: 64px;
  height: 64px;
  font-size: 42px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.pic :deep(.number-clay) {
  transform: scale(0.72);
}

.word {
  font-size: 20px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.zh {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.15;
  font-weight: 650;
  color: #8a7564;
  text-align: center;
}

.mystery {
  min-width: 28px;
  min-height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #e8eef4;
  color: var(--muted);
  font-size: 18px;
  font-weight: 800;
}

.locked {
  background: #d7dee6;
  box-shadow: 0 8px 0 rgba(45, 58, 74, 0.08);
}

.locked .pic {
  filter: brightness(0) opacity(0.28);
}
</style>
