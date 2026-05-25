import { describe, expect, it } from 'vitest'

import {
  accountNeedsReconnect,
  buildGoogleAuthUrl,
  GMAIL_MODIFY_SCOPE,
  GMAIL_OAUTH_SCOPES,
  redirectUriFromRequest,
  resolvePublicOrigin
} from './oauth'

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

describe('buildGoogleAuthUrl', () => {
  it('requests gmail.modify and userinfo.email scopes', () => {
    const url = new URL(
      buildGoogleAuthUrl(
        'client-id',
        'http://localhost:3003/api/gmail/callback',
        'state-123'
      )
    )
    expect(url.searchParams.get('scope')).toBe(GMAIL_OAUTH_SCOPES)
    expect(url.searchParams.get('scope')).toContain(GMAIL_MODIFY_SCOPE)
    expect(url.searchParams.get('scope')).toContain('userinfo.email')
  })
})

describe('accountNeedsReconnect', () => {
  it('returns true for legacy send-only scope', () => {
    expect(
      accountNeedsReconnect(
        'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email'
      )
    ).toBe(true)
  })

  it('returns false when gmail.modify is granted', () => {
    expect(
      accountNeedsReconnect(
        'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email'
      )
    ).toBe(false)
  })
})
