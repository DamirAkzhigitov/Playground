import { expect, test } from '@playwright/test'

test.describe('compare-next catalogue', () => {
  test('home page renders catalogue heading and cards', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Compare catalogue \| Compare/)
    await expect(
      page.getByRole('heading', { name: 'Compare catalogue' })
    ).toBeVisible()
    await expect(page.locator('.catalogue__grid .card').first()).toBeVisible()
  })

  test('hot route uses a single title suffix', async ({ page }) => {
    await page.goto('/hot')

    await expect(page).toHaveTitle(/^Hot comparisons \| Compare$/)
    await expect(
      page.getByRole('heading', { name: 'Hot comparisons' })
    ).toBeVisible()
  })

  test('catalogue API returns D1-backed paginated data', async ({
    request
  }) => {
    const response = await request.get('/api/catalogue?page=0&sort=new')

    expect(response.ok()).toBeTruthy()

    const body = (await response.json()) as {
      items: unknown[]
      total: number
      nextPage: number | null
    }

    expect(body.items.length).toBeGreaterThan(0)
    expect(body.total).toBeGreaterThanOrEqual(body.items.length)
    if (body.total > body.items.length) {
      expect(body.nextPage).toBe(1)
    } else {
      expect(body.nextPage).toBeNull()
    }
  })
})

test.describe('compare-next comparison pages', () => {
  test('GPU pair page renders comparison heading and spec table', async ({
    page
  }) => {
    await page.goto('/compare/gpu/rtx-3070-vs-rtx-5080')

    await expect(
      page.getByRole('heading', {
        name: /GeForce RTX 3070 vs GeForce RTX 5080/i
      })
    ).toBeVisible()
    await expect(page.locator('.cmp-table')).toBeVisible()
  })
})
