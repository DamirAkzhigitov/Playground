export type SendEmailInput = {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}

export type EmailSummary = {
  messageId: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  snippet: string
  labelIds: string[]
  isStarred: boolean
}

import { loggedFetch } from '../lib/localLogger'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'
const MAX_LIST_RESULTS = 15
const MAX_SNIPPET_LENGTH = 280

export class GmailApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'GmailApiError'
  }
}

function encodeHeaderValue(value: string): string {
  return value.replace(/\r?\n/g, ' ')
}

function parseAddressList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function formatAddressList(addresses: string[]): string {
  return addresses.join(', ')
}

function truncateSnippet(snippet: string): string {
  const cleaned = snippet.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= MAX_SNIPPET_LENGTH) return cleaned
  return `${cleaned.slice(0, MAX_SNIPPET_LENGTH - 1)}…`
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

type GmailErrorBody = {
  error?: { message?: string; status?: string }
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await loggedFetch(`gmail${path}`, `${GMAIL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  })

  const body = (await response.json()) as T & GmailErrorBody
  if (!response.ok) {
    throw new GmailApiError(
      response.status,
      body.error?.message ?? `Gmail API failed (${response.status})`
    )
  }
  return body
}

function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string {
  const found = headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  )
  return found?.value?.trim() ?? ''
}

function toEmailSummary(message: {
  id?: string
  threadId?: string
  snippet?: string
  labelIds?: string[]
  payload?: { headers?: Array<{ name?: string; value?: string }> }
}): EmailSummary {
  const headers = message.payload?.headers
  const labelIds = message.labelIds ?? []
  return {
    messageId: message.id ?? '',
    threadId: message.threadId ?? '',
    from: headerValue(headers, 'From'),
    to: headerValue(headers, 'To'),
    subject: headerValue(headers, 'Subject') || '(no subject)',
    date: headerValue(headers, 'Date'),
    snippet: truncateSnippet(message.snippet ?? ''),
    labelIds,
    isStarred: labelIds.includes('STARRED')
  }
}

export function buildMimeMessage(input: SendEmailInput): string {
  const to = parseAddressList(input.to)
  if (to.length === 0) {
    throw new Error('At least one recipient is required')
  }

  const lines: string[] = [
    `To: ${formatAddressList(to)}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    ''
  ]

  const cc = parseAddressList(input.cc)
  if (cc.length > 0) {
    lines.splice(1, 0, `Cc: ${formatAddressList(cc)}`)
  }

  const bcc = parseAddressList(input.bcc)
  if (bcc.length > 0) {
    lines.splice(cc.length > 0 ? 2 : 1, 0, `Bcc: ${formatAddressList(bcc)}`)
  }

  lines.push(input.body.replace(/\r\n/g, '\n'))
  return lines.join('\r\n')
}

export async function sendGmailMessage(
  accessToken: string,
  input: SendEmailInput
): Promise<{ id: string }> {
  const mime = buildMimeMessage(input)
  const raw = toBase64Url(new TextEncoder().encode(mime))

  const body = await gmailFetch<{ id?: string }>(
    accessToken,
    '/messages/send',
    {
      method: 'POST',
      body: JSON.stringify({ raw })
    }
  )

  if (!body.id) {
    throw new Error('Failed to send email')
  }
  return { id: body.id }
}

export type ListMessagesInput = {
  q?: string
  maxResults?: number
  labelIds?: string[]
}

export async function listMessages(
  accessToken: string,
  input: ListMessagesInput = {}
): Promise<EmailSummary[]> {
  const maxResults = Math.min(
    Math.max(input.maxResults ?? 10, 1),
    MAX_LIST_RESULTS
  )
  const params = new URLSearchParams({ maxResults: String(maxResults) })
  if (input.q?.trim()) params.set('q', input.q.trim())
  for (const label of input.labelIds ?? []) {
    if (label.trim()) params.append('labelIds', label.trim())
  }

  const list = await gmailFetch<{
    messages?: Array<{ id?: string; threadId?: string }>
  }>(accessToken, `/messages?${params.toString()}`)

  const ids = (list.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, maxResults)

  if (ids.length === 0) return []

  const summaries = await Promise.all(
    ids.map((id) => getMessage(accessToken, id))
  )
  return summaries
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<EmailSummary> {
  const message = await gmailFetch<{
    id?: string
    threadId?: string
    snippet?: string
    labelIds?: string[]
    payload?: { headers?: Array<{ name?: string; value?: string }> }
  }>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
  )

  if (!message.id) {
    throw new Error('Message not found')
  }
  return toEmailSummary(message)
}

export async function modifyMessage(
  accessToken: string,
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<EmailSummary> {
  const message = await gmailFetch<{
    id?: string
    threadId?: string
    snippet?: string
    labelIds?: string[]
    payload?: { headers?: Array<{ name?: string; value?: string }> }
  }>(accessToken, `/messages/${encodeURIComponent(messageId)}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds, removeLabelIds })
  })
  return toEmailSummary(message)
}

export async function starMessage(
  accessToken: string,
  messageId: string,
  starred: boolean
): Promise<EmailSummary> {
  return modifyMessage(
    accessToken,
    messageId,
    starred ? ['STARRED'] : [],
    starred ? [] : ['STARRED']
  )
}

export async function trashMessage(
  accessToken: string,
  messageId: string
): Promise<{ messageId: string }> {
  const message = await gmailFetch<{ id?: string }>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/trash`,
    { method: 'POST' }
  )
  return { messageId: message.id ?? messageId }
}

export async function untrashMessage(
  accessToken: string,
  messageId: string
): Promise<EmailSummary> {
  const message = await gmailFetch<{
    id?: string
    threadId?: string
    snippet?: string
    labelIds?: string[]
    payload?: { headers?: Array<{ name?: string; value?: string }> }
  }>(accessToken, `/messages/${encodeURIComponent(messageId)}/untrash`, {
    method: 'POST'
  })
  return toEmailSummary(message)
}

export async function deleteMessagePermanently(
  accessToken: string,
  messageId: string
): Promise<{ messageId: string }> {
  await gmailFetch<Record<string, never>>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}`,
    { method: 'DELETE' }
  )
  return { messageId }
}
