import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const mainOrigin = env.VITE_MAIN_ORIGIN || 'https://da-mr.com'

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'playground-commity-html-main-origin',
        transformIndexHtml(html) {
          return html.replaceAll('__MAIN_ORIGIN__', mainOrigin)
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3003,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              const host = req.headers.host
              if (host) {
                proxyReq.setHeader('X-Forwarded-Host', host)
                proxyReq.setHeader('X-Forwarded-Proto', 'http')
              }
            })
          }
        }
      }
    }
  }
})
