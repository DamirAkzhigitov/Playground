import { describe, expect, it } from 'vitest'

import { shouldShowMessageBubble } from './chatMessageDisplay'

describe('shouldShowMessageBubble', () => {
  it('shows assistant bubble alongside inbox cards when content is present', () => {
    expect(
      shouldShowMessageBubble({
        id: '1',
        role: 'assistant',
        content: 'I found one message from Maria…',
        createdAt: '',
        inboxEmails: [
          {
            messageId: 'abc',
            threadId: 't',
            from: 'maria@example.com',
            to: 'me@example.com',
            subject: 'Hi',
            date: 'Mon, 1 Jan 2024 12:00:00 +0000',
            snippet: 'Hey',
            isStarred: false
          }
        ]
      })
    ).toBe(true)
  })

  it('hides bubble when content is empty even with inbox cards', () => {
    expect(
      shouldShowMessageBubble({
        id: '1',
        role: 'assistant',
        content: '   ',
        createdAt: '',
        inboxEmails: [
          {
            messageId: 'abc',
            threadId: 't',
            from: 'maria@example.com',
            to: 'me@example.com',
            subject: 'Hi',
            date: 'Mon, 1 Jan 2024 12:00:00 +0000',
            snippet: 'Hey',
            isStarred: false
          }
        ]
      })
    ).toBe(false)
  })

  it('shows user and plain assistant bubbles', () => {
    expect(
      shouldShowMessageBubble({
        id: '1',
        role: 'user',
        content: 'hello',
        createdAt: ''
      })
    ).toBe(true)
    expect(
      shouldShowMessageBubble({
        id: '2',
        role: 'assistant',
        content: 'Hi there',
        createdAt: ''
      })
    ).toBe(true)
  })
})
