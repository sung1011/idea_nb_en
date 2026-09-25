import { getCurrentFamily } from './phonicsFamily'

export type SpellTile = {
  id: string
  ch: string
}

const FALLBACK_LETTERS = ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 'g', 'f']

function shuffledCopy<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function wordLetters(word: string): string[] {
  return word
    .trim()
    .toLowerCase()
    .split('')
    .filter((ch) => /[a-z]/.test(ch))
}

function uniqueWords(pool: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of pool) {
    const word = raw.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

function rime(word: string): string {
  return word.slice(-2)
}

function similarScore(target: string, other: string): number {
  let score = 0
  if (other.length === target.length) score += 4
  if (rime(other) === rime(target)) score += 6
  if (other[0] === target[0]) score += 2
  for (const ch of other) {
    if (target.includes(ch)) score += 1
  }
  return score
}

/** Nearby CVC / same-length words first (hat/mat for cat, pig for dog). */
export function similarCvcWords(target: string, pool: string[]): string[] {
  const key = target.trim().toLowerCase()
  return uniqueWords(pool)
    .filter((word) => word !== key)
    .sort((a, b) => similarScore(key, b) - similarScore(key, a))
}

/**
 * 1–2 extra letters. Prefer onsets of similar words in the pool.
 * Outside a lesson, fall back to the family distractor list.
 */
export function pickDistractorLetters(
  target: string,
  pool: string[],
  count = 2,
  strict = false,
): string[] {
  const want = Math.min(2, Math.max(1, count))
  const letters = wordLetters(target)
  const blocked = new Set(letters)
  const picked: string[] = []
  const take = (raw: string | undefined) => {
    if (!raw) return
    const ch = raw.toLowerCase()
    if (!/[a-z]/.test(ch) || blocked.has(ch) || picked.includes(ch)) return
    picked.push(ch)
  }

  const similar = similarCvcWords(target, pool)
  for (const word of similar) take(word[0])
  for (const word of similar) {
    for (const ch of wordLetters(word)) take(ch)
  }
  if (!strict) {
    for (const ch of shuffledCopy(getCurrentFamily().distractors)) take(ch)
    for (const ch of FALLBACK_LETTERS) take(ch)
  }

  if (picked.length >= 2) return picked.slice(0, want)
  return picked.slice(0, Math.min(want, Math.max(1, picked.length)))
}

export function buildSpellTiles(
  target: string,
  pool: string[],
  extraCount = 2,
  opts?: { strict?: boolean },
): SpellTile[] {
  const letters = wordLetters(target)
  const source = opts?.strict ? pool : [...pool, ...getCurrentFamily().targets]
  const extras = pickDistractorLetters(target, source, extraCount, opts?.strict ?? false)
  return shuffledCopy([
    ...letters.map((ch, index) => ({ id: `need-${index}-${ch}`, ch })),
    ...extras.map((ch, index) => ({ id: `extra-${index}-${ch}`, ch })),
  ])
}

export function nextEmptySlot(slots: Array<string | null>): number {
  return slots.findIndex((slot) => !slot)
}
