import { getCataloguePage } from '@/data/fetchCatalogue'
import type { CatalogueSort } from '@/types/catalogue'

const VALID_SORTS = new Set<CatalogueSort>(['new', 'hot', 'popular'])

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '0', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function parseSort(value: string | null): CatalogueSort {
  return value && VALID_SORTS.has(value as CatalogueSort)
    ? (value as CatalogueSort)
    : 'new'
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parsePage(searchParams.get('page'))
  const query = searchParams.get('q') ?? searchParams.get('query') ?? ''
  const sort = parseSort(searchParams.get('sort'))

  return Response.json(getCataloguePage(page, query, sort))
}
