import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode
} from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { isAppLocale, readStoredLocale, type AppLocale } from '@/i18n/locale'
import { translate, type MessageId } from '@/i18n/messages'

type I18nContextValue = {
  locale: AppLocale
  t: (id: MessageId, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const locale: AppLocale = useMemo(() => {
    if (user && isAppLocale(user.locale)) {
      return user.locale
    }
    return readStoredLocale() ?? 'en'
  }, [user])

  const t = useCallback(
    (id: MessageId, vars?: Record<string, string | number>) =>
      translate(locale, id, vars),
    [locale]
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const el = document.querySelector('playground-global-header')
    if (el) {
      el.setAttribute('home-label', translate(locale, 'nav.dashboard'))
    }
  }, [locale])

  const value = useMemo(() => ({ locale, t }), [locale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
