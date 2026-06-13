import { readFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FullConfig } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, '.server-state.json')

export default async function globalTeardown(
  _config: FullConfig
): Promise<void> {
  let pids: number[] = []
  try {
    const raw = readFileSync(STATE_FILE, 'utf8')
    pids = (JSON.parse(raw) as { pids: number[] }).pids ?? []
    unlinkSync(STATE_FILE)
  } catch {
    return
  }

  for (const pid of pids) {
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {
        /* already exited */
      }
    }
  }
}
