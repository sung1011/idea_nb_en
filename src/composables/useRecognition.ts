export function canUseRecognition(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/** Permission, missing mic, or no network: the gate still finishes by tap. */
export function recognitionUnavailable(error: string): boolean {
  return (
    error === 'network' ||
    error === 'not-allowed' ||
    error === 'service-not-allowed' ||
    error === 'audio-capture'
  )
}

export function createRecognizer(handlers: {
  onResult: (transcript: string) => void
  onEnd?: () => void
  onError?: (error: string) => void
}) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = 'en-US'
  rec.continuous = false
  rec.interimResults = false
  rec.maxAlternatives = 3
  rec.onresult = (event) => {
    const bits: string[] = []
    for (let i = 0; i < event.results.length; i += 1) {
      bits.push(event.results[i][0].transcript)
    }
    handlers.onResult(bits.join(' ').trim())
  }
  rec.onerror = (event) => {
    handlers.onError?.(event.error)
    handlers.onEnd?.()
  }
  rec.onend = () => {
    handlers.onEnd?.()
  }
  return rec
}

function normalizeSaid(transcript: string): string {
  return transcript.toLowerCase().replace(/[^a-z]/g, '')
}

function looseScore(said: string, word: string): number {
  const target = word.toLowerCase()
  if (!said || !target) return 0
  if (said === target || said.includes(target)) return 3
  if (target.includes(said) && said.length >= 2) return 2
  if (target.length >= 2 && said.includes(target.slice(1))) return 1
  return 0
}

/** Always loose: any spoken attempt or a matching word counts. */
export function looselyHeard(transcript: string, word: string): boolean {
  const said = normalizeSaid(transcript)
  if (!said) return false
  if (looseScore(said, word) > 0) return true
  return said.length >= 2
}

/** Pick the best remaining word. Shared rime (e.g. “at”) takes the first remaining fish. */
export function matchSpokenWord(transcript: string, words: string[]): string | null {
  const said = normalizeSaid(transcript)
  if (!said) return null
  const ranked = words
    .map((word) => ({ word, score: looseScore(said, word) }))
    .filter((item) => item.score > 0)
  if (!ranked.length) return null
  ranked.sort((a, b) => b.score - a.score)
  const best = ranked[0]
  const ties = ranked.filter((item) => item.score === best.score)
  return ties[0]?.word ?? null
}
