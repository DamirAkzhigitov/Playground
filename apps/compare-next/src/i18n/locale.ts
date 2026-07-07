export const APP_LOCALES = ['en']

export type AppLocale = (typeof APP_LOCALES)[number]

export const LOCALE_LABELS = {
  en: 'English'
}

export function isAppLocale(
  value: string | undefined | null
): value is AppLocale {
  return value === 'en'
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
