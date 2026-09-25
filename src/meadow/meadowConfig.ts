import { CHAPTERS } from '../data/chapters'

/** Chapter order matches `CHAPTERS`. Phase 2/3 can add fields without renaming ids. */
export const MEADOW_ROSTER = [
  { id: 'bunny', name: 'bunny' },
  { id: 'leopard', name: 'leopard' },
  { id: 'pig', name: 'pig' },
  { id: 'hen', name: 'hen' },
  { id: 'fox', name: 'fox' },
  { id: 'bear', name: 'bear' },
  { id: 'yak', name: 'yak' },
  { id: 'frog', name: 'frog' },
  { id: 'duck', name: 'duck' },
  { id: 'ox', name: 'ox' },
  { id: 'bird', name: 'bird' },
  { id: 'panda', name: 'panda' },
] as const

export type MeadowAnimalId = (typeof MEADOW_ROSTER)[number]['id']

export type MeadowAnimalDef = {
  id: MeadowAnimalId
  name: string
  chapterId: string
  chapterNo: number
}

export type MeadowAnimalSave = {
  id: MeadowAnimalId
  /** Feet position, percent of the play field. */
  x: number
  y: number
  /** Reserved for phase 3. Unused while feeding. */
  hearts: number
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
}

const rosterIds = new Set<string>(MEADOW_ROSTER.map((item) => item.id))

export function meadowRoster(): MeadowAnimalDef[] {
  return MEADOW_ROSTER.map((item, index) => ({
    id: item.id,
    name: item.name,
    chapterId: CHAPTERS[index]?.id ?? `ch${index + 1}`,
    chapterNo: index + 1,
  }))
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
  }
}

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(96, Math.max(4, n))
}

export function normalizeMeadow(raw: unknown): MeadowSave {
  const empty = emptyMeadow()
  if (!raw || typeof raw !== 'object') return empty
  const parsed = raw as Partial<MeadowSave>
  const owned: MeadowAnimalSave[] = []
  const seen = new Set<string>()
  if (Array.isArray(parsed.owned)) {
    for (const item of parsed.owned) {
      if (!item || typeof item !== 'object') continue
      const id = (item as MeadowAnimalSave).id
      if (typeof id !== 'string' || !rosterIds.has(id) || seen.has(id)) continue
      seen.add(id)
      const row = item as Partial<MeadowAnimalSave>
      owned.push({
        id: id as MeadowAnimalId,
        x: clampPercent(row.x, 50),
        y: clampPercent(row.y, 60),
        hearts: typeof row.hearts === 'number' && Number.isFinite(row.hearts) ? row.hearts : 0,
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
    return {
      id: animal.id,
      x: previous?.x ?? spot.x,
      y: previous?.y ?? spot.y,
      hearts: previous?.hearts ?? 0,
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
  const save: MeadowAnimalSave = { id: animal.id, x: spot.x, y: spot.y, hearts: 0 }
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

/** Phase 3 wears these. Files live in `public/meadow/` already. */
export const MEADOW_ACCESSORIES = [
  { id: 'hat', file: 'acc-hat' },
  { id: 'bow', file: 'acc-bow' },
  { id: 'scarf', file: 'acc-scarf' },
] as const

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
 * Phase 3 can add hearts from here.
 * Feeding calls this after a successful bite. It does not write progress.
 */
export function onFeed(_animalId: string, _foodId: string, _isFavorite: boolean): void {}

/**
 * Phase 3 will start play-fighting from here.
 * Phase 1 drops animals beside each other and does not call this.
 */
export function onPlayTogether(_animalId: string, _otherId: string): void {}
