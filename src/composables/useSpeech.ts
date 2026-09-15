import { pickPraise, type PraiseKind } from '../data/praisePhrases'

export { playNudge, playPop, playSuccess, playTap } from './useSfx'
export { pickPraise }
export type { PraiseKind }

export async function speakPraise(kind: PraiseKind): Promise<string> {
  const line = pickPraise(kind)
  await speak(line)
  return line
}

export function speak(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.86
    utter.pitch = 1.12
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
