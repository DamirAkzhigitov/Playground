import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const appDir = path.dirname(fileURLToPath(import.meta.url))

const ORIGIN_DEFAULTS = {
  MAIN_ORIGIN: 'https://da-mr.com',
  RESUME_ORIGIN: 'https://resume.da-mr.com',
  COMPARE_ORIGIN: 'https://compare.da-mr.com',
  COMMITY_ORIGIN: 'https://commity.da-mr.com'
} as const

function resolveOrigins(mode: string) {
  const env = loadEnv(mode, appDir, '')
  return {
    MAIN_ORIGIN: env.VITE_MAIN_ORIGIN || ORIGIN_DEFAULTS.MAIN_ORIGIN,
    RESUME_ORIGIN: env.VITE_RESUME_ORIGIN || ORIGIN_DEFAULTS.RESUME_ORIGIN,
    COMPARE_ORIGIN: env.VITE_COMPARE_ORIGIN || ORIGIN_DEFAULTS.COMPARE_ORIGIN,
    COMMITY_ORIGIN: env.VITE_COMMITY_ORIGIN || ORIGIN_DEFAULTS.COMMITY_ORIGIN
  }
}

export default defineConfig(({ mode }) => {
  const origins = resolveOrigins(mode)

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    server: {
      port: 3000,
      open: true
    },
    plugins: [
      {
        name: 'playground-main-html-origins',
        transformIndexHtml(html) {
          return (Object.entries(origins) as [string, string][]).reduce(
            (acc, [key, value]) => acc.replaceAll(`__${key}__`, value),
            html
          )
        }
      }
    ]
  }
})
