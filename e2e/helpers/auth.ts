import type { Page } from '@playwright/test'

import { AUTH_UI } from './constants.js'

export async function signInViaCentralAuth(
  page: Page,
  opts: { email: string; password: string; returnUrl: string }
): Promise<void> {
  const loginUrl = `${AUTH_UI}/login?returnUrl=${encodeURIComponent(opts.returnUrl)}`
  await page.goto(loginUrl)
  await page.getByLabel('Email').fill(opts.email)
  await page.getByLabel('Password').fill(opts.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL((url) => url.href.startsWith(opts.returnUrl), {
    timeout: 30_000
  })
}

export async function expectCentralLoginPage(page: Page): Promise<void> {
  await page.waitForURL(/\/login(\?|$)/, { timeout: 15_000 })
  await page.getByRole('heading', { name: 'Sign in' }).waitFor()
}
