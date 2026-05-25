import {
  deleteMessagePermanently,
  getMessage,
  GmailApiError,
  listMessages,
  starMessage,
  trashMessage,
  untrashMessage,
  type EmailSummary
} from './gmailApi'

export type InboxToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; needsReconnect?: boolean }

function toolError(err: unknown): InboxToolResult {
  if (err instanceof GmailApiError) {
    if (err.status === 401 || err.status === 403) {
      return {
        ok: false,
        error: err.message,
        needsReconnect: true
      }
    }
    return { ok: false, error: err.message }
  }
  if (err instanceof Error) {
    return { ok: false, error: err.message }
  }
  return { ok: false, error: 'Gmail tool failed' }
}

function summariesPayload(messages: EmailSummary[]) {
  return {
    count: messages.length,
    messages: messages.map((m) => ({
      messageId: m.messageId,
      threadId: m.threadId,
      from: m.from,
      to: m.to,
      subject: m.subject,
      date: m.date,
      snippet: m.snippet,
      isStarred: m.isStarred,
      labelIds: m.labelIds
    }))
  }
}

export async function executeInboxTool(
  accessToken: string,
  name: string,
  argsJson: string
): Promise<InboxToolResult> {
  try {
    const args = JSON.parse(argsJson) as Record<string, unknown>

    switch (name) {
      case 'search_emails': {
        const q = typeof args.q === 'string' ? args.q : undefined
        const maxResults =
          typeof args.maxResults === 'number' ? args.maxResults : undefined
        const labelIds = Array.isArray(args.labelIds)
          ? args.labelIds.filter((v): v is string => typeof v === 'string')
          : undefined
        const messages = await listMessages(accessToken, {
          q,
          maxResults,
          labelIds
        })
        return { ok: true, data: summariesPayload(messages) }
      }

      case 'get_email': {
        const messageId =
          typeof args.messageId === 'string' ? args.messageId.trim() : ''
        if (!messageId) {
          return { ok: false, error: 'messageId is required' }
        }
        const message = await getMessage(accessToken, messageId)
        return { ok: true, data: summariesPayload([message]).messages[0] }
      }

      case 'star_email': {
        const messageId =
          typeof args.messageId === 'string' ? args.messageId.trim() : ''
        if (!messageId) {
          return { ok: false, error: 'messageId is required' }
        }
        const starred = args.starred !== false
        const message = await starMessage(accessToken, messageId, starred)
        return {
          ok: true,
          data: {
            messageId: message.messageId,
            isStarred: message.isStarred,
            subject: message.subject
          }
        }
      }

      case 'trash_email': {
        const messageId =
          typeof args.messageId === 'string' ? args.messageId.trim() : ''
        if (!messageId) {
          return { ok: false, error: 'messageId is required' }
        }
        const result = await trashMessage(accessToken, messageId)
        return { ok: true, data: result }
      }

      case 'untrash_email': {
        const messageId =
          typeof args.messageId === 'string' ? args.messageId.trim() : ''
        if (!messageId) {
          return { ok: false, error: 'messageId is required' }
        }
        const message = await untrashMessage(accessToken, messageId)
        return {
          ok: true,
          data: {
            messageId: message.messageId,
            subject: message.subject
          }
        }
      }

      case 'delete_email_permanently': {
        const messageId =
          typeof args.messageId === 'string' ? args.messageId.trim() : ''
        if (!messageId) {
          return { ok: false, error: 'messageId is required' }
        }
        const result = await deleteMessagePermanently(accessToken, messageId)
        return { ok: true, data: result }
      }

      default:
        return { ok: false, error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    return toolError(err)
  }
}
