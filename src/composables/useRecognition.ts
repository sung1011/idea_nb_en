export function canUseRecognition(): boolean {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function createRecognizer(handlers: {
  onResult: (transcript: string) => void
  onEnd?: () => void
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
  rec.onerror = () => {
    handlers.onEnd?.()
  }
  rec.onend = () => {
    handlers.onEnd?.()
  }
  return rec
}

/** Always loose: any spoken attempt or a matching word counts. */
export function looselyHeard(transcript: string, word: string): boolean {
  const said = transcript.toLowerCase().replace(/[^a-z]/g, '')
  if (!said) return false
  const target = word.toLowerCase()
  if (said.includes(target)) return true
  if (target.length >= 2 && said.includes(target.slice(1))) return true
  return said.length >= 2
}
