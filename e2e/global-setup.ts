import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)

export default async function globalSetup(): Promise<void> {
  execSync('pnpm --filter @playground/compare-next run db:setup:local', {
    cwd: repoRoot,
    stdio: 'inherit'
  })
}
