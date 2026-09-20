import { computed } from 'vue'
import { ALBUM_STICKERS, type StickerDef } from '../data/stickers'
import { persistState } from './progressStore'

export type AlbumSlot = StickerDef & { owned: boolean }

/** Read-only album view over `lifetime.stickers`. Granting still goes through progressStore. */
export function useStickerAlbum() {
  const slots = computed<AlbumSlot[]>(() =>
    ALBUM_STICKERS.map((item) => ({
      ...item,
      owned: persistState.lifetime.stickers.includes(item.id),
    })),
  )
  const ownedCount = computed(() => slots.value.filter((item) => item.owned).length)
  const isEmpty = computed(() => ownedCount.value === 0)

  return {
    slots,
    ownedCount,
    total: ALBUM_STICKERS.length,
    isEmpty,
  }
}
