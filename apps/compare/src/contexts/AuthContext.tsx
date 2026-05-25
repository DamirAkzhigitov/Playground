import { createAuthProvider } from '@playground/auth-react'
import type { AuthUser } from '@/types'
import type { AppLocale } from '@/i18n/locale'
import { apiRequest } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { isAppLocale, LOCALE_STORAGE_KEY } from '@/i18n/locale'

function persistLocaleHint(locale: AppLocale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}

type CompareAuthExtra = {
  updateLocale: (locale: AppLocale) => Promise<void>
}

const { AuthProvider, useAuth } = createAuthProvider<
  AuthUser,
  CompareAuthExtra
>({
  apiRequest,
  onLogoutClear: () => queryClient.clear(),
  normalizeUser: (raw) => ({
    id: raw.id as string,
    email: raw.email as string,
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    locale: isAppLocale(raw.locale as string | undefined)
      ? (raw.locale as AppLocale)
      : 'en'
  }),
  onUserChange: (user) => {
    if (user) persistLocaleHint(user.locale)
  },
  extend: ({ setUser, apiRequest }) => ({
    updateLocale: async (locale: AppLocale) => {
      const u = await apiRequest<Record<string, unknown>>('/api/auth/me', {
        method: 'PATCH',
        body: { locale }
      })
      const next: AuthUser = {
        id: u.id as string,
        email: u.email as string,
        createdAt: (u.createdAt as string) ?? new Date().toISOString(),
        locale: isAppLocale(u.locale as string | undefined)
          ? (u.locale as AppLocale)
          : 'en'
      }
      setUser(next)
      persistLocaleHint(next.locale)
    }
  })
})

export { AuthProvider, useAuth }
