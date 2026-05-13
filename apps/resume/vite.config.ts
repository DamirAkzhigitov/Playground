import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const appDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDir, '')
  const mainOrigin = env.VITE_MAIN_ORIGIN || 'https://da-mr.com'

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    server: {
      port: 3001,
      open: true
    },
    plugins: [
      {
        name: 'playground-resume-html-main-origin',
        transformIndexHtml(html) {
          return html.replaceAll('__MAIN_ORIGIN__', mainOrigin)
        }
      }
    ]
  }
})
