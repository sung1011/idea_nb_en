import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { getLevel } from '../data/chapters'
import { locationForChapterPractice, resolvePracticeChapterId } from '../data/playGallery'
import { locationAfterClear, locationForIslandChapter, type CompleteLevelResult } from './progressStore'

function asQuery(raw: RouteLocationRaw): Record<string, string> {
  if (typeof raw === 'string') return {}
  if (!('query' in raw) || !raw.query) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw.query)) {
    if (typeof value === 'string') out[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0]
  }
  return out
}

function asPath(raw: RouteLocationRaw): string {
  if (typeof raw === 'string') return raw.split('?')[0] ?? raw
  if ('path' in raw && raw.path) return raw.path
  return '/'
}

/** Daily island awards first-clear rewards; gallery practice does not. */
export function usePlayMode() {
  const route = useRoute()
  const isDemo = computed(() => route.query.demo === '1')
  const isPractice = computed(() => isDemo.value)
  const isChapterPractice = computed(() => route.query.practice === '1')
  const chapterFilter = computed(() => {
    const raw = route.query.chapter
    const value = Array.isArray(raw) ? raw[0] : raw
    return typeof value === 'string' && value ? value : ''
  })

  function practiceGalleryPath(chapterId?: string) {
    const resolved = chapterId || resolvePracticeChapterId(chapterFilter.value, route.query.level)
    return locationForChapterPractice(resolved)
  }

  function extraQuery(): Record<string, string> {
    const query: Record<string, string> = {}
    if (isDemo.value) query.demo = '1'
    if (isChapterPractice.value) query.practice = '1'
    if (chapterFilter.value) query.chapter = chapterFilter.value
    return query
  }

  function playPath(path: string) {
    const query = extraQuery()
    return Object.keys(query).length ? { path, query } : path
  }

  function playLocation(target: RouteLocationRaw): RouteLocationRaw {
    if (typeof target === 'string') return playPath(target)
    const query = { ...asQuery(target), ...extraQuery() }
    return { path: asPath(target), query }
  }

  function afterGate(dailyNext: string) {
    if (isDemo.value) return chapterFilter.value ? practiceGalleryPath() : '/play-gallery'
    if (isChapterPractice.value) return practiceGalleryPath()
    return playPath(dailyNext)
  }

  function afterLevel(
    result: Pick<CompleteLevelResult, 'nextLevelId' | 'nextRoute' | 'chapterId' | 'lessonId' | 'chapterFinished'>,
  ): RouteLocationRaw {
    if (isDemo.value) return chapterFilter.value ? practiceGalleryPath() : '/play-gallery'
    if (isChapterPractice.value) return practiceGalleryPath()
    return locationAfterClear(result)
  }

  const backPath = computed(() => {
    if (isDemo.value) return chapterFilter.value ? practiceGalleryPath() : '/play-gallery'
    if (isChapterPractice.value) return practiceGalleryPath()
    const raw = route.query.level
    const value = Array.isArray(raw) ? raw[0] : raw
    const def = typeof value === 'string' ? getLevel(value) : undefined
    return locationForIslandChapter(def?.chapterId, def?.lessonId)
  })
  const backLabel = computed(() => {
    if (isDemo.value) return '回一览'
    if (isChapterPractice.value) return '回岛'
    return '回岛'
  })

  return {
    isDemo,
    isPractice,
    isChapterPractice,
    chapterFilter,
    playPath,
    playLocation,
    afterGate,
    afterLevel,
    backPath,
    backLabel,
    practiceGalleryPath,
  }
}
