import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { resolveReturnUrl } from '@playground/auth-react'

type AuthRedirectProps = {
  buildUrl: (returnUrl: string) => string
}

export function AuthRedirect({ buildUrl }: AuthRedirectProps) {
  const [search] = useSearchParams()

  useEffect(() => {
    const candidate = search.get('returnUrl')
    const returnUrl = resolveReturnUrl(candidate, window.location.href)
    window.location.replace(buildUrl(returnUrl))
  }, [search, buildUrl])

  return (
    <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
