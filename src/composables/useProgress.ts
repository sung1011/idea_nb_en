import { computed, reactive } from 'vue'
import {
  DAILY_CHAIN,
  GATE_ROUTES,
  addStar,
  advanceIslandDayOncePerDate,
  claimDayCompleteRewards,
  completeDailyIfReady,
  completeGate,
  completeLevel,
  dateKey,
  ensureTodayTask,
  getChapterProgress,
  getNextLevel,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  isLevelCleared,
  isLevelUnlocked,
  markWordSeen,
  persistState,
  resetAllProgress,
  routeAfterGate,
  routeForChainStep,
  routeForNextMainline,
  unlockWord,
  warmupKindForDate,
} from './progressStore'

export {
  ALL_GATES,
  DAILY_CHAIN,
  GATE_ORDER,
  GATE_ROUTES,
  GATE_TO_LEVEL,
  addStar,
  advanceIslandDayOncePerDate,
  claimDayCompleteRewards,
  completeDailyIfReady,
  completeGate,
  completeLevel,
  countChainDone,
  dateKey,
  ensureToday,
  ensureTodayTask,
  getChapterProgress,
  getCurrentChapterId,
  getNextLevel,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  isLevelCleared,
  isLevelUnlocked,
  isWarmupDone,
  isWordUnlocked,
  markWordSeen,
  persistState,
  pickRotatingFocusWord,
  progressStore,
  resetAllProgress,
  routeAfterGate,
  routeForChainStep,
  routeForNextMainline,
  todayKey,
  unlockWord,
  warmupKindForDate,
} from './progressStore'

export type {
  ChainStep,
  ChapterLevelView,
  ChapterProgressView,
  ChapterSave,
  CompleteLevelResult,
  DailyGateId,
  DailyProgress,
  DayCompleteClaim,
  GateId,
  LifetimeProgress,
  ProgressState,
  TodayProgress,
  WarmupKind,
} from './progressStore'

export type { LevelDef, LevelStatus, PlayKind } from '../data/chapters'
export {
  ANIMALS_CHAPTER_ID,
  CHAPTER_1,
  DEFAULT_CHAPTER_ID,
  getChapter,
  getChapterOrDefault,
  getLevel,
  listChapterLevels,
} from '../data/chapters'

export { ISLAND_DAY_CAP } from './progressStore'
export {
  ALBUM_STICKERS,
  CHAPTER_1_STICKER_ID,
  CHAPTER_STICKERS,
  PLACEHOLDER_STICKER_IDS,
  PLACEHOLDER_STICKERS,
  nextStickerId,
  stickerById,
} from '../data/stickers'

export function useProgress() {
  ensureTodayTask()

  const dateKeyRef = computed(() => persistState.dateKey)
  const today = persistState.today
  const lifetime = persistState.lifetime
  const state = reactive({
    get stars() {
      return persistState.lifetime.totalStars
    },
    get dayStars() {
      return persistState.lifetime.animalsIslandDays
    },
    get decorations() {
      return persistState.decorations
    },
    get stickers() {
      return persistState.lifetime.stickers
    },
    get daily() {
      return {
        date: persistState.dateKey,
        familyId: persistState.familyId,
        gates: {
          flashFlip: Boolean(persistState.gates.flashFlip),
          whackWord: Boolean(persistState.gates.whackWord),
          dragSort: Boolean(persistState.gates.dragSort),
          soundFish: Boolean(persistState.gates.soundFish),
          echoCave: Boolean(persistState.gates.echoCave),
        },
        dayComplete: persistState.today.completed,
      }
    },
  })

  const chapter = computed(() => getChapterProgress())
  const nextLevel = computed(() => getNextLevel())
  const gatesDone = computed(() => chapter.value.clearedCount)
  const gateTotal = computed(() => chapter.value.levelTotal)
  const allDoneToday = computed(() => chapter.value.complete)
  const nextGate = computed(
    () => DAILY_CHAIN.find((step) => !isChainStepDone(step, persistState.gates)) ?? null,
  )
  const nextRoute = computed(() => nextLevel.value?.route ?? routeForNextMainline())
  const startLabel = computed(() => {
    if (chapter.value.complete) return '看章节奖励'
    if (chapter.value.clearedCount > 0) return '继续冒险'
    return '开始派对'
  })
  const warmupKind = computed(() => warmupKindForDate(persistState.dateKey))

  return {
    dateKey: dateKeyRef,
    shanghaiDateKey: dateKey,
    today,
    lifetime,
    chapter,
    nextLevel,
    state,
    gatesDone,
    gateTotal,
    allDoneToday,
    nextGate,
    nextRoute,
    startLabel,
    warmupKind,
    routeAfterGate,
    routeForChainStep,
    routeForNextMainline,
    ensureTodayTask,
    addStar,
    completeGate,
    completeLevel,
    isLevelUnlocked,
    isLevelCleared,
    getChapterProgress,
    getNextLevel,
    markWordSeen,
    unlockWord,
    grantSticker,
    completeDailyIfReady,
    claimDayCompleteRewards,
    advanceIslandDayOncePerDate,
    hasDecoration,
    hasSticker,
    resetAllProgress,
    gateRoutes: GATE_ROUTES,
  }
}
