import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSiteUrl } from '@/lib/site'

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers NEXT_PUBLIC_SITE_URL and strips a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com/')

    expect(getSiteUrl()).toBe('https://example.com')
  })

  it('falls back to localhost in development', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('NODE_ENV', 'development')

    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('falls back to the production compare domain otherwise', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect(getSiteUrl()).toBe('https://compare.da-mr.com')
  })
})
