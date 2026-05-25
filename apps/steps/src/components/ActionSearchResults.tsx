import type { ActionSummary } from '@/types'
import { ActionCard } from '@/components/ActionCard'
import { Skeleton } from '@/components/ui/skeleton'

type ActionSearchResultsProps = {
  items: ActionSummary[]
  isLoading?: boolean
}

export function ActionSearchResults({
  items,
  isLoading
}: ActionSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No actions found</p>
        <p className="mt-2">
          Try searching for <span className="text-foreground">mortgage</span>,{' '}
          <span className="text-foreground">housing</span>, or{' '}
          <span className="text-foreground">finance</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  )
}
