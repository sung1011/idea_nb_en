import { pickPraise, type PraiseKind } from '../data/praisePhrases'

export { playNudge, playPop, playSuccess, playTap } from './useSfx'
export { pickPraise }
export type { PraiseKind }

export async function speakPraise(kind: PraiseKind): Promise<string> {
  const line = pickPraise(kind)
  await speak(line)
  return line
}

function pickZhVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return (
    voices.find((voice) => /^zh[-_]cn/i.test(voice.lang)) ??
    voices.find((voice) => /^zh/i.test(voice.lang))
  )
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}

export function speak(text: string, lang = 'en-US', rate = 0.86): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !text.trim()) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1.12
    if (lang.toLowerCase().replace('_', '-').startsWith('zh')) {
      const voice = pickZhVoice()
      if (voice) utter.voice = voice
    }
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.speechSynthesis.speak(utter)
  })
}

export function speakZh(text: string): Promise<void> {
  return speak(text, 'zh-CN')
}

export function stopSpeech() {
  window.speechSynthesis?.cancel()
}
