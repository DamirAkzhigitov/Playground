'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CatalogueCard } from '@/components/catalogue/CatalogueCard'
import { CatalogueSearch } from '@/components/catalogue/CatalogueSearch'
import { useI18n } from '@/contexts/I18nContext'
import {
  fetchCataloguePage,
  type CataloguePageResult
} from '@/data/fetchCatalogue'
import { catalogueSlotClass } from '@/lib/catalogueSlot'

type CataloguePageProps = {
  initialPage: CataloguePageResult
}

export function CataloguePage({ initialPage }: CataloguePageProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ['catalogue', query],
      queryFn: ({ pageParam }) => fetchCataloguePage(pageParam, query),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialData:
        query === ''
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
    <section className="catalogue">
      <header className="catalogue__header">
        <h1 className="catalogue__title">{t('catalogue.title')}</h1>
        <p className="catalogue__subtitle">{t('catalogue.subtitle')}</p>
      </header>

      <CatalogueSearch
        value={query}
        onChange={setQuery}
        placeholder={t('catalogue.searchPlaceholder')}
        ariaLabel={t('catalogue.searchAria')}
        label={t('catalogue.searchLabel')}
      />

      <p className="catalogue__meta" aria-live="polite">
        {isLoading ? t('catalogue.loading') : metaText}
      </p>

      {isLoading ? (
        <div className="catalogue__loading" role="status">
          <span className="catalogue__spinner" aria-hidden="true" />
          <span>{t('catalogue.loading')}</span>
        </div>
      ) : entries.length === 0 ? (
        <p className="catalogue__empty">
          {t('catalogue.empty', { query: query.trim() })}
        </p>
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
              className="catalogue__loading catalogue__loading--more"
              role="status"
            >
              <span className="catalogue__spinner" aria-hidden="true" />
              <span>{t('catalogue.loadingMore')}</span>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
