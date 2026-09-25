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
