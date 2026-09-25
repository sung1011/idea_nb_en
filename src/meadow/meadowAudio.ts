let ctx: AudioContext | null = null
let lastChirp = 0

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Soft happy chirp while the child strokes an animal. No audio files. */
export function playPetChirp(): void {
  const now = performance.now()
  if (now - lastChirp < 380) return
  const context = audio()
  if (!context) return
  lastChirp = now
  const start = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(620, start)
  osc.frequency.exponentialRampToValueAtTime(920, start + 0.12)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.06, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(start)
  osc.stop(start + 0.22)
}

function tone(context: AudioContext, when: number, freq: number, ms: number, peak: number) {
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, when)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + ms)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(when)
  osc.stop(when + ms + 0.02)
}

/** Two or three soft bites. Not a failure sound. */
export function playChomp(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  tone(context, start, 280, 0.08, 0.05)
  tone(context, start + 0.14, 240, 0.08, 0.045)
  tone(context, start + 0.28, 300, 0.09, 0.04)
}

/** Quiet yawn when food meets a napping animal. */
export function playSleepySigh(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(240, start)
  osc.frequency.exponentialRampToValueAtTime(150, start + 0.28)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.04, start + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(start)
  osc.stop(start + 0.34)
}

/** Soft boing when a treat flies home. */
export function playBoing(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, start)
  osc.frequency.exponentialRampToValueAtTime(340, start + 0.12)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.045, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(start)
  osc.stop(start + 0.22)
}
