/**
 * Config for math lessons. Each lesson is exactly four numbers.
 * Later lessons only need another key here (课26 `ch7-k2`、课29 `ch8-k1`、课40 `ch10-k4`、课45 `ch12-k1`).
 * Numbers stay off the phonics atlas: no word-card art, and “one hundred” is a poor atlas key.
 */
export type MathItem = {
  value: number
  word: string
  zh: string
  sentence: string
}

export const MATH_LESSONS: Record<string, MathItem[]> = {
  'ch5-k1': [
    { value: 50, word: 'fifty', zh: '五十', sentence: 'Count to fifty.' },
    { value: 70, word: 'seventy', zh: '七十', sentence: 'Count to seventy.' },
    { value: 90, word: 'ninety', zh: '九十', sentence: 'Count to ninety.' },
    { value: 100, word: 'one hundred', zh: '一百', sentence: 'Count to one hundred.' },
  ],
}

const ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
]

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** English count word for a tap on the nth object or ten-bar. */
export function countAloud(n: number): string {
  if (n === 100) return 'one hundred'
  if (n > 0 && n <= 20) return ONES[n]
  if (n > 20 && n < 100 && n % 10 === 0) return TENS[n / 10]
  if (n > 20 && n < 100) {
    const ten = Math.floor(n / 10)
    const one = n % 10
    if (TENS[ten] && ONES[one]) return `${TENS[ten]}-${ONES[one]}`
  }
  return String(n)
}

export type CountPiece = {
  kind: 'ten' | 'one'
  speak: string
  index: number
}

/**
 * Values ≤20 are single objects. Bigger values are groups of ten,
 * plus leftover ones when the value is not a multiple of ten.
 */
export function countPieces(value: number): { tens: CountPiece[]; ones: CountPiece[] } {
  const safe = Math.max(0, Math.floor(value))
  if (safe <= 20) {
    return {
      tens: [],
      ones: Array.from({ length: safe }, (_, index) => ({
        kind: 'one' as const,
        speak: countAloud(index + 1),
        index,
      })),
    }
  }
  const tenCount = Math.floor(safe / 10)
  const oneCount = safe % 10
  return {
    tens: Array.from({ length: tenCount }, (_, index) => ({
      kind: 'ten' as const,
      speak: countAloud((index + 1) * 10),
      index,
    })),
    ones: Array.from({ length: oneCount }, (_, index) => ({
      kind: 'one' as const,
      speak: countAloud(tenCount * 10 + index + 1),
      index,
    })),
  }
}
