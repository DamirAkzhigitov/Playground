import { expect, test } from '@playwright/test'

import {
  expectCentralLoginPage,
  signInViaCentralAuth
} from '../helpers/auth.js'
import { AUTH_UI, COMPARE_UI, SEED_USER } from '../helpers/constants.js'

test.describe('Compare auth integration', () => {
  test('guest is redirected to central auth for listings', async ({ page }) => {
    await page.goto('/listings')
    await expectCentralLoginPage(page)
    expect(page.url()).toContain(AUTH_UI)
    expect(decodeURIComponent(page.url())).toContain('/listings')
  })

  test('signed-in user sees listings after central login', async ({ page }) => {
    const returnUrl = `${COMPARE_UI}/listings`
    await signInViaCentralAuth(page, {
      email: SEED_USER.email,
      password: SEED_USER.password,
      returnUrl
    })
    await expect(page.getByText('No listings yet')).toBeVisible()
    expect(page.url()).toContain('/listings')
  })
})
