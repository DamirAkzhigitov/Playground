import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import type { ReactNode } from 'react'

import type { ApiRequestFn, LoginInput, RegisterInput } from './types.js'

export type CreateAuthProviderOptions<
  TUser,
  TExtra extends Record<string, unknown> = Record<string, never>
> = {
  apiRequest: ApiRequestFn
  normalizeUser: (raw: Record<string, unknown>) => TUser
  onLogoutClear?: () => void
  /** Called whenever user state is set (bootstrap, login, register, patch). */
  onUserChange?: (user: TUser | null) => void
  extend?: (helpers: {
    setUser: (user: TUser | null) => void
    apiRequest: ApiRequestFn
    user: TUser | null
  }) => TExtra
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

  const AuthContext = createContext<AuthState | null>(null)

  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const applyUser = useCallback((next: TUser | null) => {
      setUser(next)
      options.onUserChange?.(next)
    }, [])

    useEffect(() => {
      let cancelled = false
      options
        .apiRequest<Record<string, unknown>>('/api/auth/me')
        .then((u) => {
          if (!cancelled) applyUser(options.normalizeUser(u))
        })
        .catch(() => {
          if (!cancelled) applyUser(null)
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
      return () => {
        cancelled = true
      }
    }, [applyUser])

    const login = useCallback(
      async (input: LoginInput) => {
        const u = await options.apiRequest<Record<string, unknown>>(
          '/api/auth/login',
          { method: 'POST', body: input }
        )
        applyUser(options.normalizeUser(u))
      },
      [applyUser]
    )

    const register = useCallback(
      async (input: RegisterInput) => {
        const u = await options.apiRequest<Record<string, unknown>>(
          '/api/auth/register',
          { method: 'POST', body: input }
        )
        applyUser(options.normalizeUser(u))
      },
      [applyUser]
    )

    const logout = useCallback(async () => {
      try {
        await options.apiRequest('/api/auth/logout', { method: 'POST' })
      } catch {
        /* clear local state even if server call fails */
      }
      applyUser(null)
      options.onLogoutClear?.()
    }, [applyUser])

    const extensions = options.extend?.({
      setUser,
      apiRequest: options.apiRequest,
      user
    })

    const value: AuthState = {
      user,
      isLoading,
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

  return { AuthProvider, useAuth }
}
