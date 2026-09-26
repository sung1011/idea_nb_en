/** Words in first-seen order, lowercased. Same list the find scene speaks. */
export function findTargetWords(words: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of words) {
    const word = raw.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

/** Opening line of 找一找. No exclamation; that matches the spoken call. */
export function findOpeningLine(words: readonly string[]): string {
  const list = findTargetWords(words)
  if (!list.length) return ''
  return `Find the ${list.join(', ')}`
}

/** Cover line of 小书点读. The title is the Chinese lesson name. */
export function bookCoverLine(title: string): string {
  const name = title.trim()
  if (!name) return ''
  return `小书：《${name}》`
}
