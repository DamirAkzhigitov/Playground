import { apiRequest } from '@/lib/api'
import type { EmailDraft } from '@/types'

export type GmailStatus = {
  connected: boolean
  email?: string
}

export type ChatResponse = {
  message: { role: 'assistant'; content: string }
  emailDraft?: EmailDraft
  gmailRequired?: boolean
}

export type SendEmailResponse = {
  ok: boolean
  messageId: string
}

export function fetchGmailStatus(): Promise<GmailStatus> {
  return apiRequest<GmailStatus>('/api/gmail/status')
}

export function sendEmail(draft: EmailDraft): Promise<SendEmailResponse> {
  return apiRequest<SendEmailResponse>('/api/gmail/send', {
    method: 'POST',
    body: draft
  })
}

export function disconnectGmail(): Promise<void> {
  return apiRequest<void>('/api/gmail/disconnect', { method: 'POST' })
}

export function connectGmailUrl(): string {
  return '/api/gmail/connect'
}
