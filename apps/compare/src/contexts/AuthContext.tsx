import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import type { ReactNode } from 'react'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'
import type { AppLocale } from '@/i18n/locale'
import { apiRequest } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { isAppLocale, LOCALE_STORAGE_KEY } from '@/i18n/locale'

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  updateLocale: (locale: AppLocale) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const normalizeUser = useCallback(
    (raw: {
      id: string
      email: string
      createdAt?: string
      locale?: string | null
    }): AuthUser => {
      return {
        id: raw.id,
        email: raw.email,
        createdAt: raw.createdAt ?? new Date().toISOString(),
        locale: isAppLocale(raw.locale) ? raw.locale : 'en'
      }
    },
    []
  )

  const persistLocaleHint = useCallback((locale: AppLocale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiRequest<{
      id: string
      email: string
      createdAt?: string
      locale?: string | null
    }>('/api/auth/me')
      .then((u) => {
        if (!cancelled) {
          const next = normalizeUser(u)
          setUser(next)
          persistLocaleHint(next.locale)
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [normalizeUser, persistLocaleHint])

  const login = useCallback(
    async (input: LoginInput) => {
      const u = await apiRequest<{
        id: string
        email: string
        createdAt?: string
        locale?: string | null
      }>('/api/auth/login', {
        method: 'POST',
        body: input
      })
      const next = normalizeUser(u)
      setUser(next)
      persistLocaleHint(next.locale)
    },
    [normalizeUser, persistLocaleHint]
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const u = await apiRequest<{
        id: string
        email: string
        createdAt?: string
        locale?: string | null
      }>('/api/auth/register', {
        method: 'POST',
        body: input
      })
      const next = normalizeUser(u)
      setUser(next)
      persistLocaleHint(next.locale)
    },
    [normalizeUser, persistLocaleHint]
  )

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clear local state even if server call fails
    }
    setUser(null)
    queryClient.clear()
  }, [])

  const updateLocale = useCallback(
    async (locale: AppLocale) => {
      const u = await apiRequest<{
        id: string
        email: string
        createdAt?: string
        locale?: string | null
      }>('/api/auth/me', {
        method: 'PATCH',
        body: { locale }
      })
      const next = normalizeUser(u)
      setUser(next)
      persistLocaleHint(next.locale)
    },
    [normalizeUser, persistLocaleHint]
  )

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateLocale
      }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
