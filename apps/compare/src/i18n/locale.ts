export const APP_LOCALES = ['en', 'ru', 'el'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  ru: 'Русский',
  el: 'Ελληνικά'
}

export function isAppLocale(
  value: string | undefined | null
): value is AppLocale {
  return value === 'en' || value === 'ru' || value === 'el'
}

export const LOCALE_STORAGE_KEY = 'compare-app-locale'

export function readStoredLocale(): AppLocale | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isAppLocale(raw) ? raw : null
  } catch {
    return null
  }
}
