import { computed } from 'vue'
import { useRoute } from 'vue-router'

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

  function afterGate(dailyNext: string) {
    if (isDemo.value) return '/play-gallery'
    return playPath(dailyNext)
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

  return { isReview, isDemo, isPractice, playPath, afterGate, backPath, backLabel }
}
