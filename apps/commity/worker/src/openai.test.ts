import { describe, expect, it } from 'vitest'

import { parsePrepareEmailArgs } from './openai'

describe('parsePrepareEmailArgs', () => {
  it('parses valid prepare_email arguments', () => {
    const draft = parsePrepareEmailArgs(
      JSON.stringify({
        to: 'friend@example.com',
        subject: 'Hello',
        body: 'Hi there',
        cc: 'boss@example.com'
      })
    )
    expect(draft).toEqual({
      to: 'friend@example.com',
      subject: 'Hello',
      body: 'Hi there',
      cc: 'boss@example.com'
    })
  })

  it('returns null for invalid JSON', () => {
    expect(parsePrepareEmailArgs('not json')).toBeNull()
  })

  it('returns null when required fields are missing', () => {
    expect(parsePrepareEmailArgs(JSON.stringify({ to: 'a@b.com' }))).toBeNull()
  })
})
