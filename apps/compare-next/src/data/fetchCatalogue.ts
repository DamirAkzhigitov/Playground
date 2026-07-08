// TODO: Remove mock import when catalogue API is wired up.
import { MOCK_CATALOGUE } from '@/data/mockCatalogue'
import type { CatalogueEntry, CatalogueSort } from '@/types/catalogue'

const PAGE_SIZE = 8

export type CataloguePageResult = {
  items: CatalogueEntry[]
  nextPage: number | null
  total: number
}

// TODO: Remove — client-side search over mock data; API should accept a query param.
function matchesQuery(
  query: string,
  title: string,
  description: string,
  badge: string
): boolean {
  const haystack = `${title} ${description} ${badge}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

// TODO: Remove — hot ranking over mock data; API should sort by hot server-side.
function hotScore(entry: CatalogueEntry): number {
  const ageDays = Math.max(
    1,
    (Date.now() - new Date(entry.publishedAt).getTime()) / 86_400_000
  )
  return entry.viewCount / ageDays
}

// TODO: Remove — client-side sort over mock data; API should accept a sort param.
function sortCatalogue(
  entries: CatalogueEntry[],
  sort: CatalogueSort
): CatalogueEntry[] {
  const sorted = [...entries]

  switch (sort) {
    case 'new':
      sorted.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      break
    case 'popular':
      sorted.sort((a, b) => b.viewCount - a.viewCount)
      break
    case 'hot':
      sorted.sort((a, b) => hotScore(b) - hotScore(a))
      break
  }

  return sorted
}

// TODO: Remove — in-memory filter/sort over MOCK_CATALOGUE; replace with API call.
function filterCatalogue(query: string, sort: CatalogueSort): CatalogueEntry[] {
  const trimmed = query.trim()
  const source = trimmed
    ? MOCK_CATALOGUE.filter((entry) =>
        matchesQuery(trimmed, entry.title, entry.description, entry.badge)
      )
    : MOCK_CATALOGUE

  return sortCatalogue(source, sort)
}

// TODO: Replace implementation with API fetch (keep for SSR); remove in-memory slice/pagination.
export function getCataloguePage(
  page: number,
  query: string,
  sort: CatalogueSort = 'new'
): CataloguePageResult {
  const source = filterCatalogue(query, sort)
  const start = page * PAGE_SIZE
  const items = source.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE

  return {
    items,
    nextPage: nextStart < source.length ? page + 1 : null,
    total: source.length
  }
}

// TODO: Replace with fetch to catalogue API (e.g. GET /api/catalogue?page=&q=&sort=).
export async function fetchCataloguePage(
  page: number,
  query: string,
  sort: CatalogueSort = 'new'
): Promise<CataloguePageResult> {
  return getCataloguePage(page, query, sort)
}
