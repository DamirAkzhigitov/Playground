import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()

  let message = 'Something went wrong'
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText || 'Error'}`
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    </div>
  )
}
