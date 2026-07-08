import Link from 'next/link'

import { catalogueSortPath } from '@/lib/catalogueRoutes'
import type { CatalogueSort } from '@/types/catalogue'

type CatalogueFilterOption = {
  value: CatalogueSort
  label: string
}

type CatalogueFiltersProps = {
  activeSort: CatalogueSort
  options: CatalogueFilterOption[]
  ariaLabel: string
}

export function CatalogueFilters({
  activeSort,
  options,
  ariaLabel
}: CatalogueFiltersProps) {
  return (
    <nav className="catalogue__filters" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === activeSort

        return (
          <Link
            key={option.value}
            href={catalogueSortPath(option.value)}
            className={`catalogue__filter${isActive ? ' catalogue__filter--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
