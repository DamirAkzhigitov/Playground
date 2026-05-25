import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { ActionCatalogToolbar } from '@/components/ActionCatalogToolbar'
import { ActionSearchResults } from '@/components/ActionSearchResults'
import { Pagination } from '@/components/Pagination'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/ErrorState'
import type { CatalogSort } from '@/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { queryKeys } from '@/lib/queryKeys'
import { PAGE_SIZE, listActions } from '@/lib/stepsApi'

const SORT_VALUES: CatalogSort[] = ['popular', 'newest', 'title']

function parseSort(value: string | null): CatalogSort {
  if (value && SORT_VALUES.includes(value as CatalogSort)) {
    return value as CatalogSort
  }
  return 'popular'
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const sort = parseSort(searchParams.get('sort'))
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const debouncedQ = useDebouncedValue(q, 300)

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') next.delete(key)
            else next.set(key, value)
          }
          if (resetPage) next.delete('page')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const listParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      tag: tag || undefined,
      sort,
      page
    }),
    [debouncedQ, tag, sort, page]
  )

  const catalogQuery = useQuery({
    queryKey: queryKeys.actions.list(listParams),
    queryFn: () => listActions(listParams)
  })

  const totalPages = catalogQuery.data
    ? Math.max(1, Math.ceil(catalogQuery.data.total / PAGE_SIZE))
    : 1

  const hasFilters = Boolean(q || tag || sort !== 'popular')

  const resultLabel =
    catalogQuery.data && (debouncedQ || tag)
      ? `${catalogQuery.data.total} result${catalogQuery.data.total === 1 ? '' : 's'}`
      : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="All actions"
        description={
          resultLabel ?? 'Search and browse published step-by-step guides.'
        }
      />

      <ActionCatalogToolbar
        query={q}
        tag={tag}
        sort={sort}
        hasFilters={hasFilters}
        onQueryChange={(value) => updateParams({ q: value || null }, true)}
        onTagChange={(value) => updateParams({ tag: value || null }, true)}
        onSortChange={(value) => updateParams({ sort: value }, true)}
        onClear={() => setSearchParams({}, { replace: true })}
      />

      {catalogQuery.isError ? (
        <ErrorState
          message="Could not load the catalog."
          onRetry={() => catalogQuery.refetch()}
        />
      ) : (
        <>
          <ActionSearchResults
            items={catalogQuery.data?.items ?? []}
            isLoading={catalogQuery.isLoading}
          />
          {catalogQuery.data ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={catalogQuery.data.total}
              onPageChange={(p) => updateParams({ page: String(p) }, false)}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
