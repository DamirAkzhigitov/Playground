import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FullConfig } from '@playwright/test'

import {
  AUTH_API,
  AUTH_UI,
  COMPARE_API,
  COMPARE_UI,
  HOST,
  STEPS_API,
  STEPS_UI
} from './helpers/constants.js'
import { spawnService, type ServiceHandle } from './helpers/spawn-service.js'
import { waitForUrl } from './helpers/wait-for-url.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PERSIST = path.join(ROOT, '.wrangler/e2e-persist')
const STATE_FILE = path.join(__dirname, '.server-state.json')

function migrate(workerDir: string, database: string): void {
  execSync(
    `pnpm exec wrangler d1 migrations apply ${database} --local --persist-to "${PERSIST}"`,
    {
      cwd: workerDir,
      stdio: 'inherit',
      env: process.env
    }
  )
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  mkdirSync(PERSIST, { recursive: true })

  migrate(path.join(ROOT, 'apps/auth/worker'), 'playground-auth-db')
  migrate(path.join(ROOT, 'apps/steps/worker'), 'steps-db')
  migrate(path.join(ROOT, 'apps/compare/worker'), 'apartments-db')

  const services: ServiceHandle[] = []

  services.push(
    spawnService({
      name: 'auth-api',
      cwd: path.join(ROOT, 'apps/auth/worker'),
      command: 'pnpm',
      args: [
        'exec',
        'wrangler',
        'dev',
        '--port',
        '8789',
        '--inspector-port',
        '9239',
        '--persist-to',
        PERSIST
      ]
    })
  )

  services.push(
    spawnService({
      name: 'steps-api',
      cwd: path.join(ROOT, 'apps/steps/worker'),
      command: 'pnpm',
      args: [
        'exec',
        'wrangler',
        'dev',
        '--port',
        '8787',
        '--inspector-port',
        '9237',
        '--persist-to',
        PERSIST
      ]
    })
  )

  services.push(
    spawnService({
      name: 'compare-api',
      cwd: path.join(ROOT, 'apps/compare/worker'),
      command: 'pnpm',
      args: [
        'exec',
        'wrangler',
        'dev',
        '--port',
        '8788',
        '--inspector-port',
        '9238',
        '--persist-to',
        PERSIST
      ]
    })
  )

  await waitForUrl(`${AUTH_API}/api/health`)
  await waitForUrl(`${STEPS_API}/api/health`, { expectBody: 'steps-api' })
  await waitForUrl(`${COMPARE_API}/api/health`)

  const viteEnv = {
    ...process.env,
    VITE_AUTH_ORIGIN: AUTH_UI
  }

  services.push(
    spawnService({
      name: 'auth-ui',
      cwd: path.join(ROOT, 'apps/auth'),
      command: 'pnpm',
      args: ['exec', 'vite', '--host', HOST, '--port', '3004', '--strictPort'],
      env: viteEnv
    })
  )

  services.push(
    spawnService({
      name: 'steps-ui',
      cwd: path.join(ROOT, 'apps/steps'),
      command: 'pnpm',
      args: ['exec', 'vite', '--host', HOST, '--port', '3003', '--strictPort'],
      env: viteEnv
    })
  )

  services.push(
    spawnService({
      name: 'compare-ui',
      cwd: path.join(ROOT, 'apps/compare'),
      command: 'pnpm',
      args: ['exec', 'vite', '--host', HOST, '--port', '3002', '--strictPort'],
      env: viteEnv
    })
  )

  await waitForUrl(AUTH_UI)
  await waitForUrl(STEPS_UI)
  await waitForUrl(COMPARE_UI)

  writeFileSync(
    STATE_FILE,
    JSON.stringify({ pids: services.map((s) => s.pid) })
  )
}
