import { createAuthProvider } from '@playground/auth-react'

type AuthUser = {
  id: string
  email: string
}

const { AuthProvider, useAuth } = createAuthProvider<AuthUser>({
  /** Same-origin: Vite proxies /api to the auth Worker. */
  baseURL: '',
  normalizeUser: (raw) => ({
    id: raw.id as string,
    email: raw.email as string
  })
})

export { AuthProvider, useAuth }
