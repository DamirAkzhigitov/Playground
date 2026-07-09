import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchCataloguePage } from '@/data/fetchCatalogue'

describe('fetchCataloguePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests the catalogue API with page, query, and sort params', async () => {
    const payload = { items: [], nextPage: null, total: 0 }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload)
      })
    )

    await expect(fetchCataloguePage(2, 'rtx', 'hot')).resolves.toEqual(payload)
    expect(fetch).toHaveBeenCalledWith('/api/catalogue?page=2&q=rtx&sort=hot')
  })

  it('defaults to the new sort when none is provided', async () => {
    const payload = { items: [], nextPage: null, total: 0 }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload)
      })
    )

    await fetchCataloguePage(0, '')

    expect(fetch).toHaveBeenCalledWith('/api/catalogue?page=0&q=&sort=new')
  })

  it('throws when the API returns a non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    )

    await expect(fetchCataloguePage(1, 'gpu')).rejects.toThrow(
      'Catalogue API error: 500'
    )
  })
})
