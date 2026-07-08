import type { CatalogueSort } from '@/types/catalogue'

export const CATALOGUE_SORT_PATHS: Record<CatalogueSort, `/${string}`> = {
  new: '/new',
  hot: '/hot',
  popular: '/popular'
}

export const CATALOGUE_SORTS = Object.keys(
  CATALOGUE_SORT_PATHS
) as CatalogueSort[]

export function catalogueSortPath(sort: CatalogueSort): string {
  return CATALOGUE_SORT_PATHS[sort]
}
