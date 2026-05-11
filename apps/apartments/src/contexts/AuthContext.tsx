import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import type { ReactNode } from 'react'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'
import { apiRequest } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiRequest<AuthUser>('/api/auth/me')
      .then((u) => {
        if (!cancelled) setUser(u)
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
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const u = await apiRequest<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: input
    })
    setUser(u)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const u = await apiRequest<AuthUser>('/api/auth/register', {
      method: 'POST',
      body: input
    })
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clear local state even if server call fails
    }
    setUser(null)
    queryClient.clear()
  }, [])

  return (
    <AuthContext value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
