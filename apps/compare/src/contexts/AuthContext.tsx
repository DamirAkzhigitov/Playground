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
  signInWithSocial: (provider: 'google' | 'facebook') => Promise<void>
}

const { AuthProvider, useAuth } = createAuthProvider<
  AuthUser,
  CompareAuthExtra
>({
  onLogoutClear: () => queryClient.clear(),
  normalizeUser: (raw) => ({
    id: raw.id as string,
    email: raw.email as string,
    createdAt:
      typeof raw.createdAt === 'number'
        ? new Date(raw.createdAt).toISOString()
        : ((raw.createdAt as string) ??
          (raw.created_at as string) ??
          new Date().toISOString()),
    locale: isAppLocale(raw.locale as string | undefined)
      ? (raw.locale as AppLocale)
      : 'en'
  }),
  onUserChange: (user) => {
    if (user) persistLocaleHint(user.locale)
  },
  extend: ({ authClient }) => ({
    updateLocale: async (locale: AppLocale) => {
      await apiRequest('/api/profile/locale', {
        method: 'PATCH',
        body: { locale }
      })
      persistLocaleHint(locale)
      await authClient.getSession()
    },
    signInWithSocial: async (provider) => {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin
      })
    }
  })
})

export { AuthProvider, useAuth }
