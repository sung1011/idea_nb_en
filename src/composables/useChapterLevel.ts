import { computed, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import {
  ANIMALS_CHAPTER_ID,
  chapterKidTitle,
  getChapterNumber,
  getLevel,
  resolveLevelId,
  type PlayKind,
} from '../data/chapters'
import { matchingLevel, pickGateOtherWords, sampleGateWords, shouldUseLevelWords as resolveUseLevelWords } from '../data/gateWords'
import { usePlayMode } from './usePlayMode'
import {
  completeLevel,
  getChapterProgress,
  grantSticker,
  isLevelCleared,
  isLevelUnlocked,
  locationAfterClear,
  locationForIslandChapter,
  type CompleteLevelResult,
} from './progressStore'

export function useChapterLevel(play: PlayKind) {
  const route = useRoute()
  const router = useRouter()
  const { isPractice, isDemo, isReview, isChapterPractice, afterLevel } = usePlayMode()

  const rawLevelQuery = computed(() => route.query.level)
  const hasExplicitLevel = computed(() => Boolean(matchingLevel(play, rawLevelQuery.value)))
  const levelId = computed(() => {
    const raw = rawLevelQuery.value
    const value = Array.isArray(raw) ? raw[0] : raw
    return resolveLevelId(play, typeof value === 'string' ? value : null)
  })

  const level = computed(() => getLevel(levelId.value))
  const useLevelWords = computed(() =>
    resolveUseLevelWords({
      play,
      rawLevel: rawLevelQuery.value,
      isDemo: isDemo.value,
      isReview: isReview.value,
      resolvedLevel: level.value,
    }),
  )
  const themeHint = computed(() =>
    useLevelWords.value ? chapterKidTitle(level.value?.chapterId ?? '') : '',
  )

  function takeRunWords(count: number): string[] {
    return sampleGateWords({
      level: level.value,
      useLevel: useLevelWords.value,
      count,
    })
  }

  function takeOtherWords(exclude: string[], count = 1): string[] {
    return pickGateOtherWords({
      level: level.value,
      useLevel: useLevelWords.value,
      exclude,
      count,
    })
  }
  const isReplay = computed(() => !isPractice.value && isLevelCleared(levelId.value))
  const canPlay = computed(() => isPractice.value || isLevelUnlocked(levelId.value))
  const chapterComplete = computed(() => getChapterProgress(level.value?.chapterId).complete)
  const chapterNo = computed(() => getChapterNumber(level.value?.chapterId ?? ANIMALS_CHAPTER_ID))
  const showClearSheet = ref(false)
  const lastResult = ref<CompleteLevelResult | null>(null)

  const gateTag = computed(() => {
    const title = level.value?.titleZh ?? ''
    const order = level.value?.order
    if (isDemo.value) return `试玩 · ${title}`
    if (isReview.value) return `复习 · ${title}`
    if (isChapterPractice.value) return `练一练 · 第${order}关 · ${title}`
    if (isReplay.value) return `再玩 · 第${order}关 · ${title}`
    return `第${order}关 · ${title}`
  })

  function finishLevel(extras?: { sticker?: string }): CompleteLevelResult {
    if (isPractice.value) {
      return {
        accepted: true,
        firstClear: false,
        starsAwarded: 0,
        stickerGranted: false,
        stickerId: null,
        chapterId: level.value?.chapterId ?? null,
        nextLevelId: null,
        nextRoute: isDemo.value ? '/play-gallery' : '/letter-workshop',
      }
    }
    const result = completeLevel(levelId.value)
    if (result.firstClear && extras?.sticker) {
      grantSticker(extras.sticker)
    }
    return result
  }

  function nextLocation(result: CompleteLevelResult): RouteLocationRaw {
    return afterLevel(result)
  }

  function goAfterLevel(result: CompleteLevelResult) {
    lastResult.value = result
    if (isPractice.value) {
      void router.push(nextLocation(result))
      return
    }
    if (!result.firstClear || isChapterPractice.value) {
      showClearSheet.value = true
      return
    }
    void router.push(nextLocation(result))
  }

  function replayCleared() {
    showClearSheet.value = false
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(route.query)) {
      if (key === 'r') continue
      if (typeof value === 'string') query[key] = value
      else if (Array.isArray(value) && typeof value[0] === 'string') query[key] = value[0]
    }
    query.level = levelId.value
    query.r = String(Date.now())
    void router.replace({ path: route.path, query })
  }

  function continueAfterClear() {
    showClearSheet.value = false
    const result = lastResult.value
    if (!result) {
      void router.push(locationForIslandChapter(level.value?.chapterId))
      return
    }
    void router.push(nextLocation(result))
  }

  function goLobby() {
    showClearSheet.value = false
    void router.push(locationForIslandChapter(level.value?.chapterId))
  }

  return {
    levelId,
    level,
    hasExplicitLevel,
    useLevelWords,
    themeHint,
    takeRunWords,
    takeOtherWords,
    isReplay,
    canPlay,
    isPractice,
    isDemo,
    isReview,
    isChapterPractice,
    chapterComplete,
    chapterId: computed(() => level.value?.chapterId ?? ANIMALS_CHAPTER_ID),
    chapterNo,
    gateTag,
    showClearSheet,
    lastResult,
    finishLevel,
    nextLocation,
    goAfterLevel,
    replayCleared,
    continueAfterClear,
    goLobby,
    locationAfterClear,
  }
}
