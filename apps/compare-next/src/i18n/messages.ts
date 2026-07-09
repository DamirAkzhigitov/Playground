import type { AppLocale } from './locale'

const EN = {
  'catalogue.title': 'Compare catalogue',
  'catalogue.titleNew': 'New comparisons',
  'catalogue.titleHot': 'Hot comparisons',
  'catalogue.titlePopular': 'Most popular comparisons',
  'catalogue.subtitle':
    'Browse public comparisons shared by the community. Pick one to explore or search by topic.',
  'catalogue.subtitleNew':
    'Recently published comparisons from the community, sorted by publish date.',
  'catalogue.subtitleHot':
    'Trending comparisons getting the most attention right now.',
  'catalogue.subtitlePopular': 'Community favourites ranked by total views.',
  'catalogue.searchPlaceholder': 'Search comparisons…',
  'catalogue.searchLabel': 'Search comparisons',
  'catalogue.searchAria':
    'Search comparisons by title, description, or category',
  'catalogue.filtersAria': 'Filter comparisons',
  'catalogue.filterNew': 'New',
  'catalogue.filterHot': 'Hot',
  'catalogue.filterPopular': 'Most Popular',
  'catalogue.itemCount': '{count} comparisons',
  'catalogue.itemCountPartial': '{shown} of {total} comparisons',
  'catalogue.loading': 'Loading comparisons…',
  'catalogue.loadingMore': 'Loading more…',
  'catalogue.empty': 'No comparisons match “{query}”.',
  'comparison.breadcrumbHome': 'Home',
  'comparison.pickerTitle': 'Items in this comparison',
  'comparison.pickerHint': 'Add or remove items to build your own comparison.',
  'comparison.addItem': 'Add item',
  'comparison.remove': 'Remove {name}',
  'comparison.viewCount': '{count} views',
  'comparison.specColumn': 'Spec',
  'comparison.winner': 'Winner',
  'comparison.runnerUp': 'Runner-up',
  'comparison.peopleAlsoCompare': 'People also compare',
  'comparison.customNote':
    'Showing a custom multi-item comparison. Only canonical two-way pages are indexed.',
  'comparison.allItemsHeading': 'All items in this comparison',
  'comparison.scrollHint': 'Scroll horizontally to see all items',
  'hub.manyItemsHint':
    'Comparing many items works best on a wide screen. You can still add more.',
  'item.specsHeading': 'Specifications',
  'item.compareWithHeading': 'Compare with',
  'hub.title': 'Compare {kind}',
  'hub.itemsHeading': 'All {kind}',
  'hub.popularHeading': 'Popular {kind} comparisons',
  'hub.pickHint': 'Select two or more to compare.',
  'hub.compareSelected': 'Compare selected ({count})',
  'hub.selectAtLeastTwo': 'Select at least two items to compare.'
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
