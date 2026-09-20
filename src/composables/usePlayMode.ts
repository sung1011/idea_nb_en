import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { locationAfterClear, type CompleteLevelResult } from './progressStore'

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

/** Daily island awards first-clear rewards; workshop/gallery practice does not. */
export function usePlayMode() {
  const route = useRoute()
  const isReview = computed(() => route.query.review === '1')
  const isDemo = computed(() => route.query.demo === '1')
  const isPractice = computed(() => isReview.value || isDemo.value)

  function playPath(path: string) {
    if (isDemo.value) {
      return { path, query: { demo: '1' } }
    }
    if (isReview.value) {
      return { path, query: { review: '1' } }
    }
    return path
  }

  function playLocation(target: RouteLocationRaw): RouteLocationRaw {
    if (typeof target === 'string') return playPath(target)
    const query = asQuery(target)
    if (isDemo.value) query.demo = '1'
    if (isReview.value) query.review = '1'
    return { path: asPath(target), query }
  }

  function afterGate(dailyNext: string) {
    if (isDemo.value) return '/play-gallery'
    if (isReview.value && dailyNext === '/day-complete') return '/letter-workshop'
    return playPath(dailyNext)
  }

  function afterLevel(result: Pick<CompleteLevelResult, 'nextLevelId' | 'nextRoute'>): RouteLocationRaw {
    if (isDemo.value) return '/play-gallery'
    if (isReview.value) {
      const next = locationAfterClear(result)
      if (asPath(next) === '/day-complete') return '/letter-workshop'
      return playLocation(next)
    }
    return locationAfterClear(result)
  }

  const backPath = computed(() => {
    if (isDemo.value) return '/play-gallery'
    if (isReview.value) return '/letter-workshop'
    return '/animal-island'
  })
  const backLabel = computed(() => {
    if (isDemo.value) return '回一览'
    if (isReview.value) return '回工坊'
    return '回岛'
  })

  return { isReview, isDemo, isPractice, playPath, playLocation, afterGate, afterLevel, backPath, backLabel }
}
