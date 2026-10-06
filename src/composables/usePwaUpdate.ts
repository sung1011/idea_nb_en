import { currentBuildVersion } from '../appVersion'
import { registerSW } from 'virtual:pwa-register'

const UPDATE_INTERVAL_MS = 20 * 1000
const RELOAD_GUARD_MS = 15_000
const RELOAD_GUARD_KEY = 'starWords.pwaReloadAt'

let registration: ServiceWorkerRegistration | undefined
let started = false

export function appVersionLabel(): string {
  const commit = currentBuildVersion()
  const builtAt = __APP_BUILD_TIME__ || ''
  return builtAt ? `${commit} · ${builtAt}` : commit
}

export function nudgeServiceWorkerUpdate() {
  const run = (reg: ServiceWorkerRegistration) => {
    registration = reg
    void reg.update().catch(() => undefined)
  }
  if (registration) {
    run(registration)
    return
  }
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.getRegistration().then((reg) => {
    if (reg) run(reg)
  })
}

/** User asked to take the new build. This is the only reload path. */
export function reloadToNewVersion() {
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0)
  const elapsed = Date.now() - last
  if (Number.isFinite(last) && last > 0 && elapsed < RELOAD_GUARD_MS) return
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
  window.location.reload()
}

export function noteNavigation(_path: string) {
  void _path
}

export function noteSettingsOpen(_open: boolean) {
  void _open
}

export function startPwaUpdates() {
  if (started || !('serviceWorker' in navigator)) return
  started = true

  registerSW({
    immediate: true,
    // Must stay set: vite-plugin-pwa otherwise reloads on SW activate.
    onNeedReload() {},
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

/** Force a check. Reports a new worker without reloading. */
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
    return 'updated'
  }
  return 'current'
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
