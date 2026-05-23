import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EmailDraftCard } from './EmailDraftCard'
import * as gmail from '@/lib/gmail'

vi.mock('@/lib/gmail', () => ({
  connectGmailUrl: () => '/api/gmail/connect',
  sendEmail: vi.fn()
}))

const draft = {
  to: 'test@example.com',
  subject: 'Test',
  body: 'Hello'
}

describe('EmailDraftCard', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.mocked(gmail.sendEmail).mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('shows Connect Gmail when not connected', () => {
    act(() => {
      root.render(
        <EmailDraftCard
          draft={draft}
          gmailConnected={false}
          sent={false}
          onDraftChange={() => {}}
          onDiscard={() => {}}
          onSent={() => {}}
        />
      )
    })
    const link = container.querySelector('a[href="/api/gmail/connect"]')
    expect(link?.textContent).toMatch(/connect gmail/i)
    expect(container.textContent).not.toMatch(/send email/i)
  })

  it('calls sendEmail on confirm when connected', async () => {
    const onSent = vi.fn()
    vi.mocked(gmail.sendEmail).mockResolvedValue({
      ok: true,
      messageId: 'msg-1'
    })

    act(() => {
      root.render(
        <EmailDraftCard
          draft={draft}
          gmailConnected={true}
          sent={false}
          onDraftChange={() => {}}
          onDiscard={() => {}}
          onSent={onSent}
        />
      )
    })

    const sendBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.match(/send email/i)
    )
    expect(sendBtn).toBeTruthy()

    await act(async () => {
      sendBtn!.click()
    })

    expect(gmail.sendEmail).toHaveBeenCalledWith(draft)
    expect(onSent).toHaveBeenCalled()
  })
})
