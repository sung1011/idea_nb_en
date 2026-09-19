import { computed } from 'vue'
import { listAllFamilyWords } from '../data/phonicsFamily'
import { isWordUnlocked, unlockWord } from './progressStore'

const atlasWords = listAllFamilyWords()

export { isWordUnlocked, unlockWord }

export function useWordAtlas() {
  const items = computed(() =>
    atlasWords.map((item) => ({
      ...item,
      unlocked: isWordUnlocked(item.word),
    })),
  )
  const unlockedCount = computed(() => items.value.filter((item) => item.unlocked).length)
  const families = computed(() => {
    const groups: { family: string; items: typeof items.value }[] = []
    for (const item of items.value) {
      const last = groups[groups.length - 1]
      if (last && last.family === item.family) {
        last.items.push(item)
      } else {
        groups.push({ family: item.family, items: [item] })
      }
    }
    return groups
  })

  return {
    items,
    families,
    unlockedCount,
    total: atlasWords.length,
    unlockWord,
    isWordUnlocked,
  }
}
