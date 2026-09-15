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
    targets: ['cat', 'hat', 'mat'],
    distractors: ['s', 'b', 'p', 't', 'd', 'r'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'K', speak: 'k' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
    ],
    // Animals island: cat hosts the party; hat/mat are party props, not animals.
    wordArt: {
      cat: { emoji: '🐱', label: 'cat' },
      hat: { emoji: '🎩', label: 'hat' },
      mat: { emoji: '🧶', label: 'mat' },
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
  return family.wordArt[word]?.emoji ?? '⭐'
}
