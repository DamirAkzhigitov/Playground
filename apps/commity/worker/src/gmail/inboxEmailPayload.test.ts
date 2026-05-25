import { describe, expect, it } from 'vitest'

import {
  collectInboxEmailsFromTool,
  mergeInboxEmails,
  parseInboxEmail
} from './inboxEmailPayload'

const sample = {
  messageId: 'msg-1',
  threadId: 'thread-1',
  from: 'Alice <alice@example.com>',
  to: 'me@example.com',
  subject: 'Hello',
  date: 'Mon, 1 Jan 2024 12:00:00 +0000',
  snippet: 'Preview text',
  isStarred: false,
  labelIds: ['INBOX', 'UNREAD']
}

describe('inboxEmailPayload', () => {
  it('parses a valid email summary', () => {
    expect(parseInboxEmail(sample)).toEqual(sample)
  })

  it('collects emails from search_emails tool data', () => {
    const emails = collectInboxEmailsFromTool('search_emails', {
      count: 1,
      messages: [sample]
    })
    expect(emails).toHaveLength(1)
    expect(emails[0]?.messageId).toBe('msg-1')
  })

  it('collects a single email from get_email tool data', () => {
    const emails = collectInboxEmailsFromTool('get_email', sample)
    expect(emails).toHaveLength(1)
  })

  it('merges by messageId without duplicates', () => {
    const merged = mergeInboxEmails(
      [sample],
      [
        { ...sample, subject: 'Updated', messageId: 'msg-1' },
        { ...sample, messageId: 'msg-2' }
      ]
    )
    expect(merged).toHaveLength(2)
    expect(merged.find((e) => e.messageId === 'msg-1')?.subject).toBe('Updated')
  })
})
