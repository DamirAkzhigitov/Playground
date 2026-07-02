import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState.tsx'
import { useI18n } from '@/context/I18nContext'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useI18n()

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorState
        message={t('errors.routerError', {
          status: error.status,
          detail: error.statusText || t('errors.routeUnknown')
        })}
      ></ErrorState>
    )
  }
}
