/** Daily main-task ids + kid-facing copy. One task, not a list. */
export const MAIN_TASK_FISH_ECHO = 'fishEcho'

export const MAIN_TASK_COPY: Record<string, string> = {
  fishEcho: '今天钓起 3 条词鱼',
  animalsIsland: '今天钓起 3 条词鱼',
  dailyChain: '今天钓起 3 条词鱼',
}

export function mainTaskCopy(taskId: string): string {
  return MAIN_TASK_COPY[taskId] ?? MAIN_TASK_COPY[MAIN_TASK_FISH_ECHO]
}

export function focusWordHint(word: string): string {
  return `多听一听 ${word}`
}
