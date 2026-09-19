import { computed, reactive } from 'vue'
import {
  GATE_ORDER,
  GATE_ROUTES,
  addStar,
  advanceIslandDayOncePerDate,
  completeDailyIfReady,
  completeGate,
  dateKey,
  ensureToday,
  grantSticker,
  hasDecoration,
  hasSticker,
  markWordSeen,
  persistState,
} from './progressStore'

export {
  GATE_ORDER,
  GATE_ROUTES,
  addStar,
  advanceIslandDayOncePerDate,
  completeDailyIfReady,
  completeGate,
  dateKey,
  ensureToday,
  grantSticker,
  hasDecoration,
  hasSticker,
  isWordUnlocked,
  markWordSeen,
  persistState,
  progressStore,
  todayKey,
} from './progressStore'

export type {
  ChainStep,
  DailyGateId,
  DailyProgress,
  GateId,
  LifetimeProgress,
  ProgressState,
  TodayProgress,
} from './progressStore'

export { PLACEHOLDER_STICKER_IDS, PLACEHOLDER_STICKERS } from '../data/stickers'

export function useProgress() {
  ensureToday()

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
          soundFish: Boolean(persistState.gates.soundFish),
          echoCave: Boolean(persistState.gates.echoCave),
        },
        dayComplete: persistState.today.completed,
      }
    },
  })

  const gatesDone = computed(
    () => GATE_ORDER.filter((gate) => persistState.gates[gate]).length,
  )
  const gateTotal = GATE_ORDER.length
  const allDoneToday = computed(() => gatesDone.value === gateTotal)
  const nextGate = computed(() => GATE_ORDER.find((gate) => !persistState.gates[gate]) ?? null)
  const nextRoute = computed(() => {
    if (nextGate.value) return GATE_ROUTES[nextGate.value]
    return '/day-complete'
  })
  const startLabel = computed(() => {
    if (allDoneToday.value) return '看今日奖励'
    if (gatesDone.value > 0) return '继续冒险'
    return '开始冒险'
  })

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
    addStar,
    completeGate,
    markWordSeen,
    grantSticker,
    completeDailyIfReady,
    advanceIslandDayOncePerDate,
    hasDecoration,
    hasSticker,
    gateRoutes: GATE_ROUTES,
  }
}
