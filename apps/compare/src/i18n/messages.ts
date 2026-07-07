import type { AppLocale } from './locale'

const EN = {
  'catalogue.title': 'Compare catalogue',
  'catalogue.subtitle':
    'Browse public comparisons shared by the community. Pick one to explore or search by topic.',
  'catalogue.searchPlaceholder': 'Search comparisons…',
  'catalogue.searchLabel': 'Search comparisons',
  'catalogue.searchAria':
    'Search comparisons by title, description, or category',
  'catalogue.itemCount': '{count} comparisons',
  'catalogue.empty': 'No comparisons match “{query}”.'
} as const

export type MessageId = keyof typeof EN

const BY_LOCALE: Record<AppLocale, Record<MessageId, string>> = {
  en: EN
}

export function translate(
  locale: AppLocale,
  id: MessageId,
  vars?: Record<string, string | number>
): string {
  let text = BY_LOCALE[locale][id] ?? EN[id] ?? id

  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${key}}`, String(value))
    }
  }

  return text
}

export { EN }
