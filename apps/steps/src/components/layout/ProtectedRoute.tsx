import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: UserRole | 'user' // 'user' means any authenticated
}

const roleRank: Record<UserRole, number> = {
  user: 0,
  contributor: 1,
  admin: 2
}

function hasRequiredRole(
  userRole: UserRole,
  required?: UserRole | 'user'
): boolean {
  if (!required || required === 'user') return true
  return roleRank[userRole] >= roleRank[required]
}

export function ProtectedRoute({
  children,
  requiredRole
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
    // Contributor gate: show message or redirect to home
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-muted-foreground">
          You need contributor permissions to view this page.
        </p>
      </div>
    )
  }

  return children
}
