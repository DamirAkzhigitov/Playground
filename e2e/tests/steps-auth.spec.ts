import { expect, test } from '@playwright/test'

import {
  expectCentralLoginPage,
  signInViaCentralAuth
} from '../helpers/auth.js'
import {
  AUTH_UI,
  SEED_ACTION_TITLE,
  SEED_USER,
  STEPS_UI
} from '../helpers/constants.js'

test.describe('Steps auth integration', () => {
  test('guest can browse the public catalog without signing in', async ({
    page
  }) => {
    await page.goto('/actions')
    await expect(
      page.getByRole('link', { name: 'Browse actions' })
    ).toBeVisible()
    await expect(page.getByText(SEED_ACTION_TITLE)).toBeVisible()
    expect(page.url()).toMatch(/\/actions/)
    expect(page.url()).not.toContain(AUTH_UI)
  })

  test('guest sees sign-in prompt on an action page', async ({ page }) => {
    await page.goto('/actions/buy-apartment-mortgage')
    await expect(
      page.getByText('Sign in to save your guide progress')
    ).toBeVisible()
  })

  test('guest is sent to central auth when opening My guides', async ({
    page
  }) => {
    await page.goto('/my')
    await expectCentralLoginPage(page)
    expect(page.url()).toContain(AUTH_UI)
    expect(page.url()).toContain('returnUrl=')
  })

  test('signed-in user reaches My guides after central login', async ({
    page
  }) => {
    const returnUrl = `${STEPS_UI}/my`
    await signInViaCentralAuth(page, {
      email: SEED_USER.email,
      password: SEED_USER.password,
      returnUrl
    })
    await expect(page.getByRole('heading', { name: 'My guides' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'My guides' })).toBeVisible()
  })
})
