export type VersionNote = {
  at: string
  title: string
}

export type VersionInfo = {
  version: string
  sha?: string
  releasedAt: string
  notes: VersionNote[]
}

export type HistoryCommit = {
  version: string
  at: string
  title: string
}

export type HistoryInfo = {
  version: string
  commits: HistoryCommit[]
}

export const BUBBLE_DISMISS_KEY = 'starWords.updateBubbleDismiss'
export const BEHIND_NOTE_LIMIT = 10

/** Same short sha baked into this build via Vite `define` / version.json. */
export const APP_BUILD_VERSION = (__APP_COMMIT__ || 'dev').trim()

export function normalizeSha(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase()
}

export function currentBuildVersion(): string {
  return normalizeSha(APP_BUILD_VERSION) || 'dev'
}

export function hasRemoteUpdate(local: string, remote: string): boolean {
  const localSha = normalizeSha(local)
  const remoteSha = normalizeSha(remote)
  if (!localSha || !remoteSha || localSha === 'dev' || remoteSha === 'dev') return false
  return remoteSha !== localSha
}

/** Newest-first history: entries before the local sha are what this build is behind. */
export function commitsBehind(commits: HistoryCommit[], localVersion: string): HistoryCommit[] | null {
  const localSha = normalizeSha(localVersion)
  if (!localSha || localSha === 'dev' || !commits.length) return null
  const index = commits.findIndex((row) => normalizeSha(row.version) === localSha)
  if (index < 0) return null
  return commits.slice(0, index)
}

export function notesFromBehind(
  behind: HistoryCommit[] | null,
  fallbackNotes: VersionNote[] = [],
): { notes: VersionNote[]; extraCount: number } {
  if (behind && behind.length) {
    const notes = behind.slice(0, BEHIND_NOTE_LIMIT).map(({ at, title }) => ({ at, title }))
    return { notes, extraCount: Math.max(0, behind.length - BEHIND_NOTE_LIMIT) }
  }
  const notes = fallbackNotes.slice(0, BEHIND_NOTE_LIMIT)
  return { notes, extraCount: Math.max(0, fallbackNotes.length - BEHIND_NOTE_LIMIT) }
}

function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${file}?t=${Date.now()}`
}

export async function fetchVersionInfo(): Promise<VersionInfo | null> {
  try {
    const response = await fetch(assetUrl('version.json'), { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as VersionInfo
    if (!data || typeof data.version !== 'string' || !data.version.trim()) return null
    if (!Array.isArray(data.notes)) data.notes = []
    return data
  } catch {
    return null
  }
}

export async function fetchHistoryInfo(): Promise<HistoryInfo | null> {
  try {
    const response = await fetch(assetUrl('history.json'), { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as HistoryInfo
    if (!data || !Array.isArray(data.commits)) return null
    return data
  } catch {
    return null
  }
}

export function readDismissedVersion(): string {
  try {
    return normalizeSha(window.localStorage.getItem(BUBBLE_DISMISS_KEY))
  } catch {
    return ''
  }
}

export function writeDismissedVersion(version: string) {
  try {
    window.localStorage.setItem(BUBBLE_DISMISS_KEY, normalizeSha(version))
  } catch {
    // ignore quota / private mode
  }
}

export function isBubbleDismissed(remoteVersion: string): boolean {
  const dismissed = readDismissedVersion()
  const remote = normalizeSha(remoteVersion)
  return Boolean(dismissed && remote && dismissed === remote)
}
