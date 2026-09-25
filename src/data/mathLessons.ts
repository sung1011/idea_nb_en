/**
 * Config for math lessons. Each lesson is exactly four numbers.
 * Each key is one lesson of four numbers. Numbers stay off the phonics atlas.
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
  'ch7-k2': [
    { value: 6, word: 'six', zh: '六', sentence: 'Five and one more is six.' },
    { value: 7, word: 'seven', zh: '七', sentence: 'Six and one more is seven.' },
    { value: 8, word: 'eight', zh: '八', sentence: 'Seven and one more is eight.' },
    { value: 9, word: 'nine', zh: '九', sentence: 'Eight and one more is nine.' },
  ],
  'ch8-k1': [
    { value: 0, word: 'zero', zh: '零', sentence: 'One fewer than one is zero.' },
    { value: 11, word: 'eleven', zh: '十一', sentence: 'One fewer than twelve is eleven.' },
    { value: 12, word: 'twelve', zh: '十二', sentence: 'One fewer than thirteen is twelve.' },
    { value: 13, word: 'thirteen', zh: '十三', sentence: 'One fewer than fourteen is thirteen.' },
  ],
  'ch10-k4': [
    { value: 5, word: 'five', zh: '五', sentence: 'Clap for five.' },
    { value: 10, word: 'ten', zh: '十', sentence: 'Clap for ten.' },
    { value: 15, word: 'fifteen', zh: '十五', sentence: 'Clap for fifteen.' },
    { value: 20, word: 'twenty', zh: '二十', sentence: 'Clap for twenty.' },
  ],
  'ch12-k1': [
    { value: 4, word: 'four', zh: '四', sentence: 'Skip to four!' },
    { value: 14, word: 'fourteen', zh: '十四', sentence: 'Skip to fourteen!' },
    { value: 16, word: 'sixteen', zh: '十六', sentence: 'Skip to sixteen!' },
    { value: 18, word: 'eighteen', zh: '十八', sentence: 'Skip to eighteen!' },
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
