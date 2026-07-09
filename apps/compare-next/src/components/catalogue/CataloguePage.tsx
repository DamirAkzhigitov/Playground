'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CatalogueCard } from '@/components/catalogue/CatalogueCard'
import { CatalogueFilters } from '@/components/catalogue/CatalogueFilters'
import { CatalogueSearch } from '@/components/catalogue/CatalogueSearch'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/contexts/I18nContext'
import {
  fetchCataloguePage,
  type CataloguePageResult
} from '@/data/fetchCatalogue'
import {
  catalogueCopyKey,
  CATALOGUE_SUBTITLE_ID,
  CATALOGUE_TITLE_ID
} from '@/lib/catalogueCopy'
import { catalogueSlotClass } from '@/lib/catalogueSlot'
import type { CatalogueSort } from '@/types/catalogue'

const SEARCH_DEBOUNCE_MS = 350
const SKELETON_CARD_COUNT = 6

type CataloguePageProps = {
  initialPage: CataloguePageResult
  sort: CatalogueSort
  isHome?: boolean
}

function CatalogueGridSkeleton({ label }: { label: string }) {
  return (
    <div
      className="catalogue__grid"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <div key={index} className="catalogue__slot">
          <Skeleton className="h-full min-h-72 w-full" aria-hidden />
        </div>
      ))}
    </div>
  )
}

export function CataloguePage({
  initialPage,
  sort,
  isHome = false
}: CataloguePageProps) {
  const { t } = useI18n()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(searchInput),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(timer)
  }, [searchInput])

  const copyKey = catalogueCopyKey(sort, isHome)
  const heading = t(CATALOGUE_TITLE_ID[copyKey])
  const subtitle = t(CATALOGUE_SUBTITLE_ID[copyKey])

  const filterOptions = useMemo(
    () => [
      { value: 'new' as const, label: t('catalogue.filterNew') },
      { value: 'hot' as const, label: t('catalogue.filterHot') },
      { value: 'popular' as const, label: t('catalogue.filterPopular') }
    ],
    [t]
  )

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ['catalogue', debouncedQuery, sort],
      queryFn: ({ pageParam }) =>
        fetchCataloguePage(pageParam, debouncedQuery, sort),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialData:
        debouncedQuery === ''
          ? {
              pages: [initialPage],
              pageParams: [0]
            }
          : undefined
    })

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  )

  const total = data?.pages[0]?.total ?? 0

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { rootMargin: '240px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, entries.length])

  const metaText =
    total === 0
      ? t('catalogue.itemCount', { count: 0 })
      : entries.length < total
        ? t('catalogue.itemCountPartial', {
            shown: entries.length,
            total
          })
        : t('catalogue.itemCount', { count: total })

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {heading}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <div className="flex flex-col gap-4">
        <CatalogueSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t('catalogue.searchPlaceholder')}
          label={t('catalogue.searchLabel')}
        />

        <CatalogueFilters
          activeSort={sort}
          options={filterOptions}
          ariaLabel={t('catalogue.filtersAria')}
        />
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isLoading ? t('catalogue.loading') : metaText}
      </p>

      {isLoading ? (
        <CatalogueGridSkeleton label={t('catalogue.loading')} />
      ) : entries.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyDescription>
              {t('catalogue.empty', { query: debouncedQuery.trim() })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="catalogue__grid">
            {entries.map((entry) => (
              <div key={entry.id} className={catalogueSlotClass(entry.size)}>
                <CatalogueCard entry={entry} />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="catalogue__sentinel" aria-hidden />

          {isFetchingNextPage ? (
            <div
              className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
              role="status"
            >
              <Spinner />
              <span>{t('catalogue.loadingMore')}</span>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
