import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** Daily island play awards first-clear rewards; workshop replay does not. */
export function usePlayMode() {
  const route = useRoute()
  const isReview = computed(() => route.query.review === '1')

  function playPath(path: string) {
    if (isReview.value) {
      return { path, query: { review: '1' } }
    }
    return path
  }

  const backPath = computed(() => (isReview.value ? '/letter-workshop' : '/animal-island'))
  const backLabel = computed(() => (isReview.value ? '回工坊' : '回岛'))

  return { isReview, playPath, backPath, backLabel }
}
