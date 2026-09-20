import {
  ANIMALS_CHAPTER_ID,
  getChapter,
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
  wordFish: '🐠',
  echo: '🎤',
  chapterFinale: '🎉',
}

export const playItems: PlayItem[] = [
  { id: 'soundFish', emoji: '🐠', name: 'Word Fish', zh: '读词钓鱼', path: '/sound-fish' },
  { id: 'echoCave', emoji: '🎤', name: 'Echo Cave', zh: '回声跟读', path: '/echo-cave' },
  { id: 'flashFlip', emoji: '🃏', name: 'Flash Flip', zh: '闪卡翻翻', path: '/flash-flip' },
  { id: 'whackWord', emoji: '🐹', name: 'Whack Word', zh: '地鼠词', path: '/whack-word' },
  { id: 'dragSort', emoji: '🧺', name: 'Drag Sort', zh: '拖一拖', path: '/drag-sort' },
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
  return { path: item.path, query: { level: item.levelId, practice: '1' } }
}

export function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
