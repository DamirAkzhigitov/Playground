import type { InboxEmail } from '@/types/inbox'

export function parseInboxEmail(value: unknown): InboxEmail | undefined {
  if (typeof value !== 'object' || value === null) return undefined
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
    return undefined
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

export function parseInboxEmails(value: unknown): InboxEmail[] | undefined {
  if (!Array.isArray(value)) return undefined
  const emails = value
    .map((item) => parseInboxEmail(item))
    .filter((e): e is InboxEmail => e !== undefined)
  return emails.length > 0 ? emails : undefined
}
