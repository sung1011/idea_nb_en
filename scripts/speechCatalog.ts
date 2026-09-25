import { CHAPTERS } from '../src/data/chapters'
import { MATH_LESSONS, countPieces } from '../src/data/mathLessons'
import { families, wordZh } from '../src/data/phonicsFamily'
import { finishPhrases, softPhrases, stepPhrases } from '../src/data/praisePhrases'
import { sentenceForWord, shortSentences } from '../src/data/shortSentences'
import { gateBookBlendHint } from '../src/data/todayTasks'
import { EN_SPEECH, ZH_SPEECH, normalizeSpeechText, speechLookupKey, type SpeechLang } from '../src/audio/speechKey'
import {
  MEADOW_DECORATIONS,
  MEADOW_FOODS,
  MEADOW_ROSTER,
  introLine,
  yumLine,
} from '../src/meadow/meadowConfig'

export type CatalogClip = {
  key: string
  text: string
  lang: SpeechLang
  voice: string
  rate: string
}

/**
 * Spoken lines that stay on speechSynthesis.
 * Isolated phonemes are omitted on purpose. The other rows are built at runtime.
 */
export const dynamicFallbacks = [
  {
    where: '唱一唱逐个字母',
    example: 'c / a / t',
    why: '单字母音素，沿用系统语音',
  },
  {
    where: '音族热身',
    example: 'k、qu、ch',
    why: '音素不是单词，不生成',
  },
  {
    where: '找一找开场',
    example: 'Find the cap, map, nap',
    why: '三个词临时拼在一起，组合不固定',
  },
  {
    where: '小书封面',
    example: '小书：《字母 O · I》',
    why: '课名拼进句子，每次书名不同',
  },
] as const

const phonemeTokens = new Set<string>()
for (const family of Object.values(families)) {
  for (const phoneme of family.warmupPhonemes) {
    const token = phoneme.speak.trim().toLowerCase()
    if (token) phonemeTokens.add(token)
  }
}

function isIsolatedPhoneme(text: string): boolean {
  if (/^[A-Za-z]$/.test(text)) return true
  const token = text.toLowerCase()
  return phonemeTokens.has(token) && token.length <= 3
}

const seen = new Set<string>()
const clips: CatalogClip[] = []

function addClip(raw: string, lang: SpeechLang) {
  const text = normalizeSpeechText(raw)
  if (!text) return
  if (lang === 'en-US' && isIsolatedPhoneme(text)) return
  const key = speechLookupKey(text, lang)
  if (seen.has(key)) return
  seen.add(key)
  const voice = lang === 'zh-CN' ? ZH_SPEECH : EN_SPEECH
  clips.push({ key, text, lang, voice: voice.voice, rate: voice.rate })
}

function addWord(raw: string | undefined) {
  if (!raw) return
  const text = normalizeSpeechText(raw)
  if (!text || isIsolatedPhoneme(text)) return
  addClip(text, 'en-US')
  addClip(`Find the ${text}!`, 'en-US')
  addClip(sentenceForWord(text), 'en-US')
  const zh = wordZh(text)
  if (zh) addClip(zh, 'zh-CN')
}

const words = new Set<string>()
function noteWord(raw: string | undefined) {
  const text = raw?.trim()
  if (text) words.add(text)
}

for (const chapter of CHAPTERS) {
  for (const word of chapter.words) noteWord(word)
  for (const lesson of chapter.lessons) {
    if (lesson.sentence) addClip(lesson.sentence, 'en-US')
    for (const word of lesson.words) noteWord(word)
    for (const word of lesson.sightWords) noteWord(word)
    for (const level of lesson.levels) {
      noteWord(level.focusWord)
      for (const word of level.words ?? []) noteWord(word)
      for (const word of level.appearWords ?? []) noteWord(word)
      for (const page of level.storyPages ?? []) {
        noteWord(page.word)
        addClip(page.line, 'en-US')
      }
      for (const item of level.numbers ?? []) {
        noteWord(item.word)
        addClip(item.sentence, 'en-US')
        addClip(item.zh, 'zh-CN')
      }
    }
  }
}

for (const family of Object.values(families)) {
  for (const word of family.targets) noteWord(word)
  for (const word of family.distractors) noteWord(word)
  for (const word of Object.keys(family.wordArt)) noteWord(word)
}

for (const lesson of Object.values(MATH_LESSONS)) {
  for (const item of lesson) {
    noteWord(item.word)
    addClip(item.sentence, 'en-US')
    addClip(item.zh, 'zh-CN')
    for (const piece of [...countPieces(item.value).tens, ...countPieces(item.value).ones]) {
      addClip(piece.speak, 'en-US')
    }
  }
}

for (const sentence of Object.values(shortSentences)) addClip(sentence, 'en-US')

for (const line of [...stepPhrases, ...finishPhrases, ...softPhrases]) addClip(line, 'en-US')

for (const animal of MEADOW_ROSTER) {
  noteWord(animal.name)
  addClip(introLine(animal.name), 'en-US')
}

for (const food of MEADOW_FOODS) {
  noteWord(food.name)
  addClip(yumLine(food.id, false), 'en-US')
  addClip(yumLine(food.id, true), 'en-US')
}

for (const decor of MEADOW_DECORATIONS) {
  addClip(decor.line, 'en-US')
  if (decor.wakeLine) addClip(decor.wakeLine, 'en-US')
}

addClip("Let's play!", 'en-US')
addClip('So fun!', 'en-US')
addClip('Count!', 'en-US')
addClip('zero', 'en-US')
addClip('Look!', 'en-US')
addClip('Read a word!', 'en-US')
addClip(gateBookBlendHint(), 'zh-CN')

for (const word of words) addWord(word)

export const speechClips = clips
