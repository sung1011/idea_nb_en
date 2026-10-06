import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = path.join(root, 'scripts', '.story-tts.json')

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let stories
try {
  stories = await server.ssrLoadModule('/src/data/chapterStories.ts')
} finally {
  await server.close()
}

const clips = []
stories.CHAPTER_STORIES.forEach((story, index) => {
  const chapterNo = index + 1
  story.pages.forEach((page, pageIndex) => {
    const pageNo = pageIndex + 1
    clips.push({
      file: `audio/story-ch${chapterNo}-p${pageNo}-en.mp3`,
      text: page.en,
      voice: 'en-US-AnaNeural',
      rate: '-12%',
    })
    clips.push({
      file: `audio/story-ch${chapterNo}-p${pageNo}-zh.mp3`,
      text: page.zh,
      voice: 'zh-CN-XiaoxiaoNeural',
      rate: '+0%',
    })
  })
})

await writeFile(catalogPath, JSON.stringify({ clips }, null, 2))
console.log(`story clips ${clips.length}`)

const python = spawn('python3', [path.join(root, 'scripts', 'genStoryTts.py'), catalogPath, path.join(root, 'public')], {
  stdio: 'inherit',
})
const code = await new Promise((resolve) => {
  python.on('exit', resolve)
  python.on('error', () => resolve(1))
})
process.exit(code ?? 1)
