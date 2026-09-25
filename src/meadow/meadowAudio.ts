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

/** Short giggle chirps while two animals tumble. */
export function playGiggle(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  const notes = [880, 1040, 920, 1180, 990, 1240]
  notes.forEach((freq, index) => tone(context, start + index * 0.09, freq, 0.07, 0.04))
}

/** Bright little arpeggio when a whole heart fills. */
export function playHeartChime(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  tone(context, start, 660, 0.12, 0.05)
  tone(context, start + 0.1, 880, 0.14, 0.05)
  tone(context, start + 0.2, 1320, 0.22, 0.04)
}

function noiseBurst(context: AudioContext, when: number, seconds: number, peak: number, lowpass: number) {
  const count = Math.max(1, Math.floor(context.sampleRate * seconds))
  const buffer = context.createBuffer(1, count, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(lowpass, when)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start(when)
  source.stop(when + seconds + 0.02)
}

/** Soft splash when the pond is tapped or someone jumps in. */
export function playWater(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  noiseBurst(context, start, 0.22, 0.07, 780)
  tone(context, start + 0.02, 480, 0.12, 0.03)
  tone(context, start + 0.1, 360, 0.14, 0.025)
}

/** Two quiet notes when petals leave the flower bed. */
export function playSoftChime(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  tone(context, start, 620, 0.16, 0.035)
  tone(context, start + 0.09, 880, 0.2, 0.03)
}

/** A few wood-pop crackles for the campfire. */
export function playCrackle(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  for (let i = 0; i < 4; i += 1) {
    noiseBurst(context, start + i * 0.07, 0.045, 0.045, 1800 + i * 200)
  }
}

/** Soft puff when something drops into the storage basket. */
export function playPoof(): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  noiseBurst(context, start, 0.16, 0.045, 980)
  tone(context, start, 480, 0.08, 0.02)
  tone(context, start + 0.05, 280, 0.12, 0.016)
}

/** Short ding when a dragged pet first enters a decoration. Hungry pets get one quieter note. */
export function playDropDing(soft = false): void {
  const context = audio()
  if (!context) return
  const start = context.currentTime
  if (soft) {
    tone(context, start, 480, 0.08, 0.016)
    return
  }
  tone(context, start, 784, 0.08, 0.034)
  tone(context, start + 0.06, 1046, 0.1, 0.026)
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
