export type StickerDef = {
  id: string
  label: string
  emoji: string
}

/** Catalog ids. Day-complete grants one unused id per Shanghai day; album reads these slots. */
export const PLACEHOLDER_STICKERS: StickerDef[] = [
  { id: 'ear', label: '派对耳朵', emoji: '👂' },
  { id: 'paw', label: '软爪印', emoji: '🐾' },
  { id: 'leaf', label: '小岛叶子', emoji: '🍃' },
  { id: 'shell', label: '贝壳', emoji: '🐚' },
  { id: 'sun', label: '暖太阳', emoji: '☀️' },
]

/** Chapter first-clear badges. Not in the daily rotating pool. */
export const CHAPTER_1_STICKER_ID = 'atParty'
export const CHAPTER_2_STICKER_ID = 'pawPrint'
export const CHAPTER_3_STICKER_ID = 'littleStar'

export const CHAPTER_STICKERS: StickerDef[] = [
  { id: CHAPTER_1_STICKER_ID, label: '-ap 派对徽章', emoji: '🎉' },
  { id: CHAPTER_2_STICKER_ID, label: '爪印徽章', emoji: '🐾' },
  { id: CHAPTER_3_STICKER_ID, label: '小星星徽章', emoji: '⭐' },
]

export const ALBUM_STICKERS: StickerDef[] = [...PLACEHOLDER_STICKERS, ...CHAPTER_STICKERS]

export const PLACEHOLDER_STICKER_IDS = PLACEHOLDER_STICKERS.map((item) => item.id)

export function stickerById(id: string): StickerDef | undefined {
  return ALBUM_STICKERS.find((item) => item.id === id)
}

/** Album / celebrate copy: catalog Chinese name, or a kid-facing fallback. */
export function stickerLabel(id: string): string {
  return stickerById(id)?.label ?? '章节徽章'
}

export function stickerEmoji(id: string): string {
  return stickerById(id)?.emoji ?? '⭐'
}

/** Next unused catalog id; if the child owns all five, fall back to a stable per-day pick. */
export function nextStickerId(owned: readonly string[], day = ''): string {
  const have = new Set(owned)
  const fresh = PLACEHOLDER_STICKER_IDS.find((id) => !have.has(id))
  if (fresh) return fresh
  if (!day) return PLACEHOLDER_STICKER_IDS[0]
  let n = 0
  for (let i = 0; i < day.length; i += 1) {
    n = (n * 33 + day.charCodeAt(i)) >>> 0
  }
  return PLACEHOLDER_STICKER_IDS[n % PLACEHOLDER_STICKER_IDS.length]
}
