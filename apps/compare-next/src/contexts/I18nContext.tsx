'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from 'react'
import { type MessageId, translate } from '@/i18n/messages'
import { type AppLocale } from '@/i18n/locale'

type I18nContextValue = {
  locale: AppLocale
  t: (id: MessageId, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = 'en' // TODO: read locale from user/stored value

  const t = useCallback(
    (id: MessageId, vars?: Record<string, string | number>) =>
      translate(locale, id, vars),
    [locale]
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, t }), [locale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n')
  return ctx
}
