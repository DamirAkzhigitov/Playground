import { describe, expect, it } from 'vitest'

import { isLocalLoggingEnabled, redactData, redactValue } from './localLogger'

describe('localLogger', () => {
  it('is enabled for common truthy flags', () => {
    expect(isLocalLoggingEnabled({ LOCAL_LOGS: '1' })).toBe(true)
    expect(isLocalLoggingEnabled({ LOCAL_LOGS: 'true' })).toBe(true)
    expect(isLocalLoggingEnabled({ LOCAL_LOGS: 'yes' })).toBe(true)
    expect(isLocalLoggingEnabled({ LOCAL_LOGS: '0' })).toBe(false)
    expect(isLocalLoggingEnabled({})).toBe(false)
  })

  it('redacts sensitive keys and bearer tokens', () => {
    expect(redactValue('password', 'secret123')).toBe('[REDACTED]')
    expect(redactValue('Authorization', 'Bearer sk-test')).toBe('[REDACTED]')
    expect(redactValue('note', 'Bearer sk-test')).toBe('[REDACTED Bearer]')
    expect(
      redactData({
        email: 'a@b.com',
        password: 'x',
        nested: { access_token: 'tok' }
      })
    ).toEqual({
      email: 'a@b.com',
      password: '[REDACTED]',
      nested: { access_token: '[REDACTED]' }
    })
  })
})
