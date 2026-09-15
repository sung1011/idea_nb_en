export const SNAP_RANGE = 76

export type BasketHit = {
  el: Element
  word: string
  cx: number
  cy: number
  dist: number
}

export function basketCenter(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export function nearestBasket(x: number, y: number, selector = '[data-basket]'): BasketHit | null {
  let best: BasketHit | null = null
  document.querySelectorAll(selector).forEach((el) => {
    const word = el.getAttribute('data-basket')
    if (!word) return
    const { x: cx, y: cy } = basketCenter(el)
    const dist = Math.hypot(cx - x, cy - y)
    if (!best || dist < best.dist) best = { el, word, cx, cy, dist }
  })
  return best
}

export function magnetPoint(x: number, y: number, hit: BasketHit | null, pull = 0.38): { x: number; y: number } {
  if (!hit || hit.dist > SNAP_RANGE) return { x, y }
  return {
    x: x + (hit.cx - x) * pull,
    y: y + (hit.cy - y) * pull,
  }
}
