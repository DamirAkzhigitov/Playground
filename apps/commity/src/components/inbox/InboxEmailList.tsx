import { Inbox } from 'lucide-react'

import type { InboxEmail } from '@/types/inbox'

import { InboxEmailCard } from './InboxEmailCard'

type InboxEmailListProps = {
  emails: InboxEmail[]
}

export function InboxEmailList({ emails }: InboxEmailListProps) {
  if (emails.length === 0) return null

  const heading =
    emails.length === 1 ? '1 message' : `${emails.length} messages`

  return (
    <div className="mt-2 max-w-2xl">
      <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Inbox className="size-3.5" />
        {heading}
      </p>
      <ul className="flex flex-col gap-2">
        {emails.map((email) => (
          <li key={email.messageId}>
            <InboxEmailCard email={email} />
          </li>
        ))}
      </ul>
    </div>
  )
}
