import { describe, expect, it } from 'vitest'

import { validateReturnUrl } from '@playground/auth-react'

describe('auth app', () => {
  it('scaffold is wired', () => {
    expect(true).toBe(true)
  })

  it('accepts return URLs on tool subdomains', () => {
    expect(validateReturnUrl('https://steps.da-mr.com/actions/foo')).toBe(true)
  })

  it('rejects off-site return URLs', () => {
    expect(validateReturnUrl('https://evil.example/phish')).toBe(false)
  })
})
