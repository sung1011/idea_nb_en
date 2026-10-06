import { execSync } from 'node:child_process'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages project site. Manifest scope and the service worker must match. */
const base = '/idea_nb_en/'

function gitShortCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() || 'dev'
  } catch {
    return 'dev'
  }
}

function shanghaiStamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}`
}

const appCommit = gitShortCommit()
const appBuiltAt = shanghaiStamp()

/** Puts the build id in index.html so its precache revision changes every build. */
function appBuildStamp(): Plugin {
  return {
    name: 'app-build-stamp',
    transformIndexHtml(html) {
      const meta = `<meta name="app-build" content="${appCommit} ${appBuiltAt}" />`
      return html.replace('</head>', `    ${meta}\n  </head>`)
    },
  }
}

export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify(appCommit),
    __APP_BUILD_TIME__: JSON.stringify(appBuiltAt),
  },
  plugins: [
    vue(),
    appBuildStamp(),
    VitePWA({
      registerType: 'autoUpdate',
      // Register from the app so a new worker can take over without reloading mid-game.
      injectRegister: null,
      includeManifestIcons: false,
      manifest: {
        name: '星词岛',
        short_name: '星词岛',
        lang: 'zh-CN',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#7ec8e3',
        background_color: '#7ec8e3',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Each file keeps its own content revision. Unchanged mp3s are copied inside the cache.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,mp3,wav,ogg,m4a}', 'audio/manifest.json'],
        // Chapter stories are fetched into the Cache API when that story opens.
        globIgnores: ['**/story-ch*-p*-*.mp3'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  base,
  server: {
    host: true,
    port: 5173,
  },
})
