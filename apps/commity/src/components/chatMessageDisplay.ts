import type { ChatMessage } from '@/types'

/** True when the message has non-empty text to show above inbox cards or drafts. */
export function shouldShowMessageBubble(message: ChatMessage): boolean {
  return Boolean(message.content?.trim())
}
