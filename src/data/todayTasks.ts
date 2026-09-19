/** Daily main-task ids + kid-facing copy. One task, not a list. */
export const MAIN_TASK_FISH_ECHO = 'fishEcho'
export const MAIN_TASK_DAILY_CHAIN = 'dailyChain'

export const MAIN_TASK_COPY: Record<string, string> = {
  fishEcho: '今天走完派对四关',
  animalsIsland: '今天走完派对四关',
  dailyChain: '今天走完派对四关',
}

export function mainTaskCopy(taskId: string): string {
  return MAIN_TASK_COPY[taskId] ?? MAIN_TASK_COPY[MAIN_TASK_DAILY_CHAIN]
}

export function focusWordHint(word: string): string {
  return `多听一听 ${word}`
}
