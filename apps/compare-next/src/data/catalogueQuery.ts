import type { CatalogueEntry, CatalogueSort } from '@/types/catalogue'

export const PAGE_SIZE = 8

export type CataloguePageResult = {
  items: CatalogueEntry[]
  nextPage: number | null
  total: number
}

function matchesQuery(query: string, entry: CatalogueEntry): boolean {
  const haystack =
    `${entry.title} ${entry.description} ${entry.badge}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function hotScore(entry: CatalogueEntry): number {
  const ageDays = Math.max(
    1,
    (Date.now() - new Date(entry.publishedAt).getTime()) / 86_400_000
  )
  return entry.viewCount / ageDays
}

export function filterEntries(
  entries: CatalogueEntry[],
  query: string
): CatalogueEntry[] {
  const trimmed = query.trim()
  if (!trimmed) return entries
  return entries.filter((entry) => matchesQuery(trimmed, entry))
}

export function sortEntries(
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

/** Pure filter + sort + paginate over an in-memory entry list. */
export function selectCataloguePage(
  entries: CatalogueEntry[],
  page: number,
  query: string,
  sort: CatalogueSort
): CataloguePageResult {
  const source = sortEntries(filterEntries(entries, query), sort)
  const start = page * PAGE_SIZE
  const items = source.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE

  return {
    items,
    nextPage: nextStart < source.length ? page + 1 : null,
    total: source.length
  }
}
