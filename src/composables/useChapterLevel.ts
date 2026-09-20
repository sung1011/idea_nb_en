import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { getLevel, resolveLevelId, type PlayKind } from '../data/chapters'
import { usePlayMode } from './usePlayMode'
import {
  completeLevel,
  grantSticker,
  isLevelCleared,
  isLevelUnlocked,
  locationAfterClear,
  type CompleteLevelResult,
} from './progressStore'

export function useChapterLevel(play: PlayKind) {
  const route = useRoute()
  const router = useRouter()
  const { isPractice, isDemo, isReview, afterLevel } = usePlayMode()

  const levelId = computed(() => {
    const raw = route.query.level
    const value = Array.isArray(raw) ? raw[0] : raw
    return resolveLevelId(play, typeof value === 'string' ? value : null)
  })

  const level = computed(() => getLevel(levelId.value))
  const isReplay = computed(() => !isPractice.value && isLevelCleared(levelId.value))
  const canPlay = computed(() => isPractice.value || isLevelUnlocked(levelId.value))

  const gateTag = computed(() => {
    const title = level.value?.titleZh ?? ''
    const order = level.value?.order
    if (isDemo.value) return `试玩 · ${title}`
    if (isReview.value) return `复习 · ${title}`
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
    void router.push(nextLocation(result))
  }

  return {
    levelId,
    level,
    isReplay,
    canPlay,
    isPractice,
    isDemo,
    isReview,
    gateTag,
    finishLevel,
    nextLocation,
    goAfterLevel,
    locationAfterClear,
  }
}
