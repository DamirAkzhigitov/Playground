import { describe, expect, it } from 'vitest'

import { redirectUriFromRequest, resolvePublicOrigin } from './oauth'

describe('resolvePublicOrigin', () => {
  it('prefers APP_PUBLIC_ORIGIN over request URL', () => {
    expect(
      resolvePublicOrigin('http://localhost:8788/api/gmail/connect', {
        publicOrigin: 'http://localhost:3003'
      })
    ).toBe('http://localhost:3003')
  })

  it('uses X-Forwarded-Host when proxied', () => {
    expect(
      resolvePublicOrigin('http://localhost:8788/api/gmail/connect', {
        forwardedHost: 'localhost:3003',
        forwardedProto: 'http'
      })
    ).toBe('http://localhost:3003')
  })

  it('builds matching redirect URI for Google OAuth', () => {
    expect(
      redirectUriFromRequest('http://localhost:8788/api/gmail/connect', {
        publicOrigin: 'http://localhost:3003'
      })
    ).toBe('http://localhost:3003/api/gmail/callback')
  })
})
