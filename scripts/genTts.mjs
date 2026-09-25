import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = path.join(root, 'public', 'audio')
const catalogPath = path.join(root, 'scripts', '.speech-catalog.json')

function fileFor(lang, voice, rate, text) {
  const hash = createHash('sha256').update(`${lang}|${voice}|${rate}|${text}`).digest('hex').slice(0, 12)
  return `audio/${hash}.mp3`
}

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let catalog
try {
  catalog = await server.ssrLoadModule('/scripts/speechCatalog.ts')
} finally {
  await server.close()
}

const clips = catalog.speechClips.map((clip) => ({
  ...clip,
  file: fileFor(clip.lang, clip.voice, clip.rate, clip.text),
}))

await mkdir(audioDir, { recursive: true })
await writeFile(catalogPath, JSON.stringify({ clips }, null, 2))

const english = clips.filter((clip) => clip.lang === 'en-US').length
const chinese = clips.filter((clip) => clip.lang === 'zh-CN').length
console.log(`catalog ${clips.length} clips (${english} en, ${chinese} zh)`)
console.log('dynamic fallbacks:')
for (const row of catalog.dynamicFallbacks) {
  console.log(`- ${row.where}: ${row.example} (${row.why})`)
}

if (process.argv.includes('--list')) process.exit(0)

const python = spawn('python3', [path.join(root, 'scripts', 'genTts.py'), catalogPath, audioDir], {
  stdio: 'inherit',
})
const code = await new Promise((resolve) => {
  python.on('exit', resolve)
  python.on('error', () => resolve(1))
})
process.exit(code ?? 1)
