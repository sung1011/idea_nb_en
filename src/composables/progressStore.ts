import { reactive } from 'vue'
import { getCurrentFamily, listAllFamilyWords } from '../data/phonicsFamily'

export const PROGRESS_STORAGE_KEY = 'starWords.v2'
const LEGACY_PROGRESS_KEY = 'starWords.v1'
const LEGACY_ATLAS_KEY = 'starWords.atlas.v1'
const PERSIST_VERSION = 2
const ISLAND_DAY_CAP = 7
const SHANGHAI_TZ = 'Asia/Shanghai'

export type DailyGateId = 'soundFish' | 'echoCave'
export type GateId = DailyGateId | 'flashFlip' | 'whackWord' | 'dragSort'

export type ChainStep = 'warmup' | 'drag' | 'fish' | 'echo' | 'complete'

export type TodayProgress = {
  starsEarned: number
  starsGoal?: number
  mainTaskId: string
  mainTaskDone: boolean
  focusWord?: string
  focusHits: number
  chainStep: ChainStep
  completed: boolean
}

export type LifetimeProgress = {
  totalStars: number
  stickers: string[]
  unlockedWords: string[]
  animalsIslandDays: number
}

export type DailyProgress = {
  date: string
  familyId: string
  gates: Record<DailyGateId, boolean>
  dayComplete: boolean
}

export type ProgressState = {
  stars: number
  dayStars: number
  decorations: string[]
  stickers: string[]
  daily: DailyProgress
}

type PersistShape = {
  version: number
  dateKey: string
  today: TodayProgress
  lifetime: LifetimeProgress
  familyId: string
  gates: Record<string, boolean>
  decorations: string[]
  lastIslandDate: string | null
}

type LegacyProgress = {
  stars?: unknown
  dayStars?: unknown
  decorations?: unknown
  stickers?: unknown
  daily?: {
    date?: unknown
    familyId?: unknown
    gates?: Partial<Record<string, unknown>>
    dayComplete?: unknown
  }
}

type LegacyAtlas = {
  words?: unknown
}

const MAIN_TASK_ID = 'animalsIsland'
const DEFAULT_STARS_GOAL = 2

export const GATE_ORDER: DailyGateId[] = ['soundFish', 'echoCave']

export const GATE_ROUTES: Record<DailyGateId, string> = {
  soundFish: '/sound-fish',
  echoCave: '/echo-cave',
}

const CHAIN_STEPS: ChainStep[] = ['warmup', 'drag', 'fish', 'echo', 'complete']

const GATE_CHAIN_NEXT: Record<GateId, ChainStep> = {
  flashFlip: 'drag',
  whackWord: 'drag',
  dragSort: 'fish',
  soundFish: 'echo',
  echoCave: 'complete',
}

const atlasWords = listAllFamilyWords()
const knownWords = new Set(atlasWords.map((item) => item.word.toLowerCase()))

function chainRank(step: ChainStep): number {
  const index = CHAIN_STEPS.indexOf(step)
  return index >= 0 ? index : 0
}

function maxChain(current: ChainStep, next: ChainStep): ChainStep {
  return chainRank(next) > chainRank(current) ? next : current
}

/** Asia/Shanghai calendar day, YYYY-MM-DD. */
export function dateKey(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (year && month && day) return `${year}-${month}-${day}`
  const y = at.getFullYear()
  const m = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** @deprecated Use dateKey. Kept so older callers keep compiling. */
export function todayKey(): string {
  return dateKey()
}

function emptyToday(): TodayProgress {
  return {
    starsEarned: 0,
    starsGoal: DEFAULT_STARS_GOAL,
    mainTaskId: MAIN_TASK_ID,
    mainTaskDone: false,
    focusHits: 0,
    chainStep: 'fish',
    completed: false,
  }
}

function emptyGates(): Record<DailyGateId, boolean> {
  return {
    soundFish: false,
    echoCave: false,
  }
}

function emptyPersist(day = dateKey()): PersistShape {
  return {
    version: PERSIST_VERSION,
    dateKey: day,
    today: emptyToday(),
    lifetime: {
      totalStars: 0,
      stickers: [],
      unlockedWords: [],
      animalsIslandDays: 0,
    },
    familyId: getCurrentFamily().id,
    gates: emptyGates(),
    decorations: [],
    lastIslandDate: null,
  }
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const key = item.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase()
}

function normalizeWords(value: unknown): string[] {
  return asStringArray(value)
    .map((word) => normalizeWord(word))
    .filter(Boolean)
    .filter((word, index, list) => list.indexOf(word) === index)
}

function clampIslandDays(value: unknown): number {
  const n = Math.max(0, Math.floor(asFiniteNumber(value, 0)))
  return Math.min(ISLAND_DAY_CAP, n)
}

function normalizeChainStep(value: unknown, fallback: ChainStep = 'fish'): ChainStep {
  return typeof value === 'string' && CHAIN_STEPS.includes(value as ChainStep)
    ? (value as ChainStep)
    : fallback
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function migrateLegacyProgress(legacy: LegacyProgress, atlasWordsIn: string[]): PersistShape {
  const next = emptyPersist()
  next.lifetime.totalStars = Math.max(0, Math.floor(asFiniteNumber(legacy.stars, 0)))
  next.lifetime.animalsIslandDays = clampIslandDays(legacy.dayStars)
  next.lifetime.stickers = asStringArray(legacy.stickers)
  next.lifetime.unlockedWords = atlasWordsIn
  next.decorations = asStringArray(legacy.decorations)

  const daily = legacy.daily
  const legacyDate = typeof daily?.date === 'string' ? daily.date : next.dateKey
  next.familyId = typeof daily?.familyId === 'string' ? daily.familyId : next.familyId
  next.gates = {
    soundFish: Boolean(daily?.gates?.soundFish),
    echoCave: Boolean(daily?.gates?.echoCave),
  }

  const completed = Boolean(daily?.dayComplete) || (next.gates.soundFish && next.gates.echoCave)
  if (legacyDate === next.dateKey) {
    next.today.starsEarned = GATE_ORDER.filter((gate) => next.gates[gate]).length
    next.today.mainTaskDone = completed
    next.today.completed = completed
    next.today.chainStep = completed ? 'complete' : next.gates.soundFish ? 'echo' : 'fish'
  } else {
    next.dateKey = next.dateKey
    next.gates = emptyGates()
    next.today = emptyToday()
  }

  if (completed && next.lifetime.animalsIslandDays > 0) {
    next.lastIslandDate = legacyDate
  }

  return next
}

function normalizePersist(raw: unknown): PersistShape | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = raw as Partial<PersistShape> & LegacyProgress
  if (parsed.version === PERSIST_VERSION && parsed.today && parsed.lifetime) {
    const base = emptyPersist(typeof parsed.dateKey === 'string' ? parsed.dateKey : dateKey())
    const today = parsed.today
    const lifetime = parsed.lifetime
    return {
      version: PERSIST_VERSION,
      dateKey: base.dateKey,
      today: {
        starsEarned: Math.max(0, Math.floor(asFiniteNumber(today.starsEarned, 0))),
        starsGoal:
          today.starsGoal == null ? DEFAULT_STARS_GOAL : Math.max(0, Math.floor(asFiniteNumber(today.starsGoal, DEFAULT_STARS_GOAL))),
        mainTaskId: typeof today.mainTaskId === 'string' && today.mainTaskId ? today.mainTaskId : MAIN_TASK_ID,
        mainTaskDone: Boolean(today.mainTaskDone),
        focusWord:
          typeof today.focusWord === 'string' && today.focusWord.trim()
            ? normalizeWord(today.focusWord)
            : undefined,
        focusHits: Math.max(0, Math.floor(asFiniteNumber(today.focusHits, 0))),
        chainStep: normalizeChainStep(today.chainStep),
        completed: Boolean(today.completed),
      },
      lifetime: {
        totalStars: Math.max(0, Math.floor(asFiniteNumber(lifetime.totalStars, 0))),
        stickers: asStringArray(lifetime.stickers),
        unlockedWords: normalizeWords(lifetime.unlockedWords),
        animalsIslandDays: clampIslandDays(lifetime.animalsIslandDays),
      },
      familyId: typeof parsed.familyId === 'string' ? parsed.familyId : getCurrentFamily().id,
      gates: {
        soundFish: Boolean((parsed.gates as PersistShape['gates'] | undefined)?.soundFish),
        echoCave: Boolean((parsed.gates as PersistShape['gates'] | undefined)?.echoCave),
      },
      decorations: asStringArray(parsed.decorations),
      lastIslandDate: typeof parsed.lastIslandDate === 'string' ? parsed.lastIslandDate : null,
    }
  }
  if (!parsed.daily || typeof parsed.stars !== 'number') return null
  return migrateLegacyProgress(parsed, [])
}

function loadPersist(): PersistShape {
  const current = normalizePersist(readJson(PROGRESS_STORAGE_KEY))
  if (current) return applyDayRollover(current)

  const atlasRaw = readJson(LEGACY_ATLAS_KEY) as LegacyAtlas | null
  const atlasWordsIn = normalizeWords(atlasRaw?.words)

  const legacy = normalizePersist(readJson(LEGACY_PROGRESS_KEY))
  if (legacy) {
    const merged = new Set(legacy.lifetime.unlockedWords)
    for (const word of atlasWordsIn) merged.add(word)
    legacy.lifetime.unlockedWords = [...merged]
    return applyDayRollover(legacy)
  }

  if (atlasWordsIn.length) {
    const fresh = emptyPersist()
    fresh.lifetime.unlockedWords = atlasWordsIn
    return fresh
  }

  return emptyPersist()
}

function writeToday(target: TodayProgress, source: TodayProgress) {
  target.starsEarned = source.starsEarned
  target.starsGoal = source.starsGoal
  target.mainTaskId = source.mainTaskId
  target.mainTaskDone = source.mainTaskDone
  target.focusWord = source.focusWord
  target.focusHits = source.focusHits
  target.chainStep = source.chainStep
  target.completed = source.completed
}

function writeGates(target: Record<string, boolean>, source: Record<string, boolean>) {
  target.soundFish = Boolean(source.soundFish)
  target.echoCave = Boolean(source.echoCave)
}

function applyDayRollover(data: PersistShape): PersistShape {
  const today = dateKey()
  const familyId = getCurrentFamily().id
  if (data.dateKey !== today || data.familyId !== familyId) {
    data.dateKey = today
    data.familyId = familyId
    writeToday(data.today, emptyToday())
    writeGates(data.gates, emptyGates())
  }
  return data
}

export const persistState = reactive<PersistShape>(loadPersist())
export const progressStore = persistState

function persist() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(persistState))
  } catch {
    /* quota / private mode: keep memory state */
  }
}

export function ensureToday() {
  const today = dateKey()
  const familyId = getCurrentFamily().id
  if (persistState.dateKey !== today || persistState.familyId !== familyId) {
    persistState.dateKey = today
    persistState.familyId = familyId
    writeToday(persistState.today, emptyToday())
    writeGates(persistState.gates, emptyGates())
    persist()
  }
}

ensureToday()

try {
  if (!localStorage.getItem(PROGRESS_STORAGE_KEY)) persist()
} catch {
  /* ignore */
}

export function addStar(n = 1): number {
  ensureToday()
  const amount = Math.max(0, Math.floor(n))
  if (!amount) return 0
  persistState.today.starsEarned += amount
  persistState.lifetime.totalStars += amount
  persist()
  return amount
}

export function grantSticker(id: string): boolean {
  ensureToday()
  const key = id.trim()
  if (!key || persistState.lifetime.stickers.includes(key)) return false
  persistState.lifetime.stickers.push(key)
  persist()
  return true
}

export function markWordSeen(word: string): boolean {
  ensureToday()
  const key = normalizeWord(word)
  if (!key || !knownWords.has(key)) return false

  let changed = false
  if (persistState.today.focusWord && persistState.today.focusWord === key) {
    persistState.today.focusHits += 1
    changed = true
  }

  if (persistState.lifetime.unlockedWords.includes(key)) {
    if (changed) persist()
    return false
  }
  persistState.lifetime.unlockedWords.push(key)
  persist()
  return true
}

export function isWordUnlocked(word: string): boolean {
  return persistState.lifetime.unlockedWords.includes(normalizeWord(word))
}

export function advanceIslandDayOncePerDate(): boolean {
  ensureToday()
  const day = persistState.dateKey
  if (persistState.lastIslandDate === day) return false
  if (persistState.lifetime.animalsIslandDays >= ISLAND_DAY_CAP) {
    persistState.lastIslandDate = day
    persist()
    return false
  }
  persistState.lifetime.animalsIslandDays += 1
  persistState.lastIslandDate = day
  persist()
  return true
}

export function completeDailyIfReady(): boolean {
  ensureToday()
  if (persistState.today.completed) return false
  const ready = GATE_ORDER.every((gate) => persistState.gates[gate])
  if (!ready) return false
  persistState.today.completed = true
  persistState.today.mainTaskDone = true
  persistState.today.chainStep = 'complete'
  advanceIslandDayOncePerDate()
  persist()
  return true
}

function isKnownGate(gate: string): gate is GateId {
  return gate in GATE_CHAIN_NEXT
}

export function completeGate(
  gate: GateId | string,
  extras?: { sticker?: string; decoration?: string },
): { firstTime: boolean; starsAwarded: number } {
  ensureToday()
  const firstTime = !persistState.gates[gate]
  persistState.gates[gate] = true

  let starsAwarded = 0
  if (firstTime) {
    starsAwarded = addStar(1)
    if (extras?.sticker) grantSticker(extras.sticker)
    if (extras?.decoration && !persistState.decorations.includes(extras.decoration)) {
      persistState.decorations.push(extras.decoration)
    }
  }

  if (isKnownGate(gate)) {
    persistState.today.chainStep = maxChain(persistState.today.chainStep, GATE_CHAIN_NEXT[gate])
  }

  completeDailyIfReady()
  persist()
  return { firstTime, starsAwarded }
}

export function hasDecoration(id: string): boolean {
  return persistState.decorations.includes(id)
}

export function hasSticker(id: string): boolean {
  return persistState.lifetime.stickers.includes(id)
}

export function readCompatState(): ProgressState {
  return {
    stars: persistState.lifetime.totalStars,
    dayStars: persistState.lifetime.animalsIslandDays,
    decorations: persistState.decorations,
    stickers: persistState.lifetime.stickers,
    daily: {
      date: persistState.dateKey,
      familyId: persistState.familyId,
      gates: {
        soundFish: Boolean(persistState.gates.soundFish),
        echoCave: Boolean(persistState.gates.echoCave),
      },
      dayComplete: persistState.today.completed,
    },
  }
}
