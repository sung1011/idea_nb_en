import { computed, reactive } from 'vue'
import { CHAPTERS } from '../data/chapters'
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
  isChapterUnlocked,
  latestClearedChapterId,
  listClearedChapterIds,
  locationForDayComplete,
  locationForIslandChapter,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  isLevelCleared,
  isLevelUnlocked,
  markWordSeen,
  maxOutProgressFromConfig,
  persistState,
  resetAllProgress,
  routeAfterGate,
  routeForChainStep,
  routeForNextMainline,
  locationAfterClear,
  locationAfterGate,
  locationForLevel,
  locationForNextMainline,
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
  isChapterCleared,
  isChapterUnlocked,
  latestClearedChapterId,
  listClearedChapterIds,
  locationForDayComplete,
  locationForIslandChapter,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  isLevelCleared,
  isLevelUnlocked,
  isWarmupDone,
  isWordUnlocked,
  locationAfterClear,
  locationAfterGate,
  locationForLevel,
  locationForNextMainline,
  markWordSeen,
  maxOutProgressFromConfig,
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
  ChapterLocation,
  LevelLocation,
  ProgressLocation,
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
  CHAPTER_1_ID,
  CHAPTER_2,
  CHAPTER_2_ID,
  CHAPTER_3,
  CHAPTER_3_ID,
  CHAPTERS,
  DEFAULT_CHAPTER_ID,
  chapterLevelTotal,
  CHAPTER_LOBBY_EMOJI,
  chapterKidTitle,
  chapterUnlocksAfter,
  getChapter,
  getChapterNumber,
  getChapterOrDefault,
  getNextChapter,
  getPriorChapter,
  defaultLevelIdForPlay,
  levelIdForPlay,
  getLevel,
  isAnimalsChapterId,
  listAllLevels,
  listChapterLevels,
  listChapters,
  resolveLevelId,
} from '../data/chapters'

export { ISLAND_DAY_CAP } from './progressStore'
export {
  ALBUM_STICKERS,
  CHAPTER_1_STICKER_ID,
  CHAPTER_2_STICKER_ID,
  CHAPTER_3_STICKER_ID,
  CHAPTER_STICKERS,
  PLACEHOLDER_STICKER_IDS,
  PLACEHOLDER_STICKERS,
  nextStickerId,
  stickerById,
  stickerEmoji,
  stickerLabel,
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

  const nextLevel = computed(() => getNextLevel())
  const chapter = computed(() => {
    const next = nextLevel.value
    if (next) return getChapterProgress(next.chapterId)
    return getChapterProgress(CHAPTERS[CHAPTERS.length - 1].id)
  })
  const gatesDone = computed(() => chapter.value.clearedCount)
  const gateTotal = computed(() => chapter.value.levelTotal)
  const allDoneToday = computed(() => !nextLevel.value)
  const nextGate = computed(
    () => DAILY_CHAIN.find((step) => !isChainStepDone(step, persistState.gates)) ?? null,
  )
  const nextRoute = computed(() => locationForNextMainline())
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
    locationAfterClear,
    locationAfterGate,
    locationForLevel,
    locationForNextMainline,
    ensureTodayTask,
    addStar,
    completeGate,
    completeLevel,
    isLevelUnlocked,
    isLevelCleared,
    isChapterUnlocked,
    getChapterProgress,
    getNextLevel,
    latestClearedChapterId,
    listClearedChapterIds,
    locationForDayComplete,
    locationForIslandChapter,
    markWordSeen,
    unlockWord,
    grantSticker,
    completeDailyIfReady,
    claimDayCompleteRewards,
    advanceIslandDayOncePerDate,
    hasDecoration,
    hasSticker,
    resetAllProgress,
    maxOutProgressFromConfig,
    gateRoutes: GATE_ROUTES,
  }
}
