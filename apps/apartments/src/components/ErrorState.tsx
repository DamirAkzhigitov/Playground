import { AlertTriangle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type ErrorStateProps = {
  message?: string
}

export function ErrorState({
  message = 'Something went wrong.'
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex items-start gap-3 py-4 text-sm text-destructive">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </CardContent>
    </Card>
  )
}
