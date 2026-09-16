export type WarmupPhoneme = {
  ipa: string
  letter: string
  speak: string
}

export type WordArt = {
  emoji: string
  label: string
  image?: string
}

export function wordCardSrc(word: string): string {
  return `${import.meta.env.BASE_URL}word-cards/${word.toLowerCase()}.webp`
}

function clayArt(word: string, emoji: string): WordArt {
  return {
    emoji,
    label: word,
    image: wordCardSrc(word),
  }
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
      cat: clayArt('cat', '🐱'),
      hat: clayArt('hat', '🎩'),
      mat: clayArt('mat', '🧶'),
      bat: clayArt('bat', '🦇'),
      rat: clayArt('rat', '🐀'),
      cup: clayArt('cup', '🥤'),
      dog: clayArt('dog', '🐶'),
      pig: clayArt('pig', '🐷'),
      duck: clayArt('duck', '🦆'),
      bird: clayArt('bird', '🐦'),
      fish: clayArt('fish', '🐟'),
      cake: clayArt('cake', '🎂'),
      ball: clayArt('ball', '⚽'),
      sun: clayArt('sun', '☀️'),
      star: clayArt('star', '⭐'),
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

export function wordImage(word: string, family = getCurrentFamily()): string | undefined {
  return family.wordArt[word]?.image
}

/** Warm the browser cache for a small sampled set (gates / atlas extras). */
export function preloadWordCards(words: string[], family = getCurrentFamily()): void {
  if (typeof Image === 'undefined') return
  for (const word of words) {
    const src = wordImage(word, family)
    if (!src) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  }
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
  const picked = shuffledCopy(family.targets).slice(0, Math.min(count, family.targets.length))
  preloadWordCards(picked, family)
  return picked
}

export function pickOtherWords(
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  const blocked = new Set(exclude.map((word) => word.toLowerCase()))
  const pool = shuffledCopy(family.targets.filter((word) => !blocked.has(word.toLowerCase())))
  const picked = pool.slice(0, count)
  preloadWordCards(picked, family)
  return picked
}

export type AtlasWord = {
  word: string
  emoji: string
  image?: string
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
        image: family.wordArt[word]?.image,
        familyId: family.id,
        family: family.family,
      })
    }
  }
  return words
}
