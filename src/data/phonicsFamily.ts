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
    targets: ['cap', 'map', 'nap', 'tap', 'lap'],
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
      tap: { emoji: '🚰', label: 'tap' },
      lap: { emoji: '🦵', label: 'lap' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-og': {
    id: '-og',
    family: '-og',
    targets: ['frog', 'log', 'fog', 'jog', 'hog'],
    distractors: ['d', 'b', 'p', 't', 's', 'h'],
    warmupPhonemes: [
      { ipa: '/f/', letter: 'F', speak: 'f' },
      { ipa: '/l/', letter: 'L', speak: 'l' },
      { ipa: '/j/', letter: 'J', speak: 'j' },
    ],
    wordArt: {
      frog: { emoji: '🐸', label: 'frog' },
      log: clayArt('log', '🪵'),
      fog: { emoji: '🌫️', label: 'fog' },
      jog: { emoji: '🏃', label: 'jog' },
      hog: { emoji: '🐖', label: 'hog' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-ck': {
    id: '-ck',
    family: '-ck',
    targets: ['duck', 'rock', 'sock', 'lock', 'pack'],
    distractors: ['s', 't', 'b', 'p', 'h', 'r'],
    warmupPhonemes: [
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/r/', letter: 'R', speak: 'r' },
      { ipa: '/s/', letter: 'S', speak: 's' },
    ],
    wordArt: {
      duck: clayArt('duck', '🦆'),
      rock: { emoji: '🪨', label: 'rock' },
      sock: { emoji: '🧦', label: 'sock' },
      lock: { emoji: '🔒', label: 'lock' },
      pack: { emoji: '📦', label: 'pack' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-1': {
    id: 'rise-1',
    family: 'rise-1',
    targets: [
      'hop',
      'pot',
      'top',
      'mop',
      'log',
      'van',
      'vet',
      'lip',
      'leg',
      'lid',
      'kid',
      'kit',
      'keg',
      'kick',
    ],
    distractors: ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 't', 'f'],
    warmupPhonemes: [
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/v/', letter: 'V', speak: 'v' },
      { ipa: '/l/', letter: 'L', speak: 'l' },
      { ipa: '/k/', letter: 'K', speak: 'k' },
    ],
    wordArt: {
      hop: clayArt('hop', '🐇'),
      pot: clayArt('pot', '🍲'),
      top: clayArt('top', '🪀'),
      mop: clayArt('mop', '🧹'),
      log: clayArt('log', '🪵'),
      van: clayArt('van', '🚐'),
      vet: clayArt('vet', '🩺'),
      lip: clayArt('lip', '👄'),
      leg: clayArt('leg', '🦵'),
      lid: clayArt('lid', '🫙'),
      kid: clayArt('kid', '🧒'),
      kit: clayArt('kit', '🧰'),
      keg: clayArt('keg', '🛢️'),
      kick: clayArt('kick', '👟'),
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

export function familyForWord(word: string): PhonicsFamily {
  const key = word.trim().toLowerCase()
  if (!key) return getCurrentFamily()
  for (const family of Object.values(families)) {
    if (family.wordArt[key] || family.targets.includes(key)) return family
  }
  return getCurrentFamily()
}

export function wordEmoji(word: string, family = familyForWord(word)): string {
  return family.wordArt[word.trim().toLowerCase()]?.emoji ?? '✨'
}

export function wordImage(word: string, family = familyForWord(word)): string | undefined {
  return family.wordArt[word.trim().toLowerCase()]?.image
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

function uniqueWords(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const word = raw.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

/** Shuffle a custom pool (chapter / level lists) and take a short subset. */
export function sampleFromPool(pool: string[], count: number, family = getCurrentFamily()): string[] {
  const unique = uniqueWords(pool)
  const picked = shuffledCopy(unique).slice(0, Math.min(Math.max(0, count), unique.length))
  preloadWordCards(picked, family)
  return picked
}

export function pickOtherFromPool(
  pool: string[],
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  const blocked = new Set(exclude.map((word) => word.toLowerCase()))
  const candidates = uniqueWords(pool).filter((word) => !blocked.has(word))
  const picked = shuffledCopy(candidates).slice(0, Math.max(0, count))
  preloadWordCards(picked, family)
  return picked
}

/** One-run subset so a session stays short. */
export function sampleWords(count: number, family = getCurrentFamily()): string[] {
  return sampleFromPool(family.targets, count, family)
}

export function pickOtherWords(
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  return pickOtherFromPool(family.targets, exclude, count, family)
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
