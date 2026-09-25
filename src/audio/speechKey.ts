/** English neural voice. Rate matches the old speechSynthesis rate of 0.86. */
export const EN_SPEECH = { lang: 'en-US', voice: 'en-US-AnaNeural', rate: '-12%' } as const

/** Chinese neural voice at the service default rate. */
export const ZH_SPEECH = { lang: 'zh-CN', voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%' } as const

export type SpeechLang = 'en-US' | 'zh-CN'

export function speechLang(lang: string): SpeechLang {
  return lang.toLowerCase().replace('_', '-').startsWith('zh') ? 'zh-CN' : 'en-US'
}

/** Trim and collapse whitespace. Case and punctuation stay, so "I" and "i" do not collide. */
export function normalizeSpeechText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Manifest key: language plus the normalized line. */
export function speechLookupKey(text: string, lang: string): string {
  return `${speechLang(lang)}\n${normalizeSpeechText(text)}`
}
