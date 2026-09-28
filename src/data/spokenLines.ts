/** Cover line of 小书点读. The title is the Chinese lesson name. */
export function bookCoverLine(title: string): string {
  const name = title.trim()
  if (!name) return ''
  return `小书：《${name}》`
}
