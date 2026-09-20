import { CHAPTER_1_STICKER_ID } from './stickers'

export type PlayKind =
  | 'flashFlip'
  | 'whackWord'
  | 'dragSort'
  | 'wordFish'
  | 'echo'
  | 'chapterFinale'

export type LevelStatus = 'locked' | 'unlocked' | 'cleared'

export const ANIMALS_CHAPTER_ID = 'ch1'
export const DEFAULT_CHAPTER_ID = ANIMALS_CHAPTER_ID

export const PLAY_ROUTES: Record<PlayKind, string> = {
  flashFlip: '/flash-flip',
  whackWord: '/whack-word',
  dragSort: '/drag-sort',
  wordFish: '/sound-fish',
  echo: '/echo-cave',
  chapterFinale: '/chapter-finale',
}

export type LevelDef = {
  id: string
  chapterId: string
  order: number
  play: PlayKind
  titleEn: string
  titleZh: string
  notes: string
  route: string
  focusWord?: string
  words?: string[]
  appearWords?: string[]
  firstClearStars: number
  chapterStickerId?: string
}

export type ChapterDef = {
  id: string
  islandId: 'animals'
  titleEn: string
  titleZh: string
  familyId: string
  stickerId: string
  levels: LevelDef[]
}

function level(
  partial: Omit<LevelDef, 'chapterId' | 'route' | 'firstClearStars'> & {
    firstClearStars?: number
  },
): LevelDef {
  return {
    ...partial,
    chapterId: ANIMALS_CHAPTER_ID,
    route: PLAY_ROUTES[partial.play],
    firstClearStars: partial.firstClearStars ?? 1,
  }
}

/** Animals Island Chapter 1 — 「-at 派对」. Option A: levels unlock in order. */
export const CHAPTER_1: ChapterDef = {
  id: ANIMALS_CHAPTER_ID,
  islandId: 'animals',
  titleEn: 'Animals Island · -at Party',
  titleZh: '动物岛「-at 派对」',
  familyId: '-at',
  stickerId: CHAPTER_1_STICKER_ID,
  levels: [
    level({
      id: 'ch1-1',
      order: 1,
      play: 'flashFlip',
      titleEn: 'Flash Flip',
      titleZh: '闪卡翻翻',
      notes: 'cat focus, hat/mat appear',
      focusWord: 'cat',
      appearWords: ['hat', 'mat'],
      words: ['cat', 'hat', 'mat'],
    }),
    level({
      id: 'ch1-2',
      order: 2,
      play: 'whackWord',
      titleEn: 'Whack Word',
      titleZh: '地鼠词',
      notes: 'cat/hat/mat',
      words: ['cat', 'hat', 'mat'],
    }),
    level({
      id: 'ch1-3',
      order: 3,
      play: 'dragSort',
      titleEn: 'Drag Sort',
      titleZh: '拖一拖',
      notes: 'three words',
      words: ['cat', 'hat', 'mat'],
    }),
    level({
      id: 'ch1-4',
      order: 4,
      play: 'wordFish',
      titleEn: 'Word Fish',
      titleZh: '读词钓鱼',
      notes: 'read to catch',
      words: ['cat', 'hat', 'mat'],
    }),
    level({
      id: 'ch1-5',
      order: 5,
      play: 'echo',
      titleEn: 'Echo',
      titleZh: '回声跟读',
      notes: 'follow-read',
      words: ['cat', 'hat', 'mat'],
    }),
    level({
      id: 'ch1-6',
      order: 6,
      play: 'chapterFinale',
      titleEn: 'Chapter Finale',
      titleZh: '章节回顾',
      notes: 'short mixed recap + chapter sticker on first clear',
      words: ['cat', 'hat', 'mat'],
      chapterStickerId: CHAPTER_1_STICKER_ID,
    }),
  ],
}

export const CHAPTERS: ChapterDef[] = [CHAPTER_1]

const chapterById = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]))
const levelById = new Map(CHAPTERS.flatMap((chapter) => chapter.levels.map((item) => [item.id, item])))

export function getChapter(id: string = DEFAULT_CHAPTER_ID): ChapterDef | undefined {
  return chapterById.get(id)
}

export function getChapterOrDefault(id?: string): ChapterDef {
  return getChapter(id) ?? CHAPTER_1
}

export function listChapterLevels(chapterId: string = DEFAULT_CHAPTER_ID): LevelDef[] {
  return getChapterOrDefault(chapterId).levels
}

export function getLevel(id: string): LevelDef | undefined {
  return levelById.get(id)
}

export function isKnownLevelId(id: string): boolean {
  return levelById.has(id)
}

export function getFirstLevel(chapterId: string = DEFAULT_CHAPTER_ID): LevelDef {
  return listChapterLevels(chapterId)[0]
}

export function getNextLevelDef(levelId: string): LevelDef | null {
  const current = getLevel(levelId)
  if (!current) return null
  const levels = listChapterLevels(current.chapterId)
  return levels.find((item) => item.order === current.order + 1) ?? null
}

export function playKindToGate(play: PlayKind): string | null {
  if (play === 'flashFlip') return 'flashFlip'
  if (play === 'whackWord') return 'whackWord'
  if (play === 'dragSort') return 'dragSort'
  if (play === 'wordFish') return 'soundFish'
  if (play === 'echo') return 'echoCave'
  return null
}
