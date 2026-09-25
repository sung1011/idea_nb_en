import { pickPraise, type PraiseKind } from '../data/praisePhrases'
import { speechLang, speechLookupKey } from '../audio/speechKey'

export { playNudge, playPop, playSuccess, playTap } from './useSfx'
export { pickPraise }
export type { PraiseKind }

/** One silent wav so the first tap can unlock audio on iOS. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

type ManifestClips = Record<string, string>

let clips: ManifestClips | null = null
let audio: HTMLAudioElement | null = null
let unlocked = false
let seq = 0
let currentResolve: (() => void) | null = null

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

function clipUrl(file: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${file.replace(/^\//, '')}`
}

function loadManifest(): void {
  const url = clipUrl('audio/manifest.json')
  void fetch(url)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { clips?: ManifestClips } | null) => {
      clips = data && data.clips && typeof data.clips === 'object' ? data.clips : {}
    })
    .catch(() => {
      clips = {}
    })
}

function element(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
  }
  return audio
}

function unlockAudio(): void {
  if (unlocked) return
  const el = element()
  if (el.src && !el.src.startsWith('data:')) {
    unlocked = true
    return
  }
  el.volume = 0
  el.src = SILENT_WAV
  const pending = el.play()
  el.volume = 1
  void pending
    .then(() => {
      unlocked = true
      if (el.src.startsWith('data:')) el.pause()
    })
    .catch(() => {
      unlocked = false
    })
}

if (typeof window !== 'undefined') {
  loadManifest()
  window.addEventListener('pointerdown', unlockAudio, { capture: true })
}

function releaseCurrent(): void {
  const resolve = currentResolve
  currentResolve = null
  resolve?.()
}

function systemSpeak(text: string, lang: string, rate: number, token: number): void {
  if (!window.speechSynthesis || seq !== token) {
    releaseCurrent()
    return
  }
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = rate
  utter.pitch = 1.12
  if (speechLang(lang) === 'zh-CN') {
    const voice = pickZhVoice()
    if (voice) utter.voice = voice
  }
  const finish = () => {
    if (seq !== token) return
    releaseCurrent()
  }
  utter.onend = finish
  utter.onerror = finish
  window.speechSynthesis.speak(utter)
}

function playClip(file: string, text: string, lang: string, rate: number, token: number): void {
  const el = element()
  let handed = false
  const fail = () => {
    if (seq !== token || handed) return
    handed = true
    el.onended = null
    el.onerror = null
    systemSpeak(text, lang, rate, token)
  }
  el.onended = null
  el.onerror = null
  el.pause()
  el.src = clipUrl(file)
  el.onended = () => {
    if (seq !== token || handed) return
    handed = true
    releaseCurrent()
  }
  el.onerror = fail
  void el.play().catch(fail)
}

export function speak(text: string, lang = 'en-US', rate = 0.86): Promise<void> {
  stopSpeech()
  const token = seq
  const line = text.trim()
  if (!line) return Promise.resolve()
  return new Promise((resolve) => {
    currentResolve = resolve
    const file = clips?.[speechLookupKey(line, lang)]
    if (!file) {
      systemSpeak(line, lang, rate, token)
      return
    }
    playClip(file, line, lang, rate, token)
  })
}

export function speakZh(text: string): Promise<void> {
  return speak(text, 'zh-CN')
}

export function stopSpeech(): void {
  seq += 1
  window.speechSynthesis?.cancel()
  if (audio) {
    audio.onended = null
    audio.onerror = null
    audio.pause()
  }
  releaseCurrent()
}
