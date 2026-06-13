import {
  buildAuthLoginUrl,
  ProtectedRoute as SharedProtectedRoute
} from '@playground/auth-react'

import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const loginPath = buildAuthLoginUrl(window.location.href)
  return (
    <SharedProtectedRoute auth={auth} loginPath={loginPath}>
      {children}
    </SharedProtectedRoute>
  )
}
