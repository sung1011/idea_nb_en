export { playNudge, playPop, playSuccess, playTap } from './useSfx'

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
