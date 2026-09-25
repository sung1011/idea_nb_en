<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listChapters } from '../data/chapters'
import { playPop } from '../composables/useSfx'
import {
  addStar,
  getFrontierLesson,
  maxOutProgressFromConfig,
  persistState,
  resetAllProgress,
  setCurrentLesson,
  setMeadowOpenAnytime,
  skipMeadowHunger,
} from '../composables/useProgress'
import appSelect from './appSelect.vue'
import bigButton from './bigButton.vue'

const open = defineModel<boolean>({ default: false })
const step = ref<'main' | 'confirmWipe' | 'confirmMax' | 'pickLesson' | 'confirmLesson'>('main')
const lessonMenuOpen = ref(false)
const pickedLessonId = ref(getFrontierLesson().id)
const router = useRouter()
const chapters = listChapters()
const lessonGroups = computed(() =>
  chapters.map((chapter, index) => ({
    label: `第${index + 1}章 ${chapter.kidTitle}`,
    options: chapter.lessons.map((lesson) => ({
      value: lesson.id,
      label: `第${lesson.order}课 ${lesson.titleZh} ${lesson.syllabusRange}`,
    })),
  })),
)
const pickedLesson = computed(() => {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((item) => item.id === pickedLessonId.value)
    if (lesson) return { chapter, lesson }
  }
  return null
})

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

watch(step, () => {
  lessonMenuOpen.value = false
})

watch(open, (value) => {
  if (value) {
    step.value = 'main'
    window.addEventListener('keydown', onKey)
    return
  }
  window.removeEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})

function close() {
  open.value = false
  step.value = 'main'
}

function refreshRoute() {
  const current = router.currentRoute.value
  void router.replace({
    path: current.path,
    query: { ...current.query },
    hash: current.hash,
  })
}

function toggleMeadow() {
  playPop()
  setMeadowOpenAnytime(!persistState.meadow.openAnytime)
}

function skipHunger() {
  playPop()
  skipMeadowHunger()
}

function grantStars() {
  playPop()
  addStar(50)
}

function askWipeConfirm() {
  playPop()
  step.value = 'confirmWipe'
}

function askMaxConfirm() {
  playPop()
  step.value = 'confirmMax'
}

function askLesson() {
  playPop()
  pickedLessonId.value = getFrontierLesson().id
  step.value = 'pickLesson'
}

function askLessonConfirm() {
  playPop()
  if (!pickedLesson.value) return
  step.value = 'confirmLesson'
}

function wipeAll() {
  playPop()
  resetAllProgress()
  close()
  void router.replace('/')
}

function maxAll() {
  playPop()
  maxOutProgressFromConfig()
  close()
  refreshRoute()
}

function applyLesson() {
  playPop()
  if (!pickedLesson.value) return
  setCurrentLesson(pickedLesson.value.lesson.id)
  close()
  void router.replace('/')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="settings-mask"
      @click.self="close"
    >
      <div
        class="settings-card"
        role="dialog"
        :aria-modal="lessonMenuOpen ? 'false' : 'true'"
        aria-labelledby="settings-title"
      >
        <template v-if="step === 'main'">
          <p class="eyebrow">Settings</p>
          <h2 id="settings-title" class="title">设置</h2>
          <p class="warn">
            「设置当前课」会把这一课之前的课标成已过，并发放对应星星和章节徽章，方便跟学校进度对齐。
            「初始化」会清空本地进度：星星、贴纸、图鉴解锁、课和关卡，以及星星草地。词卡图片还在，不会删。
            「完全化」会按配置一键打满：所有课、关卡、星星、徽章贴纸、图鉴词、岛日展示，并把 12 只小动物直接放到星星草地（不孵蛋），每只爱心都是满的。不会送小商店里的装饰。
            「草地时间 +12小时」只给调试用，把草地上每只动物的饥饿时间往前拨 12 小时。
            「星星 +50」只给调试用，加的是一辈子的星星，不会把小商店里的装饰送掉。
          </p>
          <button class="meadow-toggle" type="button" @click="toggleMeadow">
            <span>随时进星星草地</span>
            <span class="toggle" :class="{ on: persistState.meadow.openAnytime }">
              {{ persistState.meadow.openAnytime ? '开' : '关' }}
            </span>
          </button>
          <big-button variant="soft" @click="skipHunger">草地时间 +12小时</big-button>
          <big-button variant="soft" @click="grantStars">星星 +50</big-button>
          <big-button variant="primary" @click="askLesson">设置当前课</big-button>
          <big-button variant="danger" @click="askWipeConfirm">初始化</big-button>
          <big-button variant="soft" @click="askMaxConfirm">完全化</big-button>
          <big-button variant="soft" @click="close">先不了</big-button>
        </template>
        <template v-else-if="step === 'pickLesson'">
          <p class="eyebrow">Lesson</p>
          <h2 id="settings-title" class="title">设置当前课</h2>
          <p class="warn">选学校现在上到的那一课。更早的课会记成已过。</p>
          <label class="pick-label" for="lesson-pick">当前课</label>
          <app-select
            id="lesson-pick"
            v-model="pickedLessonId"
            :groups="lessonGroups"
            placeholder="选一课"
            @open-change="lessonMenuOpen = $event"
          />
          <big-button variant="primary" @click="askLessonConfirm">就设成这课</big-button>
          <big-button variant="soft" @click="step = 'main'">返回</big-button>
        </template>
        <template v-else-if="step === 'confirmLesson'">
          <p class="eyebrow">Lesson</p>
          <h2 id="settings-title" class="title">设成这一课？</h2>
          <p class="warn">
            {{
              pickedLesson
                ? `第${chapters.indexOf(pickedLesson.chapter) + 1}章 · 第${pickedLesson.lesson.order}课 ${pickedLesson.lesson.titleZh}（${pickedLesson.lesson.syllabusRange}）。前面的课会记成已过，星星和章节徽章一起补上。`
                : '请先选一课。'
            }}
          </p>
          <big-button variant="primary" @click="applyLesson">确认</big-button>
          <big-button variant="soft" @click="step = 'pickLesson'">再选选</big-button>
        </template>
        <template v-else-if="step === 'confirmWipe'">
          <p class="eyebrow">Reset</p>
          <h2 id="settings-title" class="title">真的清空吗？</h2>
          <p class="warn">清空后不能找回，会回到第一次打开的样子，星星草地也一起清空。</p>
          <big-button variant="danger" @click="wipeAll">真的清空</big-button>
          <big-button variant="soft" @click="close">再想想</big-button>
        </template>
        <template v-else>
          <p class="eyebrow">Max</p>
          <h2 id="settings-title" class="title">一键打满所有进度？</h2>
          <p class="warn">会按当前配置解锁全部关卡、贴纸和图鉴，并把 12 只小动物直接放到星星草地，每只爱心都是满的，方便调试。</p>
          <big-button variant="primary" @click="maxAll">打满</big-button>
          <big-button variant="soft" @click="close">再想想</big-button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(14, 42, 58, 0.46);
}

.settings-card {
  width: min(100%, 360px);
  padding: 22px 18px 18px;
  border-radius: 28px;
  background: #fffdf6;
  box-shadow: 0 12px 0 rgba(45, 58, 74, 0.16);
  display: grid;
  gap: 10px;
}

.eyebrow {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

.title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.warn {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
  color: var(--ink);
}

.meadow-toggle {
  width: 100%;
  min-height: 56px;
  padding: 0 16px;
  border-radius: 18px;
  background: #e7f8e4;
  color: var(--ink);
  font-size: 18px;
  font-weight: 750;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle {
  min-width: 48px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  display: grid;
  place-items: center;
  box-shadow: 0 3px 0 rgba(45, 58, 74, 0.1);
}

.toggle.on {
  background: #2f9e44;
  color: #fff;
}

.pick-label {
  font-size: 14px;
  font-weight: 750;
}

.settings-card {
  max-height: min(86dvh, 640px);
  overflow-y: auto;
}

</style>
