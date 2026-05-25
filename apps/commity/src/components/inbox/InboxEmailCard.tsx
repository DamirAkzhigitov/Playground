import { Inbox, Star } from 'lucide-react'

import type { InboxEmail } from '@/types/inbox'
import { cn } from '@/lib/utils'

import { formatEmailDate } from './formatEmailDate'

type InboxEmailCardProps = {
  email: InboxEmail
  className?: string
}

export function InboxEmailCard({ email, className }: InboxEmailCardProps) {
  const unread = email.labelIds?.includes('UNREAD') ?? false

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm',
        unread && 'border-primary/30',
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Inbox className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{email.subject}</span>
        </div>
        {email.isStarred ? (
          <Star
            className="size-4 shrink-0 fill-amber-400 text-amber-500"
            aria-label="Starred"
          />
        ) : null}
      </div>

      <dl className="space-y-1 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-10 shrink-0 font-medium text-foreground/70">From</dt>
          <dd className="min-w-0 truncate">{email.from}</dd>
        </div>
        {email.to ? (
          <div className="flex gap-2">
            <dt className="w-10 shrink-0 font-medium text-foreground/70">To</dt>
            <dd className="min-w-0 truncate">{email.to}</dd>
          </div>
        ) : null}
        {email.date ? (
          <div className="flex gap-2">
            <dt className="w-10 shrink-0 font-medium text-foreground/70">
              Date
            </dt>
            <dd>{formatEmailDate(email.date)}</dd>
          </div>
        ) : null}
      </dl>

      {email.snippet ? (
        <p className="mt-3 line-clamp-3 text-sm text-foreground/90">
          {email.snippet}
        </p>
      ) : null}

      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
        {email.messageId}
      </p>
    </article>
  )
}
