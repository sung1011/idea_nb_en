import { computed } from 'vue'
import { listAllFamilyWords } from '../data/phonicsFamily'
import { isWordUnlocked, markWordSeen, persistState } from './progressStore'

const atlasWords = listAllFamilyWords()

/** First successful use of a family word. Does not award daily stars. */
export function unlockWord(word: string): boolean {
  return markWordSeen(word)
}

export { isWordUnlocked }

export function useWordAtlas() {
  const items = computed(() =>
    atlasWords.map((item) => ({
      ...item,
      unlocked: persistState.lifetime.unlockedWords.includes(item.word.toLowerCase()),
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
