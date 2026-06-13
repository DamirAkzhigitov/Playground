import {
  buildAuthLoginUrl,
  ProtectedRoute as SharedProtectedRoute
} from '@playground/auth-react'

import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: UserRole | 'user'
}

export function ProtectedRoute({
  children,
  requiredRole
}: ProtectedRouteProps) {
  const auth = useAuth()
  const loginPath = buildAuthLoginUrl(window.location.href)
  return (
    <SharedProtectedRoute
      auth={auth}
      loginPath={loginPath}
      requiredRole={requiredRole}
    >
      {children}
    </SharedProtectedRoute>
  )
}
