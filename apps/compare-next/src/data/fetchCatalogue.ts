import { MOCK_CATALOGUE } from '@/data/mockCatalogue'
import type { CatalogueEntry } from '@/types/catalogue'

const PAGE_SIZE = 8

export type CataloguePageResult = {
  items: CatalogueEntry[]
  nextPage: number | null
  total: number
}

function matchesQuery(
  query: string,
  title: string,
  description: string,
  badge: string
): boolean {
  const haystack = `${title} ${description} ${badge}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function filterCatalogue(query: string): CatalogueEntry[] {
  const trimmed = query.trim()
  if (!trimmed) return MOCK_CATALOGUE
  return MOCK_CATALOGUE.filter((entry) =>
    matchesQuery(trimmed, entry.title, entry.description, entry.badge)
  )
}

export function getCataloguePage(
  page: number,
  query: string
): CataloguePageResult {
  const source = filterCatalogue(query)
  const start = page * PAGE_SIZE
  const items = source.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE

  return {
    items,
    nextPage: nextStart < source.length ? page + 1 : null,
    total: source.length
  }
}

export async function fetchCataloguePage(
  page: number,
  query: string
): Promise<CataloguePageResult> {
  return getCataloguePage(page, query)
}
