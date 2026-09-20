import { computed } from 'vue'
import { ALBUM_STICKERS, stickerById, stickerEmoji, stickerLabel, type StickerDef } from '../data/stickers'
import { persistState } from './progressStore'

export type AlbumSlot = StickerDef & { owned: boolean }

/** Read-only album view over `lifetime.stickers`. Granting still goes through progressStore. */
export function useStickerAlbum() {
  const slots = computed<AlbumSlot[]>(() => {
    const known = new Set(ALBUM_STICKERS.map((item) => item.id))
    const catalog = ALBUM_STICKERS.map((item) => ({
      ...item,
      owned: persistState.lifetime.stickers.includes(item.id),
    }))
    const extra = persistState.lifetime.stickers
      .filter((id) => !known.has(id))
      .map((id) => {
        const found = stickerById(id)
        return {
          id,
          label: found?.label ?? stickerLabel(id),
          emoji: found?.emoji ?? stickerEmoji(id),
          owned: true,
        }
      })
    return [...catalog, ...extra]
  })
  const ownedCount = computed(() => slots.value.filter((item) => item.owned).length)
  const isEmpty = computed(() => ownedCount.value === 0)

  return {
    slots,
    ownedCount,
    total: ALBUM_STICKERS.length,
    isEmpty,
  }
}
