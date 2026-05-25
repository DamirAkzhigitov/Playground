/** Client-facing shape for inbox messages shown in chat cards. */
export type InboxEmail = {
  messageId: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  snippet: string
  isStarred: boolean
  labelIds?: string[]
}

export function parseInboxEmail(value: unknown): InboxEmail | null {
  if (typeof value !== 'object' || value === null) return null
  const o = value as Record<string, unknown>
  if (
    typeof o.messageId !== 'string' ||
    !o.messageId.trim() ||
    typeof o.threadId !== 'string' ||
    typeof o.from !== 'string' ||
    typeof o.to !== 'string' ||
    typeof o.subject !== 'string' ||
    typeof o.date !== 'string' ||
    typeof o.snippet !== 'string' ||
    typeof o.isStarred !== 'boolean'
  ) {
    return null
  }
  const email: InboxEmail = {
    messageId: o.messageId.trim(),
    threadId: o.threadId,
    from: o.from,
    to: o.to,
    subject: o.subject,
    date: o.date,
    snippet: o.snippet,
    isStarred: o.isStarred
  }
  if (Array.isArray(o.labelIds)) {
    email.labelIds = o.labelIds.filter(
      (v): v is string => typeof v === 'string'
    )
  }
  return email
}

export function collectInboxEmailsFromTool(
  toolName: string,
  data: unknown
): InboxEmail[] {
  if (toolName === 'search_emails') {
    if (typeof data !== 'object' || data === null) return []
    const messages = (data as { messages?: unknown }).messages
    if (!Array.isArray(messages)) return []
    return messages
      .map((m) => parseInboxEmail(m))
      .filter((m): m is InboxEmail => m !== null)
  }
  if (toolName === 'get_email') {
    const one = parseInboxEmail(data)
    return one ? [one] : []
  }
  return []
}

export function mergeInboxEmails(
  existing: InboxEmail[],
  added: InboxEmail[]
): InboxEmail[] {
  const byId = new Map(existing.map((e) => [e.messageId, e]))
  for (const email of added) {
    byId.set(email.messageId, email)
  }
  return [...byId.values()]
}
