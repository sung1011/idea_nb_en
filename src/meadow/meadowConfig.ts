import { CHAPTERS } from '../data/chapters'

/** Chapter order matches `CHAPTERS`. */
export const MEADOW_ROSTER = [
  { id: 'bunny', name: 'bunny', zh: '兔子' },
  { id: 'leopard', name: 'leopard', zh: '豹子' },
  { id: 'pig', name: 'pig', zh: '小猪' },
  { id: 'hen', name: 'hen', zh: '母鸡' },
  { id: 'fox', name: 'fox', zh: '狐狸' },
  { id: 'bear', name: 'bear', zh: '小熊' },
  { id: 'yak', name: 'yak', zh: '牦牛' },
  { id: 'frog', name: 'frog', zh: '青蛙' },
  { id: 'duck', name: 'duck', zh: '鸭子' },
  { id: 'ox', name: 'ox', zh: '牛' },
  { id: 'bird', name: 'bird', zh: '小鸟' },
  { id: 'panda', name: 'panda', zh: '熊猫' },
] as const

export type MeadowAnimalId = (typeof MEADOW_ROSTER)[number]['id']

export type MeadowAnimalDef = {
  id: MeadowAnimalId
  name: string
  zh: string
  chapterId: string
  chapterNo: number
}

export type MeadowAccessoryId = 'none' | 'hat' | 'bow' | 'scarf'

/** Center of an accessory, as a percent of the 384×384 sprite, plus scale and rotation. */
export type MeadowAnchor = {
  x: number
  y: number
  scale: number
  rot: number
}

export type MeadowAnimalSave = {
  id: MeadowAnimalId
  /** Feet position, percent of the play field. */
  x: number
  y: number
  /** Intimacy, 0–5. Only goes up. Missing on old saves loads as 0. */
  hearts: number
  /** Worn accessory. `none` until the child picks one at 3 hearts. */
  accessory: MeadowAccessoryId
  /**
   * Epoch ms when this animal last became full.
   * Missing on older saves: treated as full at the moment that save is read.
   */
  lastFedAt: number
}

export type MeadowSave = {
  /** Parent toggle 「随时进星星草地」. Default off. */
  openAnytime: boolean
  /** Same day key as the rest of the app (Asia/Shanghai). */
  clearsDate: string
  clearsToday: number
  owned: MeadowAnimalSave[]
  /** Chapter ids waiting to hatch, in chapter order. */
  pendingEggs: string[]
  /** Set when a chapter just cleared, so the celebration screen can hatch it. */
  ceremonyChapterId: string | null
  /** GM skip added onto the hunger clock. Real feeding does not clear this. */
  hungerSkipMs: number
  /** Highest wall-clock ms observed. A backwards device clock cannot lower it. */
  clockMark: number
}

/** Real time from full to hungry. */
export const MEADOW_HUNGER_MS = 12 * 60 * 60 * 1000

/** Highest `Date.now()` seen in this session. Not written on the animation frame. */
let sessionClock = 0
let meadowNormalizeDirty = false

export function takeMeadowNormalizeDirty(): boolean {
  const dirty = meadowNormalizeDirty
  meadowNormalizeDirty = false
  return dirty
}

function wallClock(now: number): number {
  const wall = Number.isFinite(now) ? now : 0
  if (wall > sessionClock) sessionClock = wall
  return Math.max(0, sessionClock)
}

/** Effective hunger clock: high-water wall time plus any GM skip. Elapsed never goes negative. */
export function meadowEffectiveNow(
  meadow: { clockMark: number; hungerSkipMs: number },
  now = Date.now(),
): number {
  const mark = Math.max(0, meadow.clockMark || 0, wallClock(now))
  const skip = Math.max(0, meadow.hungerSkipMs || 0)
  return mark + skip
}

/** Clock value worth persisting. Does not itself write the save. */
export function meadowClockMark(meadow: { clockMark: number }, now = Date.now()): number {
  return Math.max(0, meadow.clockMark || 0, wallClock(now))
}

/** 1 just fed, 0 once `MEADOW_HUNGER_MS` of effective time has passed. */
export function meadowFullness(lastFedAt: number, effectiveNow: number): number {
  const elapsed = Math.max(0, effectiveNow - lastFedAt)
  const left = 1 - elapsed / MEADOW_HUNGER_MS
  if (left <= 0) return 0
  if (left >= 1) return 1
  return left
}

export function animalIsHungry(lastFedAt: number, effectiveNow: number): boolean {
  return meadowFullness(lastFedAt, effectiveNow) <= 0
}

const rosterIds = new Set<string>(MEADOW_ROSTER.map((item) => item.id))

export function meadowRoster(): MeadowAnimalDef[] {
  return MEADOW_ROSTER.map((item, index) => ({
    id: item.id,
    name: item.name,
    zh: item.zh,
    chapterId: CHAPTERS[index]?.id ?? `ch${index + 1}`,
    chapterNo: index + 1,
  }))
}

export function animalZh(id: string): string {
  return MEADOW_ROSTER.find((item) => item.id === id)?.zh ?? ''
}

export function animalByChapter(chapterId: string): MeadowAnimalDef | null {
  return meadowRoster().find((item) => item.chapterId === chapterId) ?? null
}

export function animalById(id: string): MeadowAnimalDef | null {
  return meadowRoster().find((item) => item.id === id) ?? null
}

export function meadowSrc(file: string): string {
  return `${import.meta.env.BASE_URL}meadow/${file}.webp`
}

export function introLine(name: string): string {
  const article = /^[aeiou]/i.test(name) ? 'an' : 'a'
  return `Hi! I am ${article} ${name}!`
}

/** Chance a tap shows a chapter bubble instead of the usual hello. */
export const BUBBLE_CHANCE = 0.25
/** Among bubbles, this fraction are words; the rest are sentences. */
export const BUBBLE_WORD_SPLIT = 0.5
/** How long a bubble stays before it pops away. */
export const BUBBLE_HOLD_MS = 3000

export type MeadowBubbleWord = {
  kind: 'word'
  key: string
  speak: string
  label: string
  numeral?: number
}

export type MeadowBubbleSentence = {
  kind: 'sentence'
  key: string
  speak: string
  text: string
}

export type MeadowBubbleItem = MeadowBubbleWord | MeadowBubbleSentence

type BubblePool = {
  words: MeadowBubbleWord[]
  sentences: MeadowBubbleSentence[]
}

function pushBubbleWord(list: MeadowBubbleWord[], seen: Set<string>, word: string, numeral?: number) {
  const label = word.trim()
  const key = numeral == null ? `w:${label.toLowerCase()}` : `n:${numeral}`
  if (!label || seen.has(key)) return
  seen.add(key)
  list.push({ kind: 'word', key, speak: label, label, numeral })
}

function pushBubbleSentence(list: MeadowBubbleSentence[], seen: Set<string>, text: string) {
  const line = text.trim()
  const key = `s:${line.toLowerCase()}`
  if (!line || seen.has(key)) return
  seen.add(key)
  list.push({ kind: 'sentence', key, speak: line, text: line })
}

function poolForChapter(chapterId: string): BubblePool {
  const chapter = CHAPTERS.find((item) => item.id === chapterId)
  const words: MeadowBubbleWord[] = []
  const sentences: MeadowBubbleSentence[] = []
  const seenWords = new Set<string>()
  const seenSentences = new Set<string>()
  if (!chapter) return { words, sentences }
  for (const lesson of chapter.lessons) {
    if (lesson.sentence) pushBubbleSentence(sentences, seenSentences, lesson.sentence)
    const numbers = lesson.levels.flatMap((level) => level.numbers ?? [])
    if (numbers.length) {
      for (const item of numbers) {
        pushBubbleWord(words, seenWords, item.word, item.value)
        pushBubbleSentence(sentences, seenSentences, item.sentence)
      }
    } else {
      for (const word of lesson.words) pushBubbleWord(words, seenWords, word)
    }
    for (const level of lesson.levels) {
      for (const page of level.storyPages ?? []) pushBubbleSentence(sentences, seenSentences, page.line)
    }
  }
  return { words, sentences }
}

const bubblePools = new Map<string, BubblePool>(CHAPTERS.map((chapter) => [chapter.id, poolForChapter(chapter.id)]))

function pickFresh<T extends { key: string }>(list: T[], previousKey: string, random: () => number): T {
  const fresh = list.filter((item) => item.key !== previousKey)
  const choices = fresh.length ? fresh : list
  return choices[Math.floor(random() * choices.length)]
}

/**
 * 25% of taps. Half of those are a chapter word, half a chapter sentence.
 * Empty chapters return null so the usual hello still plays.
 */
export function pickMeadowBubble(
  chapterId: string,
  previousKey = '',
  random: () => number = Math.random,
): MeadowBubbleItem | null {
  const pool = bubblePools.get(chapterId)
  if (!pool || (!pool.words.length && !pool.sentences.length)) return null
  if (random() >= BUBBLE_CHANCE) return null
  const preferWord = random() < BUBBLE_WORD_SPLIT
  const primary: MeadowBubbleItem[] = preferWord ? pool.words : pool.sentences
  const backup: MeadowBubbleItem[] = preferWord ? pool.sentences : pool.words
  const list = primary.length ? primary : backup
  if (!list.length) return null
  return pickFresh(list, previousKey, random)
}

export function spreadSpot(index: number): { x: number; y: number } {
  const col = index % 4
  const row = Math.floor(index / 4)
  return { x: 18 + col * 21, y: 28 + row * 22 }
}

export function centerSpot(): { x: number; y: number } {
  return { x: 50, y: 62 }
}

export function emptyMeadow(): MeadowSave {
  return {
    openAnytime: false,
    clearsDate: '',
    clearsToday: 0,
    owned: [],
    pendingEggs: [],
    ceremonyChapterId: null,
    hungerSkipMs: 0,
    clockMark: 0,
  }
}

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(96, Math.max(4, n))
}

export function clampHearts(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.min(5, Math.max(0, Math.round(n * 1000) / 1000))
}

function readAccessory(value: unknown, hearts: number): MeadowAccessoryId {
  if (hearts < 3) return 'none'
  if (value === 'hat' || value === 'bow' || value === 'scarf') return value
  return 'none'
}

function readNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function readLastFedAt(value: unknown, fullAt: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  meadowNormalizeDirty = true
  return fullAt
}

export function normalizeMeadow(raw: unknown): MeadowSave {
  const empty = emptyMeadow()
  if (!raw || typeof raw !== 'object') return empty
  const parsed = raw as Partial<MeadowSave>
  const hungerSkipMs = readNonNegative(parsed.hungerSkipMs)
  const storedMark = readNonNegative(parsed.clockMark)
  const clockMark = Math.max(storedMark, Date.now())
  if (clockMark !== storedMark) meadowNormalizeDirty = true
  const fullAt = clockMark + hungerSkipMs
  const owned: MeadowAnimalSave[] = []
  const seen = new Set<string>()
  if (Array.isArray(parsed.owned)) {
    for (const item of parsed.owned) {
      if (!item || typeof item !== 'object') continue
      const id = (item as MeadowAnimalSave).id
      if (typeof id !== 'string' || !rosterIds.has(id) || seen.has(id)) continue
      seen.add(id)
      const row = item as Partial<MeadowAnimalSave>
      const hearts = clampHearts(row.hearts)
      owned.push({
        id: id as MeadowAnimalId,
        x: clampPercent(row.x, 50),
        y: clampPercent(row.y, 60),
        hearts,
        accessory: readAccessory(row.accessory, hearts),
        lastFedAt: readLastFedAt(row.lastFedAt, fullAt),
      })
    }
  }
  const pending: string[] = []
  if (Array.isArray(parsed.pendingEggs)) {
    for (const chapterId of parsed.pendingEggs) {
      if (typeof chapterId !== 'string') continue
      const animal = animalByChapter(chapterId)
      if (!animal || seen.has(animal.id) || pending.includes(chapterId)) continue
      pending.push(chapterId)
    }
  }
  const ceremony =
    typeof parsed.ceremonyChapterId === 'string' && animalByChapter(parsed.ceremonyChapterId)
      ? parsed.ceremonyChapterId
      : null
  return {
    openAnytime: Boolean(parsed.openAnytime),
    clearsDate: typeof parsed.clearsDate === 'string' ? parsed.clearsDate : '',
    clearsToday: Math.max(0, Math.floor(typeof parsed.clearsToday === 'number' ? parsed.clearsToday : 0)),
    owned,
    pendingEggs: pending,
    ceremonyChapterId: ceremony,
    hungerSkipMs,
    clockMark,
  }
}

/** Queue an egg for every cleared chapter that does not already own its animal. */
export function queueEggsForCleared(meadow: MeadowSave, clearedChapterIds: string[]): void {
  const owned = new Set(meadow.owned.map((item) => item.id))
  const pending = new Set(meadow.pendingEggs)
  for (const chapterId of clearedChapterIds) {
    const animal = animalByChapter(chapterId)
    if (!animal || owned.has(animal.id) || pending.has(chapterId)) continue
    meadow.pendingEggs.push(chapterId)
    pending.add(chapterId)
  }
}

/** GM fill: every animal is already on the grass. No eggs, no ceremony. */
export function grantAllMeadowAnimals(meadow: MeadowSave): void {
  meadow.pendingEggs = []
  meadow.ceremonyChapterId = null
  meadow.owned = meadowRoster().map((animal, index) => {
    const spot = spreadSpot(index)
    const previous = meadow.owned.find((item) => item.id === animal.id)
    const kept =
      previous && typeof previous.lastFedAt === 'number' && Number.isFinite(previous.lastFedAt)
        ? previous.lastFedAt
        : meadowEffectiveNow(meadow)
    return {
      id: animal.id,
      x: previous?.x ?? spot.x,
      y: previous?.y ?? spot.y,
      hearts: 5,
      accessory: previous?.accessory ?? 'none',
      lastFedAt: kept,
    }
  })
}

export function hatchEgg(meadow: MeadowSave, chapterId: string): MeadowAnimalSave | null {
  const animal = animalByChapter(chapterId)
  if (!animal) return null
  if (meadow.owned.some((item) => item.id === animal.id)) {
    meadow.pendingEggs = meadow.pendingEggs.filter((id) => id !== chapterId)
    if (meadow.ceremonyChapterId === chapterId) meadow.ceremonyChapterId = null
    return meadow.owned.find((item) => item.id === animal.id) ?? null
  }
  const spot = centerSpot()
  const save: MeadowAnimalSave = {
    id: animal.id,
    x: spot.x,
    y: spot.y,
    hearts: 0,
    accessory: 'none',
    lastFedAt: meadowEffectiveNow(meadow),
  }
  meadow.owned.push(save)
  meadow.pendingEggs = meadow.pendingEggs.filter((id) => id !== chapterId)
  if (meadow.ceremonyChapterId === chapterId) meadow.ceremonyChapterId = null
  return save
}

export function noteClearOn(meadow: MeadowSave, day: string): void {
  if (meadow.clearsDate !== day) {
    meadow.clearsDate = day
    meadow.clearsToday = 0
  }
  meadow.clearsToday += 1
}

export function meadowIsOpen(meadow: MeadowSave, day: string): boolean {
  if (meadow.openAnytime) return true
  return meadow.clearsDate === day && meadow.clearsToday > 0
}

export const MEADOW_FOODS = [
  { id: 'fish', name: 'fish', file: 'food-fish' },
  { id: 'egg', name: 'egg', file: 'food-egg' },
  { id: 'bun', name: 'bun', file: 'food-bun' },
  { id: 'ham', name: 'ham', file: 'food-ham' },
  { id: 'fig', name: 'fig', file: 'food-fig' },
  { id: 'cake', name: 'cake', file: 'food-cake' },
] as const

export type MeadowFoodId = (typeof MEADOW_FOODS)[number]['id']

/** Worn at 3 hearts. Files live in `public/meadow/` already. */
export const MEADOW_ACCESSORIES = [
  { id: 'hat', file: 'acc-hat', label: '帽子' },
  { id: 'bow', file: 'acc-bow', label: '蝴蝶结' },
  { id: 'scarf', file: 'acc-scarf', label: '围巾' },
] as const

export type MeadowWornId = (typeof MEADOW_ACCESSORIES)[number]['id']

const FAVORITE_FOOD: Record<MeadowAnimalId, MeadowFoodId> = {
  bunny: 'fig',
  leopard: 'ham',
  pig: 'cake',
  hen: 'bun',
  fox: 'egg',
  bear: 'fish',
  yak: 'fig',
  frog: 'fish',
  duck: 'bun',
  ox: 'fig',
  bird: 'cake',
  panda: 'bun',
}

export function favoriteFood(animalId: MeadowAnimalId): MeadowFoodId {
  return FAVORITE_FOOD[animalId]
}

export function isFavoriteFood(animalId: MeadowAnimalId, foodId: string): boolean {
  return FAVORITE_FOOD[animalId] === foodId
}

export function yumLine(foodName: string, favorite: boolean): string {
  return favorite ? `Yum! I love ${foodName}!` : 'Yum!'
}

/**
 * Called after a successful bite. Hearts are applied by the meadow view.
 * This hook does not write progress.
 */
export function onFeed(_animalId: string, _foodId: string, _isFavorite: boolean): void {}

/**
 * Called when two animals start tumbling together.
 * Hearts are applied by the meadow view. This hook does not write progress.
 */
export function onPlayTogether(_animalId: string, _otherId: string): void {}

export const HEART_GAIN_PET = 0.2
export const HEART_GAIN_FEED = 0.3
export const HEART_GAIN_FAVORITE = 0.6
export const HEART_GAIN_PLAY = 0.5

export type HeartBump = {
  value: number
  crossedWhole: boolean
  unlockedAccessory: boolean
  unlockedTrick: boolean
}

/** Add intimacy. Hearts never decay; the result stays inside 0–5. */
export function addHearts(current: number, gain: number): HeartBump {
  const prev = clampHearts(current)
  const next = clampHearts(prev + gain)
  const prevWhole = Math.floor(prev + 1e-6)
  const nextWhole = Math.floor(next + 1e-6)
  return {
    value: next,
    crossedWhole: nextWhole > prevWhole,
    unlockedAccessory: prev < 3 && next >= 3,
    unlockedTrick: prev < 5 && next >= 5,
  }
}

/** How full heart `index` (0–4) is, as a percent. */
export function heartFillPercent(hearts: number, index: number): number {
  return Math.min(100, Math.max(0, (clampHearts(hearts) - index) * 100))
}

let playLineFlip = false

export function nextPlayLine(): string {
  playLineFlip = !playLineFlip
  return playLineFlip ? "Let's play!" : 'So fun!'
}

export function accessoryBanner(id: string): string {
  return `${animalZh(id)}有新帽子啦！`
}

export function trickBanner(id: string): string {
  return `${animalZh(id)}学会跳舞啦！`
}

export function accessoryFile(id: MeadowAccessoryId): string | null {
  if (id === 'none') return null
  return MEADOW_ACCESSORIES.find((item) => item.id === id)?.file ?? null
}

/**
 * Hat and bow share the top of the head. Scarf sits on the neck.
 * Percents are of the 384×384 canvas. Tuned against the sprites.
 */
const ANCHORS: Record<MeadowAnimalId, Record<MeadowWornId, MeadowAnchor>> = {
  bunny: {
    hat: { x: 48, y: 32, scale: 0.42, rot: -6 },
    bow: { x: 48, y: 30, scale: 0.36, rot: -8 },
    scarf: { x: 48, y: 46, scale: 0.46, rot: 0 },
  },
  leopard: {
    hat: { x: 32, y: 44, scale: 0.42, rot: -4 },
    bow: { x: 32, y: 42, scale: 0.36, rot: -6 },
    scarf: { x: 36, y: 56, scale: 0.46, rot: 0 },
  },
  pig: {
    hat: { x: 42, y: 38, scale: 0.42, rot: -4 },
    bow: { x: 42, y: 36, scale: 0.36, rot: -6 },
    scarf: { x: 50, y: 52, scale: 0.46, rot: 0 },
  },
  hen: {
    hat: { x: 40, y: 32, scale: 0.4, rot: -6 },
    bow: { x: 40, y: 30, scale: 0.34, rot: -8 },
    scarf: { x: 50, y: 46, scale: 0.44, rot: 0 },
  },
  fox: {
    hat: { x: 42, y: 32, scale: 0.42, rot: -6 },
    bow: { x: 42, y: 30, scale: 0.36, rot: -8 },
    scarf: { x: 46, y: 46, scale: 0.46, rot: 0 },
  },
  bear: {
    hat: { x: 48, y: 30, scale: 0.44, rot: 0 },
    bow: { x: 48, y: 28, scale: 0.38, rot: 0 },
    scarf: { x: 48, y: 44, scale: 0.48, rot: 0 },
  },
  yak: {
    hat: { x: 40, y: 34, scale: 0.4, rot: -8 },
    bow: { x: 40, y: 32, scale: 0.34, rot: -10 },
    scarf: { x: 50, y: 48, scale: 0.46, rot: 0 },
  },
  frog: {
    hat: { x: 50, y: 34, scale: 0.42, rot: 0 },
    bow: { x: 50, y: 32, scale: 0.36, rot: 0 },
    scarf: { x: 50, y: 48, scale: 0.46, rot: 0 },
  },
  duck: {
    hat: { x: 44, y: 32, scale: 0.4, rot: -6 },
    bow: { x: 44, y: 30, scale: 0.34, rot: -8 },
    scarf: { x: 46, y: 46, scale: 0.44, rot: 0 },
  },
  ox: {
    hat: { x: 40, y: 34, scale: 0.42, rot: -8 },
    bow: { x: 40, y: 32, scale: 0.36, rot: -10 },
    scarf: { x: 46, y: 48, scale: 0.48, rot: 0 },
  },
  bird: {
    hat: { x: 46, y: 34, scale: 0.38, rot: -6 },
    bow: { x: 46, y: 32, scale: 0.32, rot: -8 },
    scarf: { x: 50, y: 48, scale: 0.42, rot: 0 },
  },
  panda: {
    hat: { x: 52, y: 30, scale: 0.44, rot: 4 },
    bow: { x: 52, y: 28, scale: 0.38, rot: 6 },
    scarf: { x: 52, y: 44, scale: 0.48, rot: 0 },
  },
}

export function accessoryAnchor(animalId: MeadowAnimalId, kind: MeadowWornId): MeadowAnchor {
  return ANCHORS[animalId][kind]
}
