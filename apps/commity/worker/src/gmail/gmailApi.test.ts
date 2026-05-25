import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildMimeMessage,
  getMessage,
  listMessages,
  modifyMessage,
  starMessage,
  trashMessage
} from './gmailApi'

describe('buildMimeMessage', () => {
  it('builds a plain-text MIME message', () => {
    const mime = buildMimeMessage({
      to: 'a@example.com',
      subject: 'Hi',
      body: 'Hello'
    })
    expect(mime).toContain('To: a@example.com')
    expect(mime).toContain('Subject: Hi')
    expect(mime).toContain('Hello')
  })
})

describe('listMessages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches list then metadata for each message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ id: 'msg-1', threadId: 'thr-1' }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg-1',
          threadId: 'thr-1',
          snippet: 'Short preview',
          labelIds: ['INBOX'],
          payload: {
            headers: [
              { name: 'From', value: 'Alice <alice@example.com>' },
              { name: 'Subject', value: 'Test' }
            ]
          }
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    const results = await listMessages('token', {
      q: 'from:alice',
      maxResults: 5
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.messageId).toBe('msg-1')
    expect(results[0]?.subject).toBe('Test')
    expect(results[0]?.from).toContain('alice@example.com')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('getMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses metadata headers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'msg-2',
          threadId: 'thr-2',
          snippet: 'Body preview',
          labelIds: ['INBOX', 'STARRED'],
          payload: {
            headers: [
              { name: 'From', value: 'bob@example.com' },
              { name: 'Subject', value: 'Hello' },
              { name: 'Date', value: 'Mon, 1 Jan 2024 00:00:00 +0000' }
            ]
          }
        })
      })
    )

    const message = await getMessage('token', 'msg-2')
    expect(message.isStarred).toBe(true)
    expect(message.subject).toBe('Hello')
  })
})

describe('modify and trash', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stars a message via modify', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'msg-3',
          threadId: 'thr-3',
          snippet: 'x',
          labelIds: ['INBOX', 'STARRED'],
          payload: { headers: [{ name: 'Subject', value: 'Star me' }] }
        })
      })
    )

    const message = await starMessage('token', 'msg-3', true)
    expect(message.isStarred).toBe(true)
  })

  it('trashes a message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-4' })
      })
    )

    const result = await trashMessage('token', 'msg-4')
    expect(result.messageId).toBe('msg-4')
  })

  it('modifyMessage sends label changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'msg-5',
        labelIds: ['UNREAD'],
        payload: { headers: [] }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await modifyMessage('token', 'msg-5', [], ['UNREAD'])
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      addLabelIds: [],
      removeLabelIds: ['UNREAD']
    })
  })
})
