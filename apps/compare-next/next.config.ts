import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(appRoot, '../..')

const nextConfig: NextConfig = {
  allowedDevOrigins: ['compare-local.da-mr.com'],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    // pnpm monorepo: Turbopack must use the workspace root (not apps/compare-next or
    // src/app) so `next` resolves via the shared node_modules/.pnpm store.
    root: monorepoRoot
  }
}

export default nextConfig

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
initOpenNextCloudflareForDev()
