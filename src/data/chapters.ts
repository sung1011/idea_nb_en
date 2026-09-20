import {
  CHAPTER_1_STICKER_ID,
  CHAPTER_2_STICKER_ID,
  CHAPTER_3_STICKER_ID,
} from './stickers'

export type PlayKind =
  | 'flashFlip'
  | 'whackWord'
  | 'dragSort'
  | 'soundSpell'
  | 'wordFish'
  | 'echo'
  | 'storyBook'
  | 'chapterFinale'

/** Pre-8-level path (v3 saves): ids chN-1…chN-6 mapped by play, not by suffix. */
export const LEGACY_SIX_PLAY_ORDER: PlayKind[] = [
  'flashFlip',
  'whackWord',
  'dragSort',
  'wordFish',
  'echo',
  'chapterFinale',
]

export const INSERTED_PLAY_KINDS: PlayKind[] = ['soundSpell', 'storyBook']

export type LevelStatus = 'locked' | 'unlocked' | 'cleared'

export const CHAPTER_1_ID = 'ch1'
export const CHAPTER_2_ID = 'ch2'
export const CHAPTER_3_ID = 'ch3'
export const ANIMALS_CHAPTER_ID = CHAPTER_1_ID
export const DEFAULT_CHAPTER_ID = CHAPTER_1_ID

export const PLAY_ROUTES: Record<PlayKind, string> = {
  flashFlip: '/flash-flip',
  whackWord: '/whack-word',
  dragSort: '/drag-sort',
  soundSpell: '/sound-spell',
  wordFish: '/sound-fish',
  echo: '/echo-cave',
  storyBook: '/story-book',
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
  theme: string
  familyId: string
  stickerId: string
  words: string[]
  levels: LevelDef[]
}

function level(
  chapterId: string,
  partial: Omit<LevelDef, 'chapterId' | 'route' | 'firstClearStars'> & {
    firstClearStars?: number
  },
): LevelDef {
  return {
    ...partial,
    chapterId,
    route: PLAY_ROUTES[partial.play],
    firstClearStars: partial.firstClearStars ?? 1,
  }
}

const PLAY_SKELETON: Array<{
  order: number
  play: PlayKind
  titleEn: string
  titleZh: string
}> = [
  { order: 1, play: 'flashFlip', titleEn: 'Flash Flip', titleZh: '闪卡翻翻' },
  { order: 2, play: 'whackWord', titleEn: 'Whack Word', titleZh: '地鼠词' },
  { order: 3, play: 'dragSort', titleEn: 'Drag Sort', titleZh: '拖一拖' },
  { order: 4, play: 'soundSpell', titleEn: 'Sound Spell', titleZh: '听音拼一拼' },
  { order: 5, play: 'wordFish', titleEn: 'Word Fish', titleZh: '读词钓鱼' },
  { order: 6, play: 'echo', titleEn: 'Echo', titleZh: '回声跟读' },
  { order: 7, play: 'storyBook', titleEn: 'Story Book', titleZh: '小书点读' },
  { order: 8, play: 'chapterFinale', titleEn: 'Chapter Finale', titleZh: '章节回顾' },
]

function chapterLevels(
  chapterId: string,
  specs: Array<{
    notes: string
    focusWord?: string
    appearWords?: string[]
    words: string[]
    chapterStickerId?: string
  }>,
): LevelDef[] {
  return PLAY_SKELETON.map((slot, index) =>
    level(chapterId, {
      id: `${chapterId}-${slot.order}`,
      order: slot.order,
      play: slot.play,
      titleEn: slot.titleEn,
      titleZh: slot.titleZh,
      notes: specs[index].notes,
      focusWord: specs[index].focusWord,
      appearWords: specs[index].appearWords,
      words: specs[index].words,
      chapterStickerId: specs[index].chapterStickerId,
    }),
  )
}

/** Animals Island Chapter 1 — 「-ap 派对」. Option A: levels unlock in order. */
export const CHAPTER_1: ChapterDef = {
  id: CHAPTER_1_ID,
  islandId: 'animals',
  titleEn: 'Animals Island · -ap Party',
  titleZh: '动物岛「-ap 派对」',
  theme: 'atParty',
  familyId: '-ap',
  stickerId: CHAPTER_1_STICKER_ID,
  words: ['cap', 'map', 'nap', 'tap', 'lap'],
  levels: chapterLevels(CHAPTER_1_ID, [
    {
      notes: 'cap focus, map/nap appear',
      focusWord: 'cap',
      appearWords: ['map', 'nap'],
      words: ['cap', 'map', 'nap'],
    },
    { notes: 'cap/map/nap', words: ['cap', 'map', 'nap'] },
    { notes: 'three words', words: ['cap', 'map', 'nap'] },
    {
      notes: 'hear CVC, assemble with letter tiles',
      focusWord: 'cap',
      words: ['cap', 'map', 'nap'],
    },
    { notes: 'read to catch', words: ['cap', 'map', 'nap'] },
    { notes: 'follow-read + short sentence', words: ['cap', 'map', 'nap'] },
    {
      notes: 'mini book, one short sentence per page, try-blend cap',
      focusWord: 'cap',
      words: ['cap', 'map', 'nap'],
    },
    {
      notes: 'short mixed recap + one -at review + chapter sticker on first clear',
      words: ['cap', 'map', 'nap', 'tap', 'cat'],
      chapterStickerId: CHAPTER_1_STICKER_ID,
    },
  ]),
}

/** Animals Island Chapter 2 — 「听声找伙伴」. Unlocks only after Chapter 1 is fully cleared. */
export const CHAPTER_2: ChapterDef = {
  id: CHAPTER_2_ID,
  islandId: 'animals',
  titleEn: 'Animals Island · Listen for Friends',
  titleZh: '动物岛「听声找伙伴」',
  theme: 'listenFriends',
  familyId: '-og',
  stickerId: CHAPTER_2_STICKER_ID,
  words: ['frog', 'log', 'fog', 'jog', 'hog'],
  levels: chapterLevels(CHAPTER_2_ID, [
    {
      notes: 'frog focus, log/fog appear',
      focusWord: 'frog',
      appearWords: ['log', 'fog'],
      words: ['frog', 'log', 'fog'],
    },
    { notes: 'frog/log/fog', words: ['frog', 'log', 'fog'] },
    { notes: 'frog/log/jog', words: ['frog', 'log', 'jog'] },
    {
      notes: 'hear CVC, assemble with letter tiles',
      focusWord: 'frog',
      words: ['frog', 'log', 'fog'],
    },
    { notes: 'frog/log/jog', words: ['frog', 'log', 'jog'] },
    {
      notes: 'frog→hog path through the five -og words + short sentence',
      words: ['frog', 'log', 'fog', 'jog', 'hog'],
    },
    {
      notes: 'mini book, one short sentence per page, try-blend frog',
      focusWord: 'frog',
      words: ['frog', 'log', 'fog'],
    },
    {
      notes: 'five-word recap + chapter sticker on first clear',
      words: ['frog', 'log', 'fog', 'jog', 'hog'],
      chapterStickerId: CHAPTER_2_STICKER_ID,
    },
  ]),
}

/** Animals Island Chapter 3 — 「石头袜子」. Unlocks only after Chapter 2 is fully cleared. */
export const CHAPTER_3: ChapterDef = {
  id: CHAPTER_3_ID,
  islandId: 'animals',
  titleEn: 'Animals Island · Rocks and Socks',
  titleZh: '动物岛「石头袜子」',
  theme: 'treatsSky',
  familyId: '-ck',
  stickerId: CHAPTER_3_STICKER_ID,
  words: ['duck', 'rock', 'sock', 'lock', 'pack'],
  levels: chapterLevels(CHAPTER_3_ID, [
    {
      notes: 'duck focus, rock appear',
      focusWord: 'duck',
      appearWords: ['rock'],
      words: ['duck', 'rock'],
    },
    { notes: 'duck/rock/sock', words: ['duck', 'rock', 'sock'] },
    { notes: 'rock/sock/lock', words: ['rock', 'sock', 'lock'] },
    {
      notes: 'hear CVC, assemble with letter tiles',
      focusWord: 'duck',
      words: ['duck', 'sock'],
    },
    { notes: 'duck/rock/lock', words: ['duck', 'rock', 'lock'] },
    { notes: 'duck/rock/sock + short sentence', words: ['duck', 'rock', 'sock'] },
    {
      notes: 'mini book, one short sentence per page, try-blend duck',
      focusWord: 'duck',
      words: ['duck', 'rock', 'sock'],
    },
    {
      notes: 'ck mix + one -ap review + chapter sticker on first clear',
      words: ['duck', 'rock', 'sock', 'lock', 'pack', 'cap'],
      chapterStickerId: CHAPTER_3_STICKER_ID,
    },
  ]),
}

export const CHAPTERS: ChapterDef[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3]

const chapterById = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]))
const levelById = new Map(CHAPTERS.flatMap((chapter) => chapter.levels.map((item) => [item.id, item])))

export function listChapters(): ChapterDef[] {
  return CHAPTERS
}

export function getChapter(id: string = DEFAULT_CHAPTER_ID): ChapterDef | undefined {
  return chapterById.get(id)
}

export function getChapterOrDefault(id?: string): ChapterDef {
  return getChapter(id) ?? CHAPTER_1
}

export function listChapterLevels(chapterId: string = DEFAULT_CHAPTER_ID): LevelDef[] {
  return getChapterOrDefault(chapterId).levels
}

/** Config-driven chapter length. Never hardcode 6 / 8 at call sites. */
export function chapterLevelTotal(chapterId: string = DEFAULT_CHAPTER_ID): number {
  return Math.max(1, listChapterLevels(chapterId).length)
}

export function levelIdForPlay(play: PlayKind, chapterId: string = DEFAULT_CHAPTER_ID): string | undefined {
  return listChapterLevels(chapterId).find((item) => item.play === play)?.id
}

export function listAllLevels(): LevelDef[] {
  return CHAPTERS.flatMap((chapter) => chapter.levels)
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

export function getChapterIndex(chapterId: string): number {
  return CHAPTERS.findIndex((chapter) => chapter.id === chapterId)
}

export function getChapterNumber(chapterId: string): number {
  const index = getChapterIndex(chapterId)
  return index >= 0 ? index + 1 : 1
}

/** Kid-facing short title: 「-ap 派对」 / 「听声找伙伴」 / 「石头袜子」. */
export function chapterKidTitle(chapterId: string): string {
  const chapter = getChapter(chapterId)
  if (!chapter) return ''
  const match = chapter.titleZh.match(/「(.+)」/)
  return match?.[1] ?? chapter.titleZh
}

export function isAnimalsChapterId(id: string): boolean {
  return chapterById.has(id)
}

export const CHAPTER_LOBBY_EMOJI: Record<string, string> = {
  [CHAPTER_1_ID]: '🎉',
  [CHAPTER_2_ID]: '👂',
  [CHAPTER_3_ID]: '🧁',
}

export function getPriorChapter(chapterId: string): ChapterDef | null {
  const index = getChapterIndex(chapterId)
  return index > 0 ? CHAPTERS[index - 1] : null
}

export function getNextChapter(chapterId: string): ChapterDef | null {
  const index = getChapterIndex(chapterId)
  return index >= 0 && index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null
}

/** Prior chapter id that must be fully cleared, or null if this is the first chapter. */
export function chapterUnlocksAfter(chapterId: string): string | null {
  return getPriorChapter(chapterId)?.id ?? null
}

export function getNextLevelDef(levelId: string): LevelDef | null {
  const current = getLevel(levelId)
  if (!current) return null
  const levels = listChapterLevels(current.chapterId)
  return levels.find((item) => item.order === current.order + 1) ?? null
}

/** Same-chapter next level, or the first level of the following chapter. */
export function getNextMainlineLevelDef(levelId: string): LevelDef | null {
  const intra = getNextLevelDef(levelId)
  if (intra) return intra
  const current = getLevel(levelId)
  if (!current) return null
  return getNextChapter(current.chapterId)?.levels[0] ?? null
}

export function playKindToGate(play: PlayKind): string | null {
  if (play === 'flashFlip') return 'flashFlip'
  if (play === 'whackWord') return 'whackWord'
  if (play === 'dragSort') return 'dragSort'
  if (play === 'wordFish') return 'soundFish'
  if (play === 'echo') return 'echoCave'
  return null
}

const defaultLevelByPlay = new Map<PlayKind, string>(
  CHAPTER_1.levels.map((item) => [item.play, item.id]),
)

export function defaultLevelIdForPlay(play: PlayKind): string {
  return defaultLevelByPlay.get(play) ?? getFirstLevel().id
}

/** Query `?level=` wins when it matches this play; otherwise the Chapter 1 default. */
export function resolveLevelId(play: PlayKind, raw?: string | null): string {
  if (raw) {
    const def = getLevel(raw)
    if (def && def.play === play) return def.id
  }
  return defaultLevelIdForPlay(play)
}
