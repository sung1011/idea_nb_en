import { reactive } from 'vue'
import {
  ANIMALS_CHAPTER_ID,
  DEFAULT_CHAPTER_ID,
  getChapterOrDefault,
  getFirstLevel,
  getLevel,
  getNextLevelDef,
  isKnownLevelId,
  listChapterLevels,
  playKindToGate,
  type LevelDef,
  type LevelStatus,
} from '../data/chapters'
import { CHAPTER_1_STICKER_ID, nextStickerId } from '../data/stickers'
import { MAIN_TASK_CHAPTER_1, MAIN_TASK_DAILY_CHAIN, MAIN_TASK_FISH_ECHO } from '../data/todayTasks'
import { getCurrentFamily, listAllFamilyWords } from '../data/phonicsFamily'

export const PROGRESS_STORAGE_KEY = 'starWords.v2'
const LEGACY_PROGRESS_KEY = 'starWords.v1'
const LEGACY_ATLAS_KEY = 'starWords.atlas.v1'
const PERSIST_VERSION = 3
export const ISLAND_DAY_CAP = 7
const SHANGHAI_TZ = 'Asia/Shanghai'

export type DailyGateId = 'flashFlip' | 'whackWord' | 'dragSort' | 'soundFish' | 'echoCave'
export type GateId = DailyGateId
export type WarmupKind = 'flashFlip' | 'whackWord'

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
  /** Catalog sticker id granted for finishing today's chain. Once per Shanghai day. */
  rewardSticker?: string
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

export type ChapterSave = {
  currentChapterId: string
  highestUnlocked: string
  levels: Record<string, LevelStatus>
  firstClearStars: string[]
  chapterStickers: string[]
  /** Shanghai dateKey of first clear, analytics only. */
  firstClearAt: Record<string, string>
  /** Day-complete page already celebrated chapter finish. */
  celebrated: boolean
}

export type ChapterLevelView = {
  id: string
  play: LevelDef['play']
  titleZh: string
  titleEn: string
  notes: string
  route: string
  status: LevelStatus
  firstClearStarGranted: boolean
}

export type ChapterProgressView = {
  chapterId: string
  currentChapterId: string
  titleZh: string
  titleEn: string
  highestUnlocked: string
  clearedCount: number
  levelTotal: number
  complete: boolean
  chapterStickerGranted: boolean
  chapterStickerId: string
  levels: ChapterLevelView[]
}

export type CompleteLevelResult = {
  accepted: boolean
  firstClear: boolean
  starsAwarded: number
  stickerGranted: boolean
  stickerId: string | null
  nextLevelId: string | null
  nextRoute: string | null
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
  chapter: ChapterSave
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

const MAIN_TASK_ID = MAIN_TASK_CHAPTER_1
const DEFAULT_STARS_GOAL = 6

export const ALL_GATES: DailyGateId[] = [
  'flashFlip',
  'whackWord',
  'dragSort',
  'soundFish',
  'echoCave',
]

/** @deprecated Prefer DAILY_CHAIN; kept for callers that still count phonics gates. */
export const GATE_ORDER: DailyGateId[] = ['soundFish', 'echoCave']

export const DAILY_CHAIN: Exclude<ChainStep, 'complete'>[] = ['warmup', 'drag', 'fish', 'echo']

export const GATE_ROUTES: Record<DailyGateId, string> = {
  flashFlip: '/flash-flip',
  whackWord: '/whack-word',
  dragSort: '/drag-sort',
  soundFish: '/sound-fish',
  echoCave: '/echo-cave',
}

export const GATE_TO_LEVEL: Record<GateId, string> = {
  flashFlip: 'ch1-1',
  whackWord: 'ch1-2',
  dragSort: 'ch1-3',
  soundFish: 'ch1-4',
  echoCave: 'ch1-5',
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

/** Asia/Shanghai calendar day, YYYY-MM-DD. Analytics / copy only — not a mainline lock. */
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

/** Stable per Shanghai calendar day; rotates through the current 15-word bank. */
export function pickRotatingFocusWord(day = dateKey(), words = getCurrentFamily().targets): string {
  if (!words.length) return 'cat'
  let n = 0
  for (let i = 0; i < day.length; i += 1) {
    n = (n * 33 + day.charCodeAt(i)) >>> 0
  }
  return normalizeWord(words[n % words.length])
}

function fillTodayTaskIfMissing(today: TodayProgress, day: string): boolean {
  let changed = false
  if (
    !today.mainTaskId ||
    today.mainTaskId === MAIN_TASK_FISH_ECHO ||
    today.mainTaskId === 'animalsIsland' ||
    today.mainTaskId === MAIN_TASK_DAILY_CHAIN
  ) {
    if (today.mainTaskId !== MAIN_TASK_ID) {
      today.mainTaskId = MAIN_TASK_ID
      changed = true
    }
  }
  if (!today.focusWord) {
    today.focusWord = pickRotatingFocusWord(day)
    changed = true
  }
  if ((today.starsGoal ?? 0) < DEFAULT_STARS_GOAL) {
    today.starsGoal = DEFAULT_STARS_GOAL
    changed = true
  }
  return changed
}

/** Even Shanghai day → Flash Flip; odd day → Whack Word. Legacy copy helper only. */
export function warmupKindForDate(day = dateKey()): WarmupKind {
  const n = Number.parseInt(day.slice(-2), 10)
  return Number.isFinite(n) && n % 2 === 0 ? 'flashFlip' : 'whackWord'
}

export function routeForChainStep(step: ChainStep, day = dateKey()): string {
  switch (step) {
    case 'warmup':
      return GATE_ROUTES[warmupKindForDate(day)]
    case 'drag':
      return GATE_ROUTES.dragSort
    case 'fish':
      return GATE_ROUTES.soundFish
    case 'echo':
      return GATE_ROUTES.echoCave
    case 'complete':
      return '/day-complete'
  }
}

export function routeForNextMainline(): string {
  const next = getNextLevel()
  if (next) return next.route
  return '/day-complete'
}

export function routeAfterGate(gate: GateId, _day = dateKey()): string {
  const levelId = GATE_TO_LEVEL[gate]
  const next = levelId ? getNextLevelDef(levelId) : null
  if (next && isLevelUnlocked(next.id) && !isLevelCleared(next.id)) return next.route
  return routeForNextMainline()
}

export function isWarmupDone(gates: Record<string, boolean>): boolean {
  return Boolean(gates.flashFlip || gates.whackWord)
}

export function isChainStepDone(
  step: Exclude<ChainStep, 'complete'>,
  gates: Record<string, boolean>,
): boolean {
  if (step === 'warmup') return isWarmupDone(gates)
  if (step === 'drag') return Boolean(gates.dragSort)
  if (step === 'fish') return Boolean(gates.soundFish)
  return Boolean(gates.echoCave)
}

export function countChainDone(gates: Record<string, boolean>): number {
  return DAILY_CHAIN.filter((step) => isChainStepDone(step, gates)).length
}

function normalizeGates(raw?: Partial<Record<string, unknown>> | null): Record<DailyGateId, boolean> {
  const next = emptyGates()
  if (!raw) return next
  for (const id of ALL_GATES) {
    next[id] = Boolean(raw[id])
  }
  return next
}

function emptyToday(day = dateKey()): TodayProgress {
  return {
    starsEarned: 0,
    starsGoal: DEFAULT_STARS_GOAL,
    mainTaskId: MAIN_TASK_ID,
    mainTaskDone: false,
    focusWord: pickRotatingFocusWord(day),
    focusHits: 0,
    chainStep: 'warmup',
    completed: false,
  }
}

function emptyGates(): Record<DailyGateId, boolean> {
  return {
    flashFlip: false,
    whackWord: false,
    dragSort: false,
    soundFish: false,
    echoCave: false,
  }
}

function emptyChapterLevels(chapterId = DEFAULT_CHAPTER_ID): Record<string, LevelStatus> {
  const levels = listChapterLevels(chapterId)
  const out: Record<string, LevelStatus> = {}
  levels.forEach((item, index) => {
    out[item.id] = index === 0 ? 'unlocked' : 'locked'
  })
  return out
}

function emptyChapterSave(chapterId = DEFAULT_CHAPTER_ID): ChapterSave {
  const first = getFirstLevel(chapterId)
  return {
    currentChapterId: chapterId,
    highestUnlocked: first.id,
    levels: emptyChapterLevels(chapterId),
    firstClearStars: [],
    chapterStickers: [],
    firstClearAt: {},
    celebrated: false,
  }
}

function emptyPersist(day = dateKey()): PersistShape {
  return {
    version: PERSIST_VERSION,
    dateKey: day,
    today: emptyToday(day),
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
    chapter: emptyChapterSave(),
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

function normalizeChainStep(value: unknown, fallback: ChainStep = 'warmup'): ChainStep {
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

function isLevelStatus(value: unknown): value is LevelStatus {
  return value === 'locked' || value === 'unlocked' || value === 'cleared'
}

function repairChapterInvariants(save: ChapterSave): ChapterSave {
  const chapterId = getChapterOrDefault(save.currentChapterId).id
  save.currentChapterId = chapterId
  const defs = listChapterLevels(chapterId)
  const nextLevels: Record<string, LevelStatus> = emptyChapterLevels(chapterId)
  for (const def of defs) {
    const status = save.levels[def.id]
    nextLevels[def.id] = isLevelStatus(status) ? status : nextLevels[def.id]
  }

  let highestCleared = -1
  for (let i = 0; i < defs.length; i += 1) {
    if (nextLevels[defs[i].id] === 'cleared') highestCleared = i
  }
  for (let i = 0; i <= highestCleared; i += 1) {
    nextLevels[defs[i].id] = 'cleared'
  }
  const unlockIdx = highestCleared + 1
  if (unlockIdx >= 0 && unlockIdx < defs.length) {
    nextLevels[defs[unlockIdx].id] = 'unlocked'
  }
  for (let i = unlockIdx + 1; i < defs.length; i += 1) {
    nextLevels[defs[i].id] = 'locked'
  }
  if (highestCleared < 0) {
    nextLevels[defs[0].id] = 'unlocked'
  }

  save.levels = nextLevels
  const unlockedIdx = Math.max(0, Math.min(defs.length - 1, highestCleared + 1))
  save.highestUnlocked = defs[highestCleared >= defs.length - 1 ? defs.length - 1 : unlockedIdx].id

  const knownIds = new Set(defs.map((item) => item.id))
  save.firstClearStars = save.firstClearStars.filter((id) => knownIds.has(id))
  save.chapterStickers = save.chapterStickers.filter(Boolean)
  const firstClearAt: Record<string, string> = {}
  for (const [id, when] of Object.entries(save.firstClearAt)) {
    if (knownIds.has(id) && typeof when === 'string' && when) firstClearAt[id] = when
  }
  save.firstClearAt = firstClearAt
  save.celebrated = Boolean(save.celebrated)
  return save
}

type DailyHints = {
  gates: Record<string, boolean>
  today: TodayProgress
  lifetime: LifetimeProgress
  lastIslandDate: string | null
}

/**
 * Map old daily-chain saves into Chapter 1.
 * Finished island-day / day-complete → ch1-1..ch1-5 cleared, ch1-6 unlocked.
 * Partial same-session gates map in order (warmup credits ch1-1).
 * Atlas / stickers / lifetime stars stay as-is. No chapter sticker (finale is new).
 */
function migrateDailyToChapter(daily: DailyHints): ChapterSave {
  const save = emptyChapterSave()
  const defs = listChapterLevels(ANIMALS_CHAPTER_ID)
  const cleared = new Set<string>()

  if (daily.gates.flashFlip) cleared.add('ch1-1')
  if (daily.gates.whackWord) cleared.add('ch1-2')
  if (daily.gates.dragSort) cleared.add('ch1-3')
  if (daily.gates.soundFish) cleared.add('ch1-4')
  if (daily.gates.echoCave) cleared.add('ch1-5')

  const finishedOldChain =
    daily.today.completed ||
    daily.today.chainStep === 'complete' ||
    daily.lifetime.animalsIslandDays > 0 ||
    Boolean(daily.lastIslandDate)

  if (finishedOldChain) {
    for (const id of ['ch1-1', 'ch1-2', 'ch1-3', 'ch1-4', 'ch1-5']) cleared.add(id)
  } else if (isWarmupDone(daily.gates)) {
    cleared.add('ch1-1')
    if (daily.gates.whackWord) cleared.add('ch1-2')
  }

  let maxIdx = -1
  for (let i = 0; i < defs.length; i += 1) {
    if (cleared.has(defs[i].id)) maxIdx = i
  }
  const when = daily.lastIslandDate || dateKey()
  for (let i = 0; i <= maxIdx; i += 1) {
    const id = defs[i].id
    save.levels[id] = 'cleared'
    if (!save.firstClearStars.includes(id)) save.firstClearStars.push(id)
    save.firstClearAt[id] = when
  }
  return repairChapterInvariants(save)
}

function normalizeChapterSave(raw: unknown, daily: DailyHints): ChapterSave {
  if (!raw || typeof raw !== 'object') return migrateDailyToChapter(daily)
  const parsed = raw as Partial<ChapterSave>
  if (!parsed.levels || typeof parsed.levels !== 'object') return migrateDailyToChapter(daily)

  const chapterId =
    typeof parsed.currentChapterId === 'string' && parsed.currentChapterId
      ? parsed.currentChapterId
      : DEFAULT_CHAPTER_ID
  const first = getFirstLevel(chapterId)
  const levels: Record<string, LevelStatus> = emptyChapterLevels(chapterId)
  for (const [id, status] of Object.entries(parsed.levels)) {
    if (isLevelStatus(status)) levels[id] = status
  }

  return repairChapterInvariants({
    currentChapterId: chapterId,
    highestUnlocked: typeof parsed.highestUnlocked === 'string' ? parsed.highestUnlocked : first.id,
    levels,
    firstClearStars: asStringArray(parsed.firstClearStars),
    chapterStickers: asStringArray(parsed.chapterStickers),
    firstClearAt:
      parsed.firstClearAt && typeof parsed.firstClearAt === 'object' ? { ...parsed.firstClearAt } : {},
    celebrated: Boolean(parsed.celebrated),
  })
}

function chainStepForLevel(level: LevelDef | null, complete: boolean): ChainStep {
  if (complete) return 'complete'
  if (!level) return 'complete'
  if (level.play === 'flashFlip' || level.play === 'whackWord') return 'warmup'
  if (level.play === 'dragSort') return 'drag'
  if (level.play === 'wordFish') return 'fish'
  if (level.play === 'echo') return 'echo'
  return 'complete'
}

function readLevelStatus(save: ChapterSave, id: string): LevelStatus {
  return save.levels[id] ?? 'locked'
}

function isChapterComplete(save: ChapterSave, chapterId = save.currentChapterId): boolean {
  return listChapterLevels(chapterId).every((item) => save.levels[item.id] === 'cleared')
}

function viewFromChapter(save: ChapterSave, chapterId = save.currentChapterId): ChapterProgressView {
  const chapter = getChapterOrDefault(chapterId)
  const levels: ChapterLevelView[] = chapter.levels.map((item) => ({
    id: item.id,
    play: item.play,
    titleZh: item.titleZh,
    titleEn: item.titleEn,
    notes: item.notes,
    route: item.route,
    status: readLevelStatus(save, item.id),
    firstClearStarGranted: save.firstClearStars.includes(item.id),
  }))
  const clearedCount = levels.filter((item) => item.status === 'cleared').length
  return {
    chapterId: chapter.id,
    currentChapterId: save.currentChapterId,
    titleZh: chapter.titleZh,
    titleEn: chapter.titleEn,
    highestUnlocked: save.highestUnlocked,
    clearedCount,
    levelTotal: levels.length,
    complete: clearedCount === levels.length && levels.length > 0,
    chapterStickerGranted: save.chapterStickers.includes(chapter.id),
    chapterStickerId: chapter.stickerId,
    levels,
  }
}

function nextUnlockedLevel(save: ChapterSave, chapterId = save.currentChapterId): LevelDef | null {
  const defs = listChapterLevels(chapterId)
  for (const def of defs) {
    if (readLevelStatus(save, def.id) === 'unlocked') return def
  }
  return null
}

function syncGatesFromChapter(target: Record<string, boolean>, save: ChapterSave) {
  for (const def of listChapterLevels(save.currentChapterId)) {
    const gate = playKindToGate(def.play)
    if (gate) target[gate] = save.levels[def.id] === 'cleared'
  }
}

function syncTodayAndGatesFromChapter(data: PersistShape) {
  const view = viewFromChapter(data.chapter)
  const next = nextUnlockedLevel(data.chapter)
  data.today.starsGoal = view.levelTotal
  data.today.starsEarned = view.clearedCount
  data.today.mainTaskId = MAIN_TASK_ID
  data.today.mainTaskDone = view.complete
  data.today.completed = view.complete
  data.today.chainStep = chainStepForLevel(next, view.complete)
  if (view.complete && view.chapterStickerGranted && !data.today.rewardSticker) {
    data.today.rewardSticker = view.chapterStickerId
  }
  syncGatesFromChapter(data.gates, data.chapter)
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
  next.gates = normalizeGates(daily?.gates)

  const completed = Boolean(daily?.dayComplete) || (next.gates.soundFish && next.gates.echoCave)
  if (legacyDate === next.dateKey) {
    next.today.starsEarned = countChainDone(next.gates)
    next.today.mainTaskDone = completed
    next.today.completed = completed
    next.today.chainStep = completed ? 'complete' : next.gates.soundFish ? 'echo' : 'warmup'
  } else {
    next.dateKey = next.dateKey
    next.gates = emptyGates()
    next.today = emptyToday()
  }

  if (completed && next.lifetime.animalsIslandDays > 0) {
    next.lastIslandDate = legacyDate
  }

  next.chapter = migrateDailyToChapter({
    gates: completed && legacyDate !== dateKey() ? emptyGates() : next.gates,
    today: next.today,
    lifetime: next.lifetime,
    lastIslandDate: next.lastIslandDate,
  })
  if (completed || next.lifetime.animalsIslandDays > 0) {
    next.chapter = migrateDailyToChapter({
      gates: next.gates,
      today: { ...next.today, completed: true },
      lifetime: next.lifetime,
      lastIslandDate: next.lastIslandDate ?? legacyDate,
    })
  }
  syncTodayAndGatesFromChapter(next)
  return next
}

function normalizePersist(raw: unknown): PersistShape | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = raw as Partial<PersistShape> & LegacyProgress
  if ((parsed.version === 2 || parsed.version === 3 || parsed.version === PERSIST_VERSION) && parsed.today && parsed.lifetime) {
    const base = emptyPersist(typeof parsed.dateKey === 'string' ? parsed.dateKey : dateKey())
    const today = parsed.today
    const lifetime = parsed.lifetime
    const next: PersistShape = {
      version: PERSIST_VERSION,
      dateKey: base.dateKey,
      today: {
        starsEarned: Math.max(0, Math.floor(asFiniteNumber(today.starsEarned, 0))),
        starsGoal:
          today.starsGoal == null
            ? DEFAULT_STARS_GOAL
            : Math.max(0, Math.floor(asFiniteNumber(today.starsGoal, DEFAULT_STARS_GOAL))),
        mainTaskId: typeof today.mainTaskId === 'string' && today.mainTaskId ? today.mainTaskId : MAIN_TASK_ID,
        mainTaskDone: Boolean(today.mainTaskDone),
        focusWord:
          typeof today.focusWord === 'string' && today.focusWord.trim()
            ? normalizeWord(today.focusWord)
            : undefined,
        focusHits: Math.max(0, Math.floor(asFiniteNumber(today.focusHits, 0))),
        chainStep: normalizeChainStep(today.chainStep),
        completed: Boolean(today.completed),
        rewardSticker:
          typeof today.rewardSticker === 'string' && today.rewardSticker.trim()
            ? today.rewardSticker.trim()
            : undefined,
      },
      lifetime: {
        totalStars: Math.max(0, Math.floor(asFiniteNumber(lifetime.totalStars, 0))),
        stickers: asStringArray(lifetime.stickers),
        unlockedWords: normalizeWords(lifetime.unlockedWords),
        animalsIslandDays: clampIslandDays(lifetime.animalsIslandDays),
      },
      familyId: typeof parsed.familyId === 'string' ? parsed.familyId : getCurrentFamily().id,
      gates: normalizeGates(parsed.gates),
      decorations: asStringArray(parsed.decorations),
      lastIslandDate: typeof parsed.lastIslandDate === 'string' ? parsed.lastIslandDate : null,
      chapter: emptyChapterSave(),
    }
    next.chapter = normalizeChapterSave(parsed.chapter, {
      gates: next.gates,
      today: next.today,
      lifetime: next.lifetime,
      lastIslandDate: next.lastIslandDate,
    })
    return next
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
  if (source.rewardSticker) target.rewardSticker = source.rewardSticker
  else delete target.rewardSticker
}

function writeGates(target: Record<string, boolean>, source: Record<string, boolean>) {
  for (const id of ALL_GATES) {
    target[id] = Boolean(source[id])
  }
}

function writeChapter(target: ChapterSave, source: ChapterSave) {
  target.currentChapterId = source.currentChapterId
  target.highestUnlocked = source.highestUnlocked
  for (const key of Object.keys(target.levels)) {
    delete target.levels[key]
  }
  Object.assign(target.levels, source.levels)
  target.firstClearStars.splice(0, target.firstClearStars.length, ...source.firstClearStars)
  target.chapterStickers.splice(0, target.chapterStickers.length, ...source.chapterStickers)
  for (const key of Object.keys(target.firstClearAt)) {
    delete target.firstClearAt[key]
  }
  Object.assign(target.firstClearAt, source.firstClearAt)
  target.celebrated = source.celebrated
}

function applyDayRollover(data: PersistShape): PersistShape {
  const today = dateKey()
  const familyId = getCurrentFamily().id
  if (data.dateKey !== today || data.familyId !== familyId) {
    data.dateKey = today
    data.familyId = familyId
    const focusHits = data.today.focusHits
    const focusWord = data.today.focusWord
    writeToday(data.today, emptyToday(today))
    // Keep a familiar focus word across midnight if the child already has one.
    if (focusWord) data.today.focusWord = focusWord
    data.today.focusHits = focusHits
    // Never rewind chapter / mainline on a new Shanghai day.
  }
  data.chapter = repairChapterInvariants(data.chapter)
  syncTodayAndGatesFromChapter(data)
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

function removeProgressKeys() {
  const known = [PROGRESS_STORAGE_KEY, LEGACY_PROGRESS_KEY, LEGACY_ATLAS_KEY]
  try {
    for (const key of known) localStorage.removeItem(key)
    const leftover: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith('starWords.')) leftover.push(key)
    }
    for (const key of leftover) localStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

function writeLifetime(target: LifetimeProgress, source: LifetimeProgress) {
  target.totalStars = source.totalStars
  target.stickers = [...source.stickers]
  target.unlockedWords = [...source.unlockedWords]
  target.animalsIslandDays = source.animalsIslandDays
}

/** Wipe player progress only. Word-card images stay. */
export function resetAllProgress(): void {
  removeProgressKeys()
  const fresh = emptyPersist()
  persistState.version = fresh.version
  persistState.dateKey = fresh.dateKey
  writeToday(persistState.today, fresh.today)
  writeLifetime(persistState.lifetime, fresh.lifetime)
  persistState.familyId = fresh.familyId
  for (const key of Object.keys(persistState.gates)) {
    delete persistState.gates[key]
  }
  writeGates(persistState.gates, fresh.gates)
  persistState.decorations = []
  persistState.lastIslandDate = null
  writeChapter(persistState.chapter, fresh.chapter)
  persist()
}

export function ensureToday() {
  const today = dateKey()
  const familyId = getCurrentFamily().id
  let changed = false
  if (persistState.dateKey !== today || persistState.familyId !== familyId) {
    persistState.dateKey = today
    persistState.familyId = familyId
    const focusWord = persistState.today.focusWord
    const focusHits = persistState.today.focusHits
    writeToday(persistState.today, emptyToday(today))
    if (focusWord) persistState.today.focusWord = focusWord
    persistState.today.focusHits = focusHits
    changed = true
  }
  persistState.chapter = repairChapterInvariants(persistState.chapter)
  syncTodayAndGatesFromChapter(persistState)
  if (fillTodayTaskIfMissing(persistState.today, persistState.dateKey)) {
    changed = true
  }
  persist()
  return changed
}

/** Fill mainTaskId + rotating focusWord for the Shanghai day if the store left them empty. */
export function ensureTodayTask() {
  ensureToday()
}

ensureToday()

try {
  persist()
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

/**
 * Atlas unlock on a meaningful play success (correct tap / match / catch /
 * hear-pass). Unknown words ignored. No daily stars. Cleared by reset-all.
 */
export function unlockWord(word: string): boolean {
  return markWordSeen(word)
}

export function isWordUnlocked(word: string): boolean {
  return persistState.lifetime.unlockedWords.includes(normalizeWord(word))
}

export function isLevelUnlocked(id: string): boolean {
  if (!isKnownLevelId(id)) return false
  const status = persistState.chapter.levels[id]
  return status === 'unlocked' || status === 'cleared'
}

export function isLevelCleared(id: string): boolean {
  if (!isKnownLevelId(id)) return false
  return persistState.chapter.levels[id] === 'cleared'
}

export function getChapterProgress(chapterId?: string): ChapterProgressView {
  return viewFromChapter(persistState.chapter, chapterId ?? persistState.chapter.currentChapterId)
}

export function getNextLevel(chapterId?: string): LevelDef | null {
  return nextUnlockedLevel(persistState.chapter, chapterId ?? persistState.chapter.currentChapterId)
}

export function getCurrentChapterId(): string {
  return persistState.chapter.currentChapterId
}

export function completeLevel(id: string): CompleteLevelResult {
  ensureToday()
  const empty: CompleteLevelResult = {
    accepted: false,
    firstClear: false,
    starsAwarded: 0,
    stickerGranted: false,
    stickerId: null,
    nextLevelId: getNextLevel()?.id ?? null,
    nextRoute: routeForNextMainline(),
  }
  const def = getLevel(id)
  if (!def) return empty
  if (!isLevelUnlocked(id) && !isLevelCleared(id)) return empty

  const already = isLevelCleared(id)
  if (already) {
    const next = getNextLevel()
    return {
      accepted: true,
      firstClear: false,
      starsAwarded: 0,
      stickerGranted: false,
      stickerId: def.chapterStickerId && persistState.chapter.chapterStickers.includes(def.chapterId)
        ? def.chapterStickerId
        : null,
      nextLevelId: next?.id ?? null,
      nextRoute: next?.route ?? '/day-complete',
    }
  }

  persistState.chapter.levels[id] = 'cleared'
  if (!persistState.chapter.firstClearStars.includes(id)) {
    persistState.chapter.firstClearStars.push(id)
  }
  persistState.chapter.firstClearAt[id] = persistState.dateKey

  const following = getNextLevelDef(id)
  if (following) {
    persistState.chapter.levels[following.id] = 'unlocked'
    persistState.chapter.highestUnlocked = following.id
  } else {
    persistState.chapter.highestUnlocked = id
  }
  persistState.chapter.currentChapterId = def.chapterId
  persistState.chapter = repairChapterInvariants(persistState.chapter)

  const starsAwarded = Math.max(0, def.firstClearStars)
  if (starsAwarded) {
    persistState.lifetime.totalStars += starsAwarded
  }

  let stickerGranted = false
  let stickerId: string | null = def.chapterStickerId ?? null
  if (def.chapterStickerId && !persistState.chapter.chapterStickers.includes(def.chapterId)) {
    persistState.chapter.chapterStickers.push(def.chapterId)
    stickerGranted = grantSticker(def.chapterStickerId)
    stickerId = def.chapterStickerId
    persistState.chapter.celebrated = false
  }

  persistState.today.chainStep = maxChain(
    persistState.today.chainStep,
    chainStepForLevel(following, !following),
  )
  syncTodayAndGatesFromChapter(persistState)
  persist()

  const next = getNextLevel()
  return {
    accepted: true,
    firstClear: true,
    starsAwarded,
    stickerGranted,
    stickerId,
    nextLevelId: next?.id ?? null,
    nextRoute: next?.route ?? '/day-complete',
  }
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
  if (!isChapterComplete(persistState.chapter)) return false
  if (persistState.today.completed) return false
  persistState.today.completed = true
  persistState.today.mainTaskDone = true
  persistState.today.chainStep = 'complete'
  persist()
  return true
}

export type DayCompleteClaim = {
  ready: boolean
  freshClaim: boolean
  firstClear: boolean
  islandAdvanced: boolean
  stickerGranted: boolean
  stickerId: string | null
}

function canClaimDayComplete(): boolean {
  return isChapterComplete(persistState.chapter) || persistState.today.completed
}

function grantDailyStickerOnce(): { stickerId: string | null; granted: boolean; fresh: boolean } {
  const existing = persistState.today.rewardSticker
  if (existing) {
    return { stickerId: existing, granted: false, fresh: false }
  }
  const chapterSticker = persistState.chapter.chapterStickers.includes(ANIMALS_CHAPTER_ID)
    ? CHAPTER_1_STICKER_ID
    : null
  if (chapterSticker) {
    persistState.today.rewardSticker = chapterSticker
    persist()
    return { stickerId: chapterSticker, granted: false, fresh: false }
  }
  const stickerId = nextStickerId(persistState.lifetime.stickers, persistState.dateKey)
  const granted = grantSticker(stickerId)
  persistState.today.rewardSticker = stickerId
  persist()
  return { stickerId, granted, fresh: true }
}

/** Chapter finale (or legacy echo) finish: celebrate once. Island-day tick is analytics only. */
export function claimDayCompleteRewards(): DayCompleteClaim {
  ensureToday()
  if (!canClaimDayComplete()) {
    return {
      ready: false,
      freshClaim: false,
      firstClear: false,
      islandAdvanced: false,
      stickerGranted: false,
      stickerId: persistState.today.rewardSticker ?? null,
    }
  }

  const firstClear = completeDailyIfReady()
  const wasCelebrated = persistState.chapter.celebrated
  const chapterStickerOwned = persistState.chapter.chapterStickers.includes(ANIMALS_CHAPTER_ID)
  const sticker = grantDailyStickerOnce()
  if (chapterStickerOwned && !wasCelebrated) {
    persistState.chapter.celebrated = true
    persist()
  } else if (!wasCelebrated && firstClear) {
    persistState.chapter.celebrated = true
    persist()
  }
  const islandTick = advanceIslandDayOncePerDate()
  const islandAdvanced =
    islandTick ||
    (sticker.fresh && persistState.lastIslandDate === persistState.dateKey && persistState.lifetime.animalsIslandDays > 0)

  const freshClaim = !wasCelebrated
  return {
    ready: true,
    freshClaim,
    firstClear: firstClear || freshClaim,
    islandAdvanced,
    stickerGranted: sticker.granted || (chapterStickerOwned && freshClaim),
    stickerId: sticker.stickerId ?? (chapterStickerOwned ? CHAPTER_1_STICKER_ID : null),
  }
}

function isKnownGate(gate: string): gate is GateId {
  return gate in GATE_CHAIN_NEXT
}

export function completeGate(
  gate: GateId | string,
  extras?: { sticker?: string; decoration?: string },
): { firstTime: boolean; starsAwarded: number } {
  ensureToday()
  if (!isKnownGate(gate)) {
    return { firstTime: false, starsAwarded: 0 }
  }

  const levelId = GATE_TO_LEVEL[gate]
  const result = completeLevel(levelId)

  if (result.firstClear) {
    if (extras?.sticker) grantSticker(extras.sticker)
    if (extras?.decoration && !persistState.decorations.includes(extras.decoration)) {
      persistState.decorations.push(extras.decoration)
    }
  }

  persist()
  return { firstTime: result.firstClear, starsAwarded: result.starsAwarded }
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
      gates: normalizeGates(persistState.gates),
      dayComplete: persistState.today.completed,
    },
  }
}
