import { describe, expect, it } from 'vitest'

import { parsePrepareEmailArgs, resolveChatResponseContent } from './openai'
import type { InboxEmail } from './gmail/inboxEmailPayload'

const sampleInboxEmail: InboxEmail = {
  messageId: 'msg-1',
  threadId: 'thread-1',
  from: 'a@example.com',
  to: 'b@example.com',
  subject: 'Hi',
  date: 'Mon, 1 Jan 2024 12:00:00 +0000',
  snippet: 'Hello',
  isStarred: false,
  labelIds: ['INBOX']
}

describe('resolveChatResponseContent', () => {
  it('drops false failure text when inbox cards are present', () => {
    expect(
      resolveChatResponseContent(
        'It seems there was an error with the date information provided.',
        { inboxEmails: [sampleInboxEmail] }
      )
    ).toBe('')
  })

  it('keeps helpful follow-up when inbox cards are present', () => {
    const followUp =
      'Here are the recent messages from Kakoullis. Review them for details — let me know if you need more help.'
    expect(
      resolveChatResponseContent(followUp, { inboxEmails: [sampleInboxEmail] })
    ).toBe(followUp)
  })

  it('uses model text when there are no inbox results', () => {
    expect(
      resolveChatResponseContent('Here is a normal reply.', {
        inboxEmails: []
      })
    ).toBe('Here is a normal reply.')
  })

  it('keeps draft default when preparing email without inbox', () => {
    expect(
      resolveChatResponseContent('', {
        inboxEmails: [],
        emailDraft: {
          to: 'a@b.com',
          subject: 'S',
          body: 'B'
        }
      })
    ).toBe("I've prepared an email draft for you to review below.")
  })
})

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
