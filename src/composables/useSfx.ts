import { Howl } from 'howler'

type WaveKind = 'sine' | 'triangle'

type ToneNote = {
  freq: number
  startMs: number
  durMs: number
  kind?: WaveKind
}

function sampleWave(kind: WaveKind, freq: number, t: number): number {
  if (kind === 'triangle') {
    const phase = (freq * t) % 1
    return 1 - 4 * Math.abs(phase - 0.5)
  }
  return Math.sin(2 * Math.PI * freq * t)
}

function envelope(i: number, len: number): number {
  const attack = Math.min(32, Math.floor(len / 6))
  const release = Math.min(64, Math.floor(len / 3))
  if (i < attack) return i / attack
  if (i > len - release) return Math.max(0, (len - i) / release)
  return 1
}

function wavUrl(notes: ToneNote[], totalMs: number): string {
  const sampleRate = 22050
  const count = Math.ceil((totalMs / 1000) * sampleRate)
  const pcm = new Int16Array(count)

  for (const note of notes) {
    const start = Math.floor((note.startMs / 1000) * sampleRate)
    const len = Math.floor((note.durMs / 1000) * sampleRate)
    const kind = note.kind ?? 'sine'
    for (let i = 0; i < len && start + i < count; i += 1) {
      const t = i / sampleRate
      const sample = sampleWave(kind, note.freq, t) * envelope(i, len) * 0.42
      const mixed = pcm[start + i] + Math.round(sample * 32767)
      pcm[start + i] = Math.max(-32767, Math.min(32767, mixed))
    }
  }

  const bytes = new Uint8Array(44 + count * 2)
  const view = new DataView(bytes.buffer)
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + count * 2, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, count * 2, true)
  bytes.set(new Uint8Array(pcm.buffer), 44)
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
}

function makeHowl(notes: ToneNote[], totalMs: number, volume: number): Howl {
  return new Howl({
    src: [wavUrl(notes, totalMs)],
    format: ['wav'],
    volume,
    preload: true,
  })
}

const tapHowl = makeHowl([{ freq: 620, startMs: 0, durMs: 90, kind: 'triangle' }], 110, 0.32)
const nudgeHowl = makeHowl([{ freq: 280, startMs: 0, durMs: 140 }], 160, 0.26)
const successHowl = makeHowl(
  [
    { freq: 523, startMs: 0, durMs: 140 },
    { freq: 659, startMs: 90, durMs: 140 },
    { freq: 784, startMs: 180, durMs: 200 },
  ],
  420,
  0.3,
)

export function playTap() {
  tapHowl.play()
}

export function playPop() {
  playTap()
}

export function playNudge() {
  nudgeHowl.play()
}

export function playSuccess() {
  successHowl.play()
}
