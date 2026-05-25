import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3 text-sm text-destructive">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <span>{message}</span>
        </div>
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
