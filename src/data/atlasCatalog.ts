import { CHAPTERS, type LessonDef } from './chapters'
import { wordZh } from './phonicsFamily'
import { meadowRoster } from '../meadow/meadowConfig'

export type AtlasWordSlot = {
  word: string
  zh: string
  /** Set for math words that have no word card. */
  numeral?: number
}

export type AtlasSentenceSlot = AtlasWordSlot & {
  sentence: string
}

export type AtlasLessonGroup = {
  lessonId: string
  order: number
  review: boolean
  rows: AtlasSentenceSlot[]
}

export type AtlasChapterGroup = {
  chapterId: string
  chapterNo: number
  animalId: string
  animalZh: string
  words: AtlasWordSlot[]
  lessons: AtlasLessonGroup[]
}

function lessonSentences(lesson: LessonDef): AtlasSentenceSlot[] {
  const math = lesson.levels.find((level) => (level.numbers?.length ?? 0) > 0)
  if (math?.numbers?.length) {
    return math.numbers.map((item) => ({
      word: item.word,
      zh: item.zh,
      sentence: item.sentence,
      numeral: item.value,
    }))
  }
  const story = lesson.levels.find((level) => (level.storyPages?.length ?? 0) > 0)
  if (!story?.storyPages?.length) return []
  return story.storyPages.map((page) => ({
    word: page.word,
    zh: wordZh(page.word) ?? '',
    sentence: page.line,
  }))
}

/** Twelve chapters. A word is listed once, under the chapter that teaches it first. */
export function atlasChapterGroups(): AtlasChapterGroup[] {
  const seen = new Set<string>()
  const animals = meadowRoster()
  return CHAPTERS.map((chapter, index) => {
    const animal = animals[index]
    const words: AtlasWordSlot[] = []
    const lessons: AtlasLessonGroup[] = chapter.lessons.map((lesson) => {
      const rows = lessonSentences(lesson)
      for (const row of rows) {
        const key = row.word.trim().toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        words.push({ word: row.word, zh: row.zh, numeral: row.numeral })
      }
      return {
        lessonId: lesson.id,
        order: lesson.order,
        review: lesson.type === 'review',
        rows,
      }
    })
    return {
      chapterId: chapter.id,
      chapterNo: index + 1,
      animalId: animal?.id ?? '',
      animalZh: animal?.zh ?? '',
      words,
      lessons,
    }
  })
}
