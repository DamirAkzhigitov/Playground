import { useMemo, useState } from 'react'

import { CatalogueCard } from '@/components/catalogue/CatalogueCard'
import { CatalogueSearch } from '@/components/catalogue/CatalogueSearch'
import { useI18n } from '@/contexts/I18nContext'
import { MOCK_CATALOGUE } from '@/data/mockCatalogue'

function matchesQuery(
  query: string,
  title: string,
  description: string,
  badge: string
): boolean {
  const haystack = `${title} ${description} ${badge}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function CataloguePage() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return MOCK_CATALOGUE
    return MOCK_CATALOGUE.filter((entry) =>
      matchesQuery(trimmed, entry.title, entry.description, entry.badge)
    )
  }, [query])

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

      <p className="catalogue__meta">
        {t('catalogue.itemCount', { count: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="catalogue__empty">
          {t('catalogue.empty', { query: query.trim() })}
        </p>
      ) : (
        <div className="catalogue__grid">
          {filtered.map((entry) => (
            <CatalogueCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  )
}
