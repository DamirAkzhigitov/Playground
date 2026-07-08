import { defineConfig, devices } from '@playwright/test'

const comparePort = process.env.COMPARE_NEXT_PORT ?? '3010'
const compareBaseUrl = `http://127.0.0.1:${comparePort}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: compareBaseUrl,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `pnpm --filter @playground/compare-next exec next dev --port ${comparePort}`,
    url: compareBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
