import type { CataloguePageResult } from '@/data/catalogueQuery'
import type { CatalogueSort } from '@/types/catalogue'

export type { CataloguePageResult }

/** Client-side fetch used by React Query for infinite scroll. */
export async function fetchCataloguePage(
  page: number,
  query: string,
  sort: CatalogueSort = 'new'
): Promise<CataloguePageResult> {
  const params = new URLSearchParams({
    page: String(page),
    q: query,
    sort
  })
  const response = await fetch(`/api/catalogue?${params}`)

  if (!response.ok) {
    throw new Error(`Catalogue API error: ${response.status}`)
  }

  return response.json() as Promise<CataloguePageResult>
}
