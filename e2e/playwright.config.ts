import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'steps-auth',
      testMatch: '**/steps-auth.spec.ts',
      use: { baseURL: 'http://127.0.0.1:3003' }
    },
    {
      name: 'compare-auth',
      testMatch: '**/compare-auth.spec.ts',
      use: { baseURL: 'http://127.0.0.1:3002' }
    }
  ]
})
