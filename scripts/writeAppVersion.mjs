import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NOTE_LIMIT = 10

function git(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function parseCommits(raw) {
  if (!raw) return []
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [version = '', at = '', ...rest] = line.split('\t')
      return {
        version: version.trim(),
        at: at.trim(),
        title: rest.join('\t').trim(),
      }
    })
    .filter((row) => row.version && row.title)
}

export function collectAppVersion() {
  const version = git('git rev-parse --short=7 HEAD') || 'dev'
  const sha = git('git rev-parse HEAD')
  const commits = parseCommits(git('git log --abbrev=7 --pretty=format:%h%x09%cI%x09%s'))
  const notes = commits.slice(0, NOTE_LIMIT).map(({ at, title }) => ({ at, title }))
  const releasedAt = commits[0]?.at || new Date().toISOString()
  return { version, sha, releasedAt, notes, commits }
}

export function writeAppVersion() {
  const { version, sha, releasedAt, notes, commits } = collectAppVersion()
  const versionJson = {
    version,
    ...(sha ? { sha } : {}),
    releasedAt,
    notes,
  }
  const historyJson = { version, commits }
  const publicDir = path.join(root, 'public')
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(path.join(publicDir, 'version.json'), `${JSON.stringify(versionJson, null, 2)}\n`)
  writeFileSync(path.join(publicDir, 'history.json'), `${JSON.stringify(historyJson, null, 2)}\n`)
  return versionJson
}

const invokedDirectly =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) writeAppVersion()
