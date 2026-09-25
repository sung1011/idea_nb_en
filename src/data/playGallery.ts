import {
  ANIMALS_CHAPTER_ID,
  getChapter,
  getLevel,
  isAnimalsChapterId,
  listChapterLevels,
  type PlayKind,
} from './chapters'

export type PlayItem = {
  id: string
  emoji: string
  name: string
  zh: string
  path: string
}

export type ChapterPracticeItem = PlayItem & {
  levelId: string
  order: number
  play: PlayKind
}

export const PLAY_KIND_EMOJI: Record<PlayKind, string> = {
  flashFlip: '🃏',
  whackWord: '🐹',
  dragSort: '🧺',
  soundSpell: '🔤',
  wordFish: '🐠',
  echo: '🎤',
  storyBook: '📖',
  chapterFinale: '🎉',
  numberFlash: '🔢',
  numberTap: '👆',
  numberCount: '⭐',
}

export const playItems: PlayItem[] = [
  { id: 'flashFlip', emoji: '🃏', name: 'Flash Flip', zh: '闪卡翻翻', path: '/flash-flip' },
  { id: 'whackWord', emoji: '🐹', name: 'Whack Word', zh: '地鼠词', path: '/whack-word' },
  { id: 'dragSort', emoji: '🧺', name: 'Drag Sort', zh: '拖一拖', path: '/drag-sort' },
  { id: 'soundFish', emoji: '🐠', name: 'Word Fish', zh: '读词钓鱼', path: '/sound-fish' },
  { id: 'echoCave', emoji: '🎤', name: 'Echo Cave', zh: '回声跟读', path: '/echo-cave' },
  { id: 'storyBook', emoji: '📖', name: 'Story Book', zh: '小书点读', path: '/story-book' },
  { id: 'soundSpell', emoji: '🔤', name: 'Sound Spell', zh: '听音拼一拼', path: '/sound-spell' },
  { id: 'singAlong', emoji: '🎵', name: 'Sing Along', zh: '唱一唱', path: '/sing-along' },
  { id: 'findScene', emoji: '🏝️', name: 'Find Scene', zh: '找一找', path: '/find-scene' },
]

export function locationForChapterPractice(chapterId = ANIMALS_CHAPTER_ID) {
  return { path: '/play-gallery', query: { chapter: chapterId } }
}

export function practiceChapterIdFromQuery(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !value) return null
  if (getChapter(value) || isAnimalsChapterId(value)) return value
  return null
}

export function isChapterPracticeGallery(raw: unknown): boolean {
  return practiceChapterIdFromQuery(raw) !== null
}

export function chapterPracticeItems(chapterId = ANIMALS_CHAPTER_ID): ChapterPracticeItem[] {
  return listChapterLevels(chapterId).map((level) => ({
    id: level.id,
    emoji: PLAY_KIND_EMOJI[level.play],
    name: level.titleEn,
    zh: level.titleZh,
    path: level.route,
    levelId: level.id,
    order: level.order,
    play: level.play,
  }))
}

export function locationForClearedPractice(item: Pick<ChapterPracticeItem, 'path' | 'levelId'>) {
  const def = getLevel(item.levelId)
  const query: Record<string, string> = { level: item.levelId, practice: '1' }
  if (def?.chapterId) query.chapter = def.chapterId
  return { path: item.path, query }
}

/** Prefer `?chapter=`, then the level's own chapter, so practice never spills into other chapters. */
export function resolvePracticeChapterId(rawChapter: unknown, rawLevel?: unknown): string {
  const fromQuery = practiceChapterIdFromQuery(rawChapter)
  if (fromQuery) return fromQuery
  const value = Array.isArray(rawLevel) ? rawLevel[0] : rawLevel
  if (typeof value === 'string' && value) {
    const def = getLevel(value)
    if (def?.chapterId) return def.chapterId
  }
  return ANIMALS_CHAPTER_ID
}

export function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
