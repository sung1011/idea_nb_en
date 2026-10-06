import { computed, ref } from 'vue'
import {
  commitsBehind,
  currentBuildVersion,
  fetchHistoryInfo,
  fetchVersionInfo,
  hasRemoteUpdate,
  isBubbleDismissed,
  notesFromBehind,
  writeDismissedVersion,
  type VersionNote,
} from '../appVersion'
import { nudgeServiceWorkerUpdate, reloadToNewVersion } from './usePwaUpdate'

const UPDATE_INTERVAL_MS = 10 * 60 * 1000

const updateReady = ref(false)
const remoteVersion = ref('')
const behindNotes = ref<VersionNote[]>([])
const extraBehindCount = ref(0)
const settingsOpen = ref(false)
const autoBubbleAllowed = ref(false)

let started = false
let checking = false

export const bubbleVisible = computed(
  () =>
    autoBubbleAllowed.value &&
    updateReady.value &&
    !settingsOpen.value &&
    !isBubbleDismissed(remoteVersion.value),
)

export function useAppUpdate() {
  return {
    updateReady,
    remoteVersion,
    behindNotes,
    extraBehindCount,
    bubbleVisible,
    dismissUpdateBubble,
    reloadToNewVersion,
    checkRemoteAppUpdate,
  }
}

export function noteUpdateUiOpen(open: boolean) {
  settingsOpen.value = open
}

export function dismissUpdateBubble() {
  if (remoteVersion.value) writeDismissedVersion(remoteVersion.value)
  autoBubbleAllowed.value = false
}

export function startAppUpdateChecks() {
  if (started) return
  started = true
  void checkRemoteAppUpdate('auto')
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkRemoteAppUpdate('auto')
  })
  window.addEventListener('focus', () => {
    void checkRemoteAppUpdate('auto')
  })
  window.addEventListener('pageshow', () => {
    void checkRemoteAppUpdate('auto')
  })
  window.setInterval(() => {
    void checkRemoteAppUpdate('auto')
  }, UPDATE_INTERVAL_MS)
}

export async function checkRemoteAppUpdate(source: 'auto' | 'manual' = 'auto'): Promise<'updated' | 'current'> {
  nudgeServiceWorkerUpdate()
  if (checking) return updateReady.value ? 'updated' : 'current'
  checking = true
  try {
    const remote = await fetchVersionInfo()
    if (!remote) return updateReady.value ? 'updated' : 'current'
    const ready = hasRemoteUpdate(currentBuildVersion(), remote.version)
    updateReady.value = ready
    remoteVersion.value = remote.version
    await fillBehindNotes(remote.notes)
    if (ready && source === 'auto' && !isBubbleDismissed(remote.version)) {
      autoBubbleAllowed.value = true
    }
    if (!ready) autoBubbleAllowed.value = false
    return ready ? 'updated' : 'current'
  } finally {
    checking = false
  }
}

async function fillBehindNotes(fallbackNotes: VersionNote[]) {
  const history = await fetchHistoryInfo()
  const behind = history ? commitsBehind(history.commits, currentBuildVersion()) : null
  const packed = notesFromBehind(behind, fallbackNotes)
  behindNotes.value = packed.notes
  extraBehindCount.value = packed.extraCount
}
