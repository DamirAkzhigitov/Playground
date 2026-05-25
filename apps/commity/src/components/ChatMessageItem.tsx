import { X } from 'lucide-react'

import { EmailDraftCard } from '@/components/EmailDraftCard'
import { shouldShowMessageBubble } from '@/components/chatMessageDisplay'
import { InboxEmailList } from '@/components/inbox/InboxEmailList'
import { Button } from '@/components/ui/button'
import type { ChatMessage, EmailDraft } from '@/types'
import { cn } from '@/lib/utils'

type ChatMessageItemProps = {
  message: ChatMessage
  gmailConnected: boolean
  onUpdate: (patch: Partial<ChatMessage>) => void
  onRemove?: () => void
}

export function ChatMessageItem({
  message: msg,
  gmailConnected,
  onUpdate,
  onRemove
}: ChatMessageItemProps) {
  const isUser = msg.role === 'user'
  const showBubble = shouldShowMessageBubble(msg)
  const hasInbox = Boolean(msg.inboxEmails?.length)
  const hasDraft = Boolean(msg.emailDraft)
  const showAssistantChrome = !isUser && (showBubble || hasInbox || hasDraft)
  const showUserChrome = isUser && showBubble

  const removeButton = onRemove ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      title="Remove message"
      aria-label="Remove message"
      onClick={onRemove}
    >
      <X className="size-4" />
    </Button>
  ) : null

  const body = (
    <>
      {showBubble ? (
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
            isUser
              ? 'max-w-[85%] bg-primary text-primary-foreground'
              : 'border bg-card text-card-foreground'
          )}
        >
          {msg.content}
        </div>
      ) : null}

      {!isUser && hasInbox ? (
        <InboxEmailList emails={msg.inboxEmails!} />
      ) : null}

      {!isUser && hasDraft ? (
        <EmailDraftCard
          draft={msg.emailDraft!}
          gmailConnected={gmailConnected}
          sent={msg.emailSent === true}
          onDraftChange={(next: EmailDraft) => onUpdate({ emailDraft: next })}
          onDiscard={() =>
            onUpdate({ emailDraft: undefined, emailSent: undefined })
          }
          onSent={() => onUpdate({ emailSent: true })}
        />
      ) : null}
    </>
  )

  if (isUser) {
    if (!showUserChrome) return null
    return (
      <li className="flex flex-col">
        <div className="ml-auto flex max-w-2xl items-start gap-1">
          {removeButton}
          <div className="min-w-0 flex flex-col items-end">{body}</div>
        </div>
      </li>
    )
  }

  if (!showAssistantChrome) return null

  return (
    <li className="flex flex-col">
      <div className="mr-auto flex w-full max-w-2xl items-start gap-1">
        <div className="min-w-0 flex-1 flex flex-col">{body}</div>
        {removeButton}
      </div>
    </li>
  )
}
