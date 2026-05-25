import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

import type { UserRole } from './types.js'

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

export type ProtectedRouteAuth = {
  user: { role?: UserRole; [key: string]: unknown } | null
  isLoading: boolean
}

export type ProtectedRouteProps = {
  auth: ProtectedRouteAuth
  children: ReactNode
  loginPath?: string
  requiredRole?: UserRole | 'user'
  forbiddenFallback?: ReactNode
}

const defaultForbidden = (
  <div className="mx-auto max-w-md p-8 text-center">
    <h1 className="text-xl font-semibold">Access restricted</h1>
    <p className="mt-2 text-muted-foreground">
      You need contributor permissions to view this page.
    </p>
  </div>
)

export function ProtectedRoute({
  auth,
  children,
  loginPath = '/login',
  requiredRole,
  forbiddenFallback = defaultForbidden
}: ProtectedRouteProps) {
  const { user, isLoading } = auth

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={loginPath} replace />
  }

  if (requiredRole && user.role && !hasRequiredRole(user.role, requiredRole)) {
    return forbiddenFallback
  }

  return children
}
