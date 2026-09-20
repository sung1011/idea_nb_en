import { getLevel, type LevelDef, type PlayKind } from './chapters'
import { pickOtherFromPool, pickOtherWords, preloadWordCards, sampleFromPool, sampleWords } from './phonicsFamily'

export function queryLevelValue(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value ? value : null
}

/** `?level=` wins only when it is a known level of this play. */
export function matchingLevel(play: PlayKind, raw: unknown): LevelDef | undefined {
  const id = queryLevelValue(raw)
  if (!id) return undefined
  const def = getLevel(id)
  return def && def.play === play ? def : undefined
}

/**
 * Mainline / practice with a chapter level use that level's list.
 * Demo / review / gallery without `?level=` keep the 15-word family sample.
 */
export function shouldUseLevelWords(opts: {
  play: PlayKind
  rawLevel: unknown
  isDemo: boolean
  isReview: boolean
  resolvedLevel?: LevelDef | null
}): boolean {
  if (matchingLevel(opts.play, opts.rawLevel)) return true
  if (opts.isDemo || opts.isReview) return false
  return Boolean(opts.resolvedLevel)
}

/** focusWord first, then appearWords, then words — de-duplicated. */
export function levelWordList(level?: LevelDef | null): string[] {
  if (!level) return []
  const seen = new Set<string>()
  const out: string[] = []
  const add = (word?: string) => {
    if (!word) return
    const key = word.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(key)
  }
  add(level.focusWord)
  for (const word of level.appearWords ?? []) add(word)
  for (const word of level.words ?? []) add(word)
  return out
}

/** Full configured list for a run (shuffled; focus stays first). Fallback: family sample. */
export function sampleGateWords(opts: {
  level?: LevelDef | null
  useLevel: boolean
  count: number
}): string[] {
  if (opts.useLevel) {
    const list = levelWordList(opts.level)
    if (list.length) {
      const focus = opts.level?.focusWord?.trim().toLowerCase()
      if (focus && list.includes(focus)) {
        const rest = sampleFromPool(
          list.filter((word) => word !== focus),
          list.length,
        )
        const words = [focus, ...rest]
        preloadWordCards(words)
        return words
      }
      return sampleFromPool(list, list.length)
    }
  }
  return sampleWords(opts.count)
}

export function pickGateOtherWords(opts: {
  level?: LevelDef | null
  useLevel: boolean
  exclude: string[]
  count?: number
}): string[] {
  const count = opts.count ?? 1
  if (opts.useLevel) {
    return pickOtherFromPool(levelWordList(opts.level), opts.exclude, count)
  }
  return pickOtherWords(opts.exclude, count)
}
