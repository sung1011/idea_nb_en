export type BubbleBox = {
  top: number
  left: number
  width: number
}

const DEFAULT_WIDTH = 292
const VIEW_PAD = 8
const GAP = 10

/** Right-align a bubble to the gear, then clamp it to the viewport. */
export function placeUpdateBubble(
  anchor: HTMLElement | null | undefined,
  width = DEFAULT_WIDTH,
  height = 0,
): BubbleBox {
  const maxWidth = Math.max(160, window.innerWidth - VIEW_PAD * 2)
  const boxWidth = Math.min(width, maxWidth)
  if (!anchor) {
    return {
      top: VIEW_PAD + 56,
      left: Math.max(VIEW_PAD, window.innerWidth - boxWidth - VIEW_PAD),
      width: boxWidth,
    }
  }

  const rect = anchor.getBoundingClientRect()
  let left = rect.right - boxWidth
  left = Math.max(VIEW_PAD, Math.min(left, window.innerWidth - boxWidth - VIEW_PAD))

  let top = rect.bottom + GAP
  if (height > 0) {
    const overflow = top + height + VIEW_PAD - window.innerHeight
    if (overflow > 0) {
      const above = rect.top - GAP - height
      top = above >= VIEW_PAD ? above : Math.max(VIEW_PAD, top - overflow)
    }
  }

  return { top: Math.round(top), left: Math.round(left), width: Math.round(boxWidth) }
}
