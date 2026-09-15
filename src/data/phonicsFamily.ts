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
  rime: string
  targets: string[]
  onsetPool: string[]
  distractors: string[]
  warmupPhonemes: WarmupPhoneme[]
  wordArt: Record<string, WordArt>
  morphSequence: string[]
  rewards: {
    soundFishSticker: { id: string; label: string }
    wordMorphDecoration: { id: string; label: string }
  }
}

export const families: Record<string, PhonicsFamily> = {
  '-at': {
    id: '-at',
    family: '-at',
    rime: 'at',
    targets: ['cat', 'hat', 'mat'],
    onsetPool: ['c', 'h', 'm'],
    distractors: ['s', 'b', 'p', 't', 'd', 'r'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'K', speak: 'k' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
    ],
    wordArt: {
      cat: { emoji: '🐱', label: 'cat' },
      hat: { emoji: '🎩', label: 'hat' },
      mat: { emoji: '🧶', label: 'mat' },
    },
    morphSequence: ['cat', 'hat', 'mat', 'cat'],
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
      wordMorphDecoration: { id: 'rug', label: '小地毯' },
    },
  },
  '-ap': {
    id: '-ap',
    family: '-ap',
    rime: 'ap',
    targets: ['cap', 'map', 'nap'],
    onsetPool: ['c', 'm', 'n'],
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
    morphSequence: ['cap', 'map', 'nap', 'cap'],
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
      wordMorphDecoration: { id: 'cap', label: '小帽子' },
    },
  },
  '-an': {
    id: '-an',
    family: '-an',
    rime: 'an',
    targets: ['can', 'man', 'pan'],
    onsetPool: ['c', 'm', 'p'],
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
    morphSequence: ['can', 'man', 'pan', 'can'],
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
      wordMorphDecoration: { id: 'pan', label: '小锅子' },
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
