import { createAuthProvider } from '@playground/auth-react'
import type { AuthUser } from '@/types'
import { queryClient } from '@/lib/queryClient'

const ROLES = ['user', 'contributor', 'admin'] as const

function normalizeRole(role: unknown): AuthUser['role'] {
  return ROLES.includes(role as AuthUser['role'])
    ? (role as AuthUser['role'])
    : 'user'
}

type StepsAuthExtra = {
  signInWithSocial: (provider: 'google' | 'facebook') => Promise<void>
}

const { AuthProvider, useAuth } = createAuthProvider<AuthUser, StepsAuthExtra>({
  onLogoutClear: () => queryClient.clear(),
  normalizeUser: (raw) => ({
    id: raw.id as string,
    email: raw.email as string,
    role: normalizeRole(raw.role),
    createdAt:
      (raw.createdAt as string) ??
      (raw.created_at as string) ??
      new Date().toISOString()
  }),
  extend: ({ authClient }) => ({
    signInWithSocial: async (provider) => {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin
      })
    }
  })
})

export { AuthProvider, useAuth }
