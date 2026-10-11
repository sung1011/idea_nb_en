import { onUnmounted, ref } from 'vue'

/** Extra wait after the estimated clip so a hung load cannot stick the lock. */
const EXTRA_MS = 4000
const MIN_MS = 6000
const MAX_MS = 60_000
const SWIPE_MIN_PX = 64

function lockTimeoutMs(text: string, lang: string): number {
  const zh = lang.toLowerCase().startsWith('zh')
  const perChar = zh ? 420 : 160
  return Math.min(MAX_MS, Math.max(MIN_MS, text.trim().length * perChar + EXTRA_MS))
}

/**
 * Locks prev/next (and swipe) while a sentence clip plays.
 * Completes with the speak / speakStoryLine promise (end, error, or system-speech fallback).
 */
export function useSpeakPageLock() {
  const pageLocked = ref(false)
  let seq = 0
  let timer = 0
  const swipeCleanups: Array<() => void> = []

  function clearTimer() {
    if (!timer) return
    window.clearTimeout(timer)
    timer = 0
  }

  function unlockIf(token: number) {
    if (token !== seq) return
    clearTimer()
    pageLocked.value = false
  }

  async function withPageLock(text: string, lang: string, play: () => Promise<void>): Promise<void> {
    const line = text.trim()
    if (!line) {
      await play()
      return
    }
    const token = ++seq
    pageLocked.value = true
    clearTimer()
    timer = window.setTimeout(() => unlockIf(token), lockTimeoutMs(line, lang))
    try {
      await play()
    } finally {
      unlockIf(token)
    }
  }

  function swipeNav(onPrev?: () => void, onNext?: () => void) {
    let x0 = 0
    let y0 = 0
    let swiped = false
    let tracking = false

    function finishTrack() {
      if (!tracking) return
      tracking = false
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }

    swipeCleanups.push(finishTrack)

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      finishTrack()
      x0 = event.clientX
      y0 = event.clientY
      swiped = false
      tracking = true
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerCancel)
    }

    function onPointerUp(event: PointerEvent) {
      finishTrack()
      const dx = event.clientX - x0
      const dy = event.clientY - y0
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy) * 1.25) return
      swiped = true
      if (pageLocked.value) return
      if (dx < 0) onNext?.()
      else onPrev?.()
    }

    function onPointerCancel() {
      finishTrack()
      swiped = false
    }

    function onClickCapture(event: Event) {
      if (!swiped) return
      swiped = false
      event.preventDefault()
      event.stopPropagation()
    }

    return { onPointerDown, onClickCapture }
  }

  onUnmounted(() => {
    seq += 1
    clearTimer()
    pageLocked.value = false
    for (const stop of swipeCleanups) stop()
  })

  return { pageLocked, withPageLock, swipeNav }
}
