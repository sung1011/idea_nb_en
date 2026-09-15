let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.08) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  amp.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.02)
}

export function playPop() {
  tone(520, 0, 0.12, 'triangle', 0.06)
}

export function playSuccess() {
  tone(523, 0, 0.16, 'sine', 0.07)
  tone(659, 0.08, 0.16, 'sine', 0.07)
  tone(784, 0.16, 0.22, 'sine', 0.07)
}

export function playNudge() {
  tone(330, 0, 0.14, 'sine', 0.05)
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
