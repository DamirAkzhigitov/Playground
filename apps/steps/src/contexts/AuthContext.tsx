import { createAuthProvider } from '@playground/auth-react'
import type { AuthUser } from '@/types'
import { apiRequest } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

const ROLES = ['user', 'contributor', 'admin'] as const

function normalizeRole(role: unknown): AuthUser['role'] {
  return ROLES.includes(role as AuthUser['role'])
    ? (role as AuthUser['role'])
    : 'user'
}

const { AuthProvider, useAuth } = createAuthProvider<AuthUser>({
  apiRequest,
  onLogoutClear: () => queryClient.clear(),
  normalizeUser: (raw) => ({
    id: raw.id as string,
    email: raw.email as string,
    role: normalizeRole(raw.role),
    createdAt: (raw.createdAt as string) ?? new Date().toISOString()
  })
})

export { AuthProvider, useAuth }
