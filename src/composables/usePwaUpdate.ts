import { registerSW } from 'virtual:pwa-register'

const UPDATE_INTERVAL_MS = 10 * 60 * 1000
const RELOAD_GUARD_MS = 15_000
const RELOAD_GUARD_KEY = 'starWords.pwaReloadAt'

/** Screens where a refresh will not wipe an in-progress level. */
const SAFE_PATHS = new Set(['/', '/star-meadow', '/animal-island', '/word-atlas', '/sentence-atlas'])

let registration: ServiceWorkerRegistration | undefined
let currentPath = readHashPath()
let settingsOpen = false
let pendingReload = false
let reloading = false
let started = false
let retryTimer = 0

export function appVersionLabel(): string {
  const commit = __APP_COMMIT__ || 'dev'
  const builtAt = __APP_BUILD_TIME__ || ''
  return builtAt ? `${commit} · ${builtAt}` : commit
}

export function noteNavigation(path: string) {
  currentPath = path || '/'
  flushPendingReload()
}

export function noteSettingsOpen(open: boolean) {
  settingsOpen = open
  if (open) flushPendingReload()
}

export function startPwaUpdates() {
  if (started || !('serviceWorker' in navigator)) return
  started = true

  let hadController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first claim on a fresh install is not an update.
    if (!hadController) {
      hadController = true
      return
    }
    requestReload()
  })
  window.addEventListener('pageshow', () => {
    flushPendingReload()
  })

  registerSW({
    immediate: true,
    onNeedReload() {
      requestReload()
    },
    onRegisteredSW(swScriptUrl, reg) {
      void swScriptUrl
      if (!reg) return
      registration = reg
      bindUpdateChecks(reg)
      void reg.update().catch(() => undefined)
    },
    onRegisterError() {
      registration = undefined
    },
  })
}

/** Force a check. Reloads when a new worker is found; otherwise the caller shows the toast. */
export async function checkForAppUpdate(): Promise<'updated' | 'current'> {
  if (!('serviceWorker' in navigator)) return 'current'
  const reg = registration ?? (await navigator.serviceWorker.getRegistration())
  if (!reg) return 'current'
  registration = reg

  let found = false
  const mark = () => {
    found = true
  }
  reg.addEventListener('updatefound', mark)
  try {
    await reg.update()
  } catch {
    reg.removeEventListener('updatefound', mark)
    return 'current'
  }
  await new Promise((resolve) => window.setTimeout(resolve, 80))
  reg.removeEventListener('updatefound', mark)
  const installing = reg.installing
  if (found || reg.waiting || (installing && installing.state !== 'redundant')) {
    requestReload()
    return 'updated'
  }
  return 'current'
}

function readHashPath(): string {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const path = raw.split('?')[0] || '/'
  return path.startsWith('/') ? path : `/${path}`
}

function isSafeScreen(): boolean {
  return settingsOpen || SAFE_PATHS.has(currentPath)
}

function requestReload() {
  pendingReload = true
  flushPendingReload()
}

function flushPendingReload() {
  if (!pendingReload || reloading || !isSafeScreen()) return
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0)
  const elapsed = Date.now() - last
  if (Number.isFinite(last) && last > 0 && elapsed < RELOAD_GUARD_MS) {
    if (!retryTimer) {
      retryTimer = window.setTimeout(() => {
        retryTimer = 0
        flushPendingReload()
      }, RELOAD_GUARD_MS - elapsed + 30)
    }
    return
  }
  reloading = true
  pendingReload = false
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
  window.location.reload()
}

function bindUpdateChecks(reg: ServiceWorkerRegistration) {
  const check = () => {
    void reg.update().catch(() => undefined)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  window.addEventListener('focus', check)
  window.addEventListener('pageshow', check)
  window.setInterval(check, UPDATE_INTERVAL_MS)
}
