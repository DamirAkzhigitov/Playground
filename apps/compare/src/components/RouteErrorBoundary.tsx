import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
import { ErrorState } from './ErrorState'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useI18n()

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorState
        message={t('errors.routeError', {
          status: error.status,
          detail: error.statusText || t('errors.routeUnknown')
        })}
      />
    )
  }

  if (error instanceof Error) {
    return <ErrorState message={error.message} />
  }

  return <ErrorState message={t('errors.generic')} />
}
