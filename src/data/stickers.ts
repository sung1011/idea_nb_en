export type StickerDef = {
  id: string
  label: string
  emoji: string
}

/** Catalog ids only. Granting / album UI is a later phase. */
export const PLACEHOLDER_STICKERS: StickerDef[] = [
  { id: 'ear', label: '派对耳朵', emoji: '👂' },
  { id: 'paw', label: '软爪印', emoji: '🐾' },
  { id: 'leaf', label: '小岛叶子', emoji: '🍃' },
  { id: 'shell', label: '贝壳', emoji: '🐚' },
  { id: 'sun', label: '暖太阳', emoji: '☀️' },
]

export const PLACEHOLDER_STICKER_IDS = PLACEHOLDER_STICKERS.map((item) => item.id)
