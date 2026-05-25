import { ProtectedRoute as SharedProtectedRoute } from '@playground/auth-react'

import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  return <SharedProtectedRoute auth={auth}>{children}</SharedProtectedRoute>
}
