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

/** Old island badges. Kept so earlier saves still have a name in the album. */
export const CHAPTER_1_STICKER_ID = 'atParty'
export const CHAPTER_2_STICKER_ID = 'pawPrint'
export const CHAPTER_3_STICKER_ID = 'littleStar'

export const LEGACY_CHAPTER_STICKERS: StickerDef[] = [
  { id: CHAPTER_1_STICKER_ID, label: '-ap 派对徽章', emoji: '🎉' },
  { id: CHAPTER_2_STICKER_ID, label: '爪印徽章', emoji: '🐾' },
  { id: CHAPTER_3_STICKER_ID, label: '小星星徽章', emoji: '⭐' },
]

/** One badge per syllabus chapter. Ids stay stable so album saves keep matching. */
export const RISE_CHAPTER_STICKERS: StickerDef[] = [
  { id: 'rise1', label: '字母朋友徽章', emoji: '🔤' },
  { id: 'rise2', label: '小豹来了徽章', emoji: '🐆' },
  { id: 'rise3', label: '词族和字母徽章', emoji: '🖼️' },
  { id: 'rise4', label: '母鸡徽章', emoji: '🐔' },
  { id: 'rise5', label: '小屋徽章', emoji: '🏡' },
  { id: 'rise6', label: '丹和卡姆徽章', emoji: '👦' },
  { id: 'rise7', label: '义卖徽章', emoji: '🏷️' },
  { id: 'rise8', label: '好朋友徽章', emoji: '👫' },
  { id: 'rise9', label: '森林徽章', emoji: '🌲' },
  { id: 'rise10', label: '做饭徽章', emoji: '🍳' },
  { id: 'rise11', label: '地图徽章', emoji: '🗺️' },
  { id: 'rise12', label: '毕业徽章', emoji: '🎓' },
]

/** Lesson badges for chapters 4–9 (课13–36). Not indexed with chapter stickers. */
export const RISE_LESSON_STICKERS: StickerDef[] = [
  { id: 'rise13', label: '母鸡会跳徽章', emoji: '🐔' },
  { id: 'rise14', label: '字母 G 徽章', emoji: '🐶' },
  { id: 'rise15', label: '大力一击徽章', emoji: '⚾' },
  { id: 'rise16', label: '大胡萝卜徽章', emoji: '🥕' },
  { id: 'rise17', label: '数字徽章', emoji: '💯' },
  { id: 'rise18', label: '书桌帐篷徽章', emoji: '⛺' },
  { id: 'rise19', label: '小屋朋友徽章', emoji: '🦊' },
  { id: 'rise20', label: '看一看徽章', emoji: '👀' },
  { id: 'rise21', label: '能蘸吗徽章', emoji: '🥄' },
  { id: 'rise22', label: '帽子在哪徽章', emoji: '🧢' },
  { id: 'rise23', label: '红色果酱徽章', emoji: '🍓' },
  { id: 'rise24', label: '心情徽章', emoji: '😊' },
  { id: 'rise25', label: '拿到啦徽章', emoji: '🦬' },
  { id: 'rise26', label: '多一个徽章', emoji: '➕' },
  { id: 'rise27', label: '我得到徽章', emoji: '🎁' },
  { id: 'rise28', label: '一起玩徽章', emoji: '🥅' },
  { id: 'rise29', label: '少一个徽章', emoji: '0️⃣' },
  { id: 'rise30', label: '蓝色徽章', emoji: '🔵' },
  { id: 'rise31', label: '坐下徽章', emoji: '🪑' },
  { id: 'rise32', label: '跳起来徽章', emoji: '⚡' },
  { id: 'rise33', label: '好一个徽章', emoji: '👑' },
  { id: 'rise34', label: '跑过去徽章', emoji: '🦌' },
  { id: 'rise35', label: '她说徽章', emoji: '💬' },
  { id: 'rise36', label: '停下徽章', emoji: '🛑' },
]

export const CHAPTER_STICKERS: StickerDef[] = [...RISE_CHAPTER_STICKERS]

export const ALBUM_STICKERS: StickerDef[] = [
  ...PLACEHOLDER_STICKERS,
  ...LEGACY_CHAPTER_STICKERS,
  ...RISE_CHAPTER_STICKERS,
  ...RISE_LESSON_STICKERS,
]

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
