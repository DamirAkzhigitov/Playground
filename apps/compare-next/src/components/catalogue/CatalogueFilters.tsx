'use client'

import Link from 'next/link'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
    <nav aria-label={ariaLabel}>
      <ToggleGroup
        value={[activeSort]}
        variant="outline"
        spacing={2}
        className="flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            nativeButton={false}
            render={<Link href={catalogueSortPath(option.value)} />}
            aria-current={option.value === activeSort ? 'page' : undefined}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </nav>
  )
}
