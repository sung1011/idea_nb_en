import { computed, reactive } from 'vue'
import {
  DAILY_CHAIN,
  GATE_ROUTES,
  addStar,
  advanceIslandDayOncePerDate,
  completeDailyIfReady,
  completeGate,
  countChainDone,
  dateKey,
  ensureTodayTask,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  markWordSeen,
  persistState,
  resetAllProgress,
  routeAfterGate,
  routeForChainStep,
  warmupKindForDate,
} from './progressStore'

export {
  ALL_GATES,
  DAILY_CHAIN,
  GATE_ORDER,
  GATE_ROUTES,
  addStar,
  advanceIslandDayOncePerDate,
  completeDailyIfReady,
  completeGate,
  countChainDone,
  dateKey,
  ensureToday,
  ensureTodayTask,
  grantSticker,
  hasDecoration,
  hasSticker,
  isChainStepDone,
  isWarmupDone,
  isWordUnlocked,
  markWordSeen,
  persistState,
  pickRotatingFocusWord,
  progressStore,
  resetAllProgress,
  routeAfterGate,
  routeForChainStep,
  todayKey,
  warmupKindForDate,
} from './progressStore'

export type {
  ChainStep,
  DailyGateId,
  DailyProgress,
  GateId,
  LifetimeProgress,
  ProgressState,
  TodayProgress,
  WarmupKind,
} from './progressStore'

export { PLACEHOLDER_STICKER_IDS, PLACEHOLDER_STICKERS } from '../data/stickers'

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

  const gatesDone = computed(() => countChainDone(persistState.gates))
  const gateTotal = DAILY_CHAIN.length
  const allDoneToday = computed(
    () => persistState.today.completed || persistState.today.chainStep === 'complete',
  )
  const nextGate = computed(
    () => DAILY_CHAIN.find((step) => !isChainStepDone(step, persistState.gates)) ?? null,
  )
  const nextRoute = computed(() => routeForChainStep(persistState.today.chainStep, persistState.dateKey))
  const startLabel = computed(() => {
    if (allDoneToday.value) return '看今日奖励'
    if (persistState.today.chainStep !== 'warmup' || gatesDone.value > 0) return '继续冒险'
    return '今日主线'
  })
  const warmupKind = computed(() => warmupKindForDate(persistState.dateKey))

  return {
    dateKey: dateKeyRef,
    shanghaiDateKey: dateKey,
    today,
    lifetime,
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
    ensureTodayTask,
    addStar,
    completeGate,
    markWordSeen,
    grantSticker,
    completeDailyIfReady,
    advanceIslandDayOncePerDate,
    hasDecoration,
    hasSticker,
    resetAllProgress,
    gateRoutes: GATE_ROUTES,
  }
}
