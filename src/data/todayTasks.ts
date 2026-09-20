import { CHAPTER_2_ID, CHAPTER_3_ID, chapterKidTitle } from './chapters'

/** Chapter goal copy. One line, not a list. Old task ids still map here. */
export const MAIN_TASK_FISH_ECHO = 'fishEcho'
export const MAIN_TASK_DAILY_CHAIN = 'dailyChain'
export const MAIN_TASK_CHAPTER_1 = 'animalsCh1'

export const MAIN_TASK_COPY: Record<string, string> = {
  fishEcho: '走完动物岛第一章派对',
  animalsIsland: '走完动物岛第一章派对',
  dailyChain: '走完动物岛第一章派对',
  animalsCh1: '走完动物岛第一章派对',
}

export function mainTaskCopy(taskId: string): string {
  return MAIN_TASK_COPY[taskId] ?? MAIN_TASK_COPY[MAIN_TASK_DAILY_CHAIN]
}

export function chapterProgressCopy(cleared: number, total: number, chapterNo = 1): string {
  const safeTotal = Math.max(1, Math.floor(total))
  const safeCleared = Math.max(0, Math.min(safeTotal, Math.floor(cleared)))
  return `第${chapterNo}章 ${safeCleared}/${safeTotal} 关`
}

export function nextLevelCopy(titleZh: string): string {
  return `下一关：${titleZh}`
}

export function chapterDoneCopy(chapterNo = 1): string {
  return `第${chapterNo}章通关啦`
}

export function chapterPracticeCopy(chapterNo = 1): string {
  return `第${chapterNo}章通关啦，下面可以随便练`
}

export function chapterLockHint(): string {
  return '先通关上一章吧'
}

export function levelLockHint(): string {
  return '先过上一关吧'
}

export function nextLevelCtaCopy(order: number, titleZh: string, chapterNo?: number): string {
  if (chapterNo != null) return `去第${chapterNo}章第${order}关 · ${titleZh}`
  return `去第${order}关 · ${titleZh}`
}

export function replayClearedHintCopy(): string {
  return '想再玩就点已过的关'
}

export function replayAgainCopy(): string {
  return '再玩一次'
}

export function practiceEntryCopy(chapterId?: string): string {
  const kid = chapterId ? chapterKidTitle(chapterId) : ''
  return kid ? `练一练「${kid}」` : '练一练'
}

export function chapterPracticeOnlyCopy(chapterNo = 1): string {
  return `第${chapterNo}章通关啦，下面只练这一章`
}

export function focusWordHint(word: string): string {
  return `多听一听 ${word}`
}

export function gateFlashSub(themeHint: string): string {
  return themeHint ? `先看卡片，再听一听点对 · ${themeHint}` : '先看卡片，再听一听点对'
}

export function gateWhackSub(themeHint: string): string {
  return themeHint ? `听单词，点对的地鼠 · ${themeHint}` : '听单词，点对的地鼠'
}

export function gateDragSub(themeHint: string): string {
  return themeHint ? `拖到对应的图 · ${themeHint}` : ''
}

export function gateFishLead(chapterId?: string, useTheme = false): string {
  if (!useTheme) return '小猫请客'
  if (chapterId === CHAPTER_2_ID) return '听声找伙伴'
  if (chapterId === CHAPTER_3_ID) return '点心与天空'
  return '小猫请客'
}

export function gateEchoTitle(chapterId?: string, useTheme = false): string {
  if (!useTheme) return '跟小猫喊朋友'
  if (chapterId === CHAPTER_2_ID) return '听声喊伙伴'
  if (chapterId === CHAPTER_3_ID) return '点心和天空'
  return '跟小猫喊朋友'
}

export function gateThemeHint(chapterId?: string): string {
  return chapterKidTitle(chapterId ?? '')
}
