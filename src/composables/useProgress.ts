import { computed, reactive } from 'vue'
import { getCurrentFamily } from '../data/phonicsFamily'

export type GateId = 'soundFish' | 'echoCave'

export type DailyProgress = {
  date: string
  familyId: string
  gates: Record<GateId, boolean>
  dayComplete: boolean
}

export type ProgressState = {
  stars: number
  dayStars: number
  decorations: string[]
  stickers: string[]
  daily: DailyProgress
}

const STORAGE_KEY = 'starWords.v1'

const GATE_ORDER: GateId[] = ['soundFish', 'echoCave']

const GATE_ROUTES: Record<GateId, string> = {
  soundFish: '/sound-fish',
  echoCave: '/echo-cave',
}

export function todayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyDaily(date = todayKey()): DailyProgress {
  return {
    date,
    familyId: getCurrentFamily().id,
    gates: {
      soundFish: false,
      echoCave: false,
    },
    dayComplete: false,
  }
}

function defaultState(): ProgressState {
  return {
    stars: 0,
    dayStars: 0,
    decorations: [],
    stickers: [],
    daily: emptyDaily(),
  }
}

function normalizeDaily(daily?: Partial<DailyProgress>): DailyProgress {
  const base = emptyDaily(daily?.date ?? todayKey())
  return {
    ...base,
    familyId: daily?.familyId ?? base.familyId,
    dayComplete: Boolean(daily?.dayComplete),
    gates: {
      soundFish: Boolean(daily?.gates?.soundFish),
      echoCave: Boolean(daily?.gates?.echoCave),
    },
  }
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as ProgressState
    if (!parsed.daily || typeof parsed.stars !== 'number') return defaultState()
    return {
      ...defaultState(),
      ...parsed,
      decorations: parsed.decorations ?? [],
      stickers: parsed.stickers ?? [],
      daily: normalizeDaily(parsed.daily),
    }
  } catch {
    return defaultState()
  }
}

const state = reactive<ProgressState>(loadState())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function ensureToday() {
  const today = todayKey()
  const familyId = getCurrentFamily().id
  if (state.daily.date !== today || state.daily.familyId !== familyId) {
    state.daily = emptyDaily(today)
    persist()
  }
}

ensureToday()

export function useProgress() {
  ensureToday()

  const gatesDone = computed(
    () => GATE_ORDER.filter((gate) => state.daily.gates[gate]).length,
  )
  const gateTotal = GATE_ORDER.length
  const allDoneToday = computed(() => gatesDone.value === gateTotal)
  const nextGate = computed(() => GATE_ORDER.find((gate) => !state.daily.gates[gate]) ?? null)
  const nextRoute = computed(() => {
    if (nextGate.value) return GATE_ROUTES[nextGate.value]
    return '/day-complete'
  })
  const startLabel = computed(() => {
    if (allDoneToday.value) return '看今日奖励'
    if (gatesDone.value > 0) return '继续冒险'
    return '开始冒险'
  })

  function completeGate(
    gate: GateId,
    extras?: { sticker?: string; decoration?: string },
  ) {
    ensureToday()
    const firstTime = !state.daily.gates[gate]
    state.daily.gates[gate] = true

    let starsAwarded = 0
    if (firstTime) {
      state.stars += 1
      starsAwarded = 1
      if (extras?.sticker && !state.stickers.includes(extras.sticker)) {
        state.stickers.push(extras.sticker)
      }
      if (extras?.decoration && !state.decorations.includes(extras.decoration)) {
        state.decorations.push(extras.decoration)
      }
    }

    if (gate === 'echoCave' && !state.daily.dayComplete) {
      state.daily.dayComplete = true
      if (firstTime) state.dayStars += 1
    }

    persist()
    return { firstTime, starsAwarded }
  }

  function hasDecoration(id: string) {
    return state.decorations.includes(id)
  }

  function hasSticker(id: string) {
    return state.stickers.includes(id)
  }

  return {
    state,
    gatesDone,
    gateTotal,
    allDoneToday,
    nextGate,
    nextRoute,
    startLabel,
    completeGate,
    hasDecoration,
    hasSticker,
    gateRoutes: GATE_ROUTES,
  }
}
