import { createAuthClient } from 'better-auth/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from 'react'
import type { ReactNode } from 'react'

import type { LoginInput, RegisterInput } from './types.js'

type AuthClient = ReturnType<typeof createAuthClient>

export type CreateAuthProviderOptions<
  TUser,
  TExtra extends Record<string, unknown> = Record<string, never>
> = {
  /** Optional API origin; omit when SPA and Worker share an origin. */
  baseURL?: string
  normalizeUser: (raw: Record<string, unknown>) => TUser
  onLogoutClear?: () => void
  onUserChange?: (user: TUser | null) => void
  extend?: (helpers: { authClient: AuthClient; user: TUser | null }) => TExtra
}

export type BaseAuthState<TUser> = {
  user: TUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export function createAuthProvider<
  TUser extends { id: string; email: string },
  TExtra extends Record<string, unknown> = Record<string, never>
>(options: CreateAuthProviderOptions<TUser, TExtra>) {
  type AuthState = BaseAuthState<TUser> & TExtra

  const authClient = createAuthClient({
    baseURL: options.baseURL
  })

  const AuthContext = createContext<AuthState | null>(null)

  function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, isPending, refetch } = authClient.useSession()

    const user = useMemo(() => {
      if (!session?.user) return null
      return options.normalizeUser(
        session.user as unknown as Record<string, unknown>
      )
    }, [session?.user])

    useEffect(() => {
      options.onUserChange?.(user)
    }, [user])

    const login = useCallback(
      async (input: LoginInput) => {
        const result = await authClient.signIn.email({
          email: input.email,
          password: input.password
        })
        if (result.error) {
          throw new Error(result.error.message ?? 'Sign in failed')
        }
        await refetch()
      },
      [refetch]
    )

    const register = useCallback(
      async (input: RegisterInput) => {
        const result = await authClient.signUp.email({
          email: input.email,
          password: input.password,
          name: input.email.split('@')[0] ?? 'User'
        })
        if (result.error) {
          throw new Error(result.error.message ?? 'Registration failed')
        }
        await refetch()
      },
      [refetch]
    )

    const logout = useCallback(async () => {
      try {
        await authClient.signOut()
      } catch {
        /* clear local state even if server call fails */
      }
      options.onLogoutClear?.()
      await refetch()
    }, [refetch])

    const extensions = options.extend?.({ authClient, user })

    const value: AuthState = {
      user,
      isLoading: isPending,
      login,
      register,
      logout,
      ...(extensions ?? ({} as TExtra))
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  function useAuth(): AuthState {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
  }

  return { AuthProvider, useAuth, authClient }
}
