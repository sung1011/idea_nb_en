import { computed } from 'vue'
import { atlasChapterGroups } from '../data/atlasCatalog'
import { getLessonProgress } from './progressStore'

const catalog = atlasChapterGroups()

export function useSentenceAtlas() {
  const chapters = computed(() =>
    catalog.map((group) => ({
      ...group,
      lessons: group.lessons.map((lesson) => {
        const unlocked = getLessonProgress(lesson.lessonId)?.status === 'cleared'
        return {
          ...lesson,
          unlocked,
          rows: lesson.rows.map((row) => ({ ...row, unlocked })),
        }
      }),
    })),
  )
  const rows = computed(() => chapters.value.flatMap((group) => group.lessons.flatMap((lesson) => lesson.rows)))
  const unlockedCount = computed(() => rows.value.filter((row) => row.unlocked).length)

  return {
    chapters,
    unlockedCount,
    total: catalog.reduce((sum, group) => sum + group.lessons.reduce((inner, lesson) => inner + lesson.rows.length, 0), 0),
  }
}
