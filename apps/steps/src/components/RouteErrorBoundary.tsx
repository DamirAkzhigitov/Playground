import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from './ErrorState'

export function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorState
        message={`Error ${error.status}: ${error.statusText || 'Unknown route error'}`}
      />
    )
  }

  if (error instanceof Error) {
    return <ErrorState message={error.message} />
  }

  return <ErrorState message="Something went wrong." />
}
