import { Link } from 'react-router-dom'

import type { ActionSummary } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ActionCardProps = {
  action: ActionSummary
  stepCount?: number
  className?: string
}

export function ActionCard({ action, stepCount, className }: ActionCardProps) {
  return (
    <Link
      to={`/actions/${action.slug}`}
      className={cn(
        'block rounded-xl border bg-card p-4 shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <h3 className="font-medium leading-snug">{action.title}</h3>
      {action.summary ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {action.summary}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {action.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="tag">
            {tag}
          </Badge>
        ))}
        {stepCount !== undefined ? (
          <span className="text-xs text-muted-foreground">
            {stepCount} steps
          </span>
        ) : null}
      </div>
    </Link>
  )
}
