import { computed, reactive } from 'vue'
import { listAllFamilyWords } from '../data/phonicsFamily'

const STORAGE_KEY = 'starWords.atlas.v1'

type AtlasPersist = {
  words?: unknown
}

function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AtlasPersist
    if (!Array.isArray(parsed.words)) return []
    return parsed.words
      .filter((word): word is string => typeof word === 'string')
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean)
  } catch {
    return []
  }
}

const atlasWords = listAllFamilyWords()
const knownWords = new Set(atlasWords.map((item) => item.word.toLowerCase()))

const state = reactive({
  unlocked: loadUnlocked(),
})

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ words: state.unlocked }))
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase()
}

/** First successful use of a family word. Does not award daily stars. */
export function unlockWord(word: string): boolean {
  const key = normalizeWord(word)
  if (!key || !knownWords.has(key) || state.unlocked.includes(key)) return false
  state.unlocked.push(key)
  persist()
  return true
}

export function isWordUnlocked(word: string): boolean {
  return state.unlocked.includes(normalizeWord(word))
}

export function useWordAtlas() {
  const items = computed(() =>
    atlasWords.map((item) => ({
      ...item,
      unlocked: state.unlocked.includes(item.word.toLowerCase()),
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
