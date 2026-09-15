export type WarmupPhoneme = {
  ipa: string
  letter: string
  speak: string
}

export type WordArt = {
  emoji: string
  label: string
}

export type PhonicsFamily = {
  id: string
  family: string
  targets: string[]
  distractors: string[]
  warmupPhonemes: WarmupPhoneme[]
  wordArt: Record<string, WordArt>
  rewards: {
    soundFishSticker: { id: string; label: string }
  }
}

export const families: Record<string, PhonicsFamily> = {
  '-at': {
    id: '-at',
    family: '-at',
    targets: [
      'cat',
      'hat',
      'mat',
      'bat',
      'rat',
      'cup',
      'dog',
      'pig',
      'duck',
      'bird',
      'fish',
      'cake',
      'ball',
      'sun',
      'star',
    ],
    distractors: ['s', 'b', 'p', 't', 'd', 'r'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'K', speak: 'k' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
    ],
    // Animals island word bank: cat hosts; others are party friends / props.
    wordArt: {
      cat: { emoji: '🐱', label: 'cat' },
      hat: { emoji: '🎩', label: 'hat' },
      mat: { emoji: '🧶', label: 'mat' },
      bat: { emoji: '🦇', label: 'bat' },
      rat: { emoji: '🐀', label: 'rat' },
      cup: { emoji: '🥤', label: 'cup' },
      dog: { emoji: '🐶', label: 'dog' },
      pig: { emoji: '🐷', label: 'pig' },
      duck: { emoji: '🦆', label: 'duck' },
      bird: { emoji: '🐦', label: 'bird' },
      fish: { emoji: '🐟', label: 'fish' },
      cake: { emoji: '🎂', label: 'cake' },
      ball: { emoji: '⚽', label: 'ball' },
      sun: { emoji: '☀️', label: 'sun' },
      star: { emoji: '⭐', label: 'star' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '派对耳朵' },
    },
  },
  '-ap': {
    id: '-ap',
    family: '-ap',
    targets: ['cap', 'map', 'nap'],
    distractors: ['s', 'b', 't', 'd', 'r', 'h'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
    ],
    wordArt: {
      cap: { emoji: '🧢', label: 'cap' },
      map: { emoji: '🗺️', label: 'map' },
      nap: { emoji: '😴', label: 'nap' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-an': {
    id: '-an',
    family: '-an',
    targets: ['can', 'man', 'pan'],
    distractors: ['s', 'b', 't', 'd', 'r', 'h'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
    ],
    wordArt: {
      can: { emoji: '🥫', label: 'can' },
      man: { emoji: '👨', label: 'man' },
      pan: { emoji: '🍳', label: 'pan' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
}

/** Swap this id to ship -ap / -an later. */
export const currentFamilyId = '-at'

export function getCurrentFamily(): PhonicsFamily {
  return families[currentFamilyId] ?? families['-at']
}

export function wordEmoji(word: string, family = getCurrentFamily()): string {
  return family.wordArt[word]?.emoji ?? '✨'
}

function shuffledCopy<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** One-run subset so a session stays short. */
export function sampleWords(count: number, family = getCurrentFamily()): string[] {
  return shuffledCopy(family.targets).slice(0, Math.min(count, family.targets.length))
}

export function pickOtherWords(
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  const blocked = new Set(exclude.map((word) => word.toLowerCase()))
  const pool = shuffledCopy(family.targets.filter((word) => !blocked.has(word.toLowerCase())))
  return pool.slice(0, count)
}

export type AtlasWord = {
  word: string
  emoji: string
  familyId: string
  family: string
}

/** Every phonics-family target is a Word Atlas slot, including unused families. */
export function listAllFamilyWords(): AtlasWord[] {
  const seen = new Set<string>()
  const words: AtlasWord[] = []
  for (const family of Object.values(families)) {
    for (const word of family.targets) {
      const key = word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      words.push({
        word,
        emoji: wordEmoji(word, family),
        familyId: family.id,
        family: family.family,
      })
    }
  }
  return words
}
