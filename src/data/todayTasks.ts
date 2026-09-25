import { chapterKidTitle } from './chapters'

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
  const safeTotal = Math.max(0, Math.floor(total))
  const safeCleared = Math.max(0, Math.min(safeTotal, Math.floor(cleared)))
  if (safeTotal <= 0) return `第${chapterNo}章 即将开放`
  return `第${chapterNo}章 ${safeCleared}/${safeTotal} 关`
}

/** Home / lobby line, e.g. 「第1章·第2课 3/5」. */
export function lessonProgressCopy(
  chapterNo: number,
  lessonNo: number,
  cleared: number,
  total: number,
  opts?: { soon?: boolean; clearedLesson?: boolean },
): string {
  const head = `第${chapterNo}章·第${lessonNo}课`
  if (opts?.clearedLesson) return `${head} 通关啦`
  if (opts?.soon || total <= 0) return `${head} 即将开放`
  const safeTotal = Math.max(1, Math.floor(total))
  const safeCleared = Math.max(0, Math.min(safeTotal, Math.floor(cleared)))
  return `${head} ${safeCleared}/${safeTotal}`
}

export function comingSoonCopy(): string {
  return '即将开放'
}

export function lessonLockHint(): string {
  return '先把上一课玩完吧'
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

export function practiceHintCopy(): string {
  return '想再玩可以点这里'
}

export function chapterLockHint(): string {
  return '先通关上一章吧'
}

export function levelLockHint(): string {
  return '先过上一关吧'
}

export function nextLevelCtaCopy(
  order: number,
  titleZh: string,
  chapterNo?: number,
  lessonNo?: number,
): string {
  if (chapterNo != null && lessonNo != null) return `去第${chapterNo}章第${lessonNo}课 · ${titleZh}`
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

export function gateFlashStudyHint(current: number, total: number, isLast: boolean): string {
  const mark = `${Math.max(1, current)}/${Math.max(1, total)}`
  if (total <= 1) return `${mark} · 看完就可以开始找一找啦`
  if (isLast) return `${mark} · 都看过啦，可以开始找一找`
  return `${mark} · 一张一张看，听一听再翻`
}

export function gateFlashStudyNext(isLast: boolean): string {
  return isLast ? '开始找一找' : '下一张'
}

export function gateFlashStudyPrev(): string {
  return '上一张'
}

export function gateWhackSub(themeHint: string): string {
  return themeHint ? `听单词，点对的地鼠 · ${themeHint}` : '听单词，点对的地鼠'
}

export function gateDragSub(themeHint: string): string {
  return themeHint ? `拖到对应的图 · ${themeHint}` : ''
}

export function gateSpellSub(themeHint: string): string {
  return themeHint ? `听单词，用字母块拼出来 · ${themeHint}` : '听单词，用字母块拼出来'
}

export function gateSpellPrompt(): string {
  return '听一听，点字母'
}

export function gateSpellHint(): string {
  return '点错会轻轻晃一下，再试就好'
}

export function gateBookSub(themeHint: string): string {
  return themeHint ? `点句子听整句，试着拼读 · ${themeHint}` : '点句子听整句，试着拼读'
}

export function gateBookCoverHint(): string {
  return '点书名听一听，再打开小书'
}

export function gateBookBlendHint(): string {
  return '先看这个词，试着拼一拼'
}

export function gateBookPageHint(): string {
  return '点句子听整句，点词听单词'
}

export function gateBookReplayHint(): string {
  return '再读一遍小书也可以，星星已经给你啦'
}

export function gateBookPrompt(kind: 'cover' | 'blend' | 'page' | 'done'): string {
  if (kind === 'cover') return '小书点读'
  if (kind === 'blend') return '试着拼一拼'
  if (kind === 'done') return '读完啦'
  return '点句子听一听'
}

export function gateFishLead(chapterId?: string, useTheme = false): string {
  if (!useTheme) return '小猫请客'
  return chapterKidTitle(chapterId ?? '') || '小猫请客'
}

export function gateEchoTitle(chapterId?: string, useTheme = false): string {
  if (!useTheme) return '听句子，说一说'
  return chapterKidTitle(chapterId ?? '') || '听句子，说一说'
}

export function gateThemeHint(chapterId?: string): string {
  return chapterKidTitle(chapterId ?? '')
}
