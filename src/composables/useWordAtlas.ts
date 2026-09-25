import { computed } from 'vue'
import { atlasChapterGroups } from '../data/atlasCatalog'
import { isWordUnlocked, unlockWord } from './progressStore'

const catalog = atlasChapterGroups()

export { isWordUnlocked, unlockWord }

export function useWordAtlas() {
  const chapters = computed(() =>
    catalog.map((group) => ({
      ...group,
      words: group.words.map((item) => ({
        ...item,
        unlocked: isWordUnlocked(item.word),
      })),
    })),
  )
  const items = computed(() => chapters.value.flatMap((group) => group.words))
  const unlockedCount = computed(() => items.value.filter((item) => item.unlocked).length)

  return {
    chapters,
    items,
    unlockedCount,
    total: items.value.length,
    unlockWord,
    isWordUnlocked,
  }
}
