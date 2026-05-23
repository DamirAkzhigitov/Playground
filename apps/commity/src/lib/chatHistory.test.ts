import { describe, expect, it, beforeEach } from 'vitest'

import {
  clearThread,
  createMessage,
  loadThread,
  MAX_API_MESSAGES,
  resetMemoryStorage,
  saveThread,
  sliceForApi
} from './chatHistory'

const USER = 'user-test-1'

describe('chatHistory', () => {
  beforeEach(() => {
    resetMemoryStorage()
    clearThread(USER)
  })

  it('persists and loads messages per user', () => {
    const msg = createMessage('user', 'hello')
    saveThread(USER, [msg])
    expect(loadThread(USER)).toEqual([msg])
  })

  it('sliceForApi returns at most MAX_API_MESSAGES', () => {
    const messages = Array.from({ length: 25 }, (_, i) =>
      createMessage('user', `m${i}`)
    )
    const sliced = sliceForApi(messages)
    expect(sliced).toHaveLength(MAX_API_MESSAGES)
    expect(sliced[0]?.content).toBe('m5')
    expect(sliced.at(-1)?.content).toBe('m24')
  })

  it('clearThread removes storage', () => {
    saveThread(USER, [createMessage('user', 'x')])
    clearThread(USER)
    expect(loadThread(USER)).toEqual([])
  })

  it('persists emailDraft on assistant messages', () => {
    const msg = createMessage('assistant', 'Draft ready', {
      emailDraft: {
        to: 'a@example.com',
        subject: 'Hi',
        body: 'Body text'
      }
    })
    saveThread(USER, [msg])
    expect(loadThread(USER)).toEqual([msg])
  })
})
