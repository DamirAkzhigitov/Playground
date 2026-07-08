import Link from 'next/link'

import { HubPicker } from '@/components/comparison/HubPicker'
import { EN, translate } from '@/i18n/messages'
import { DEFAULT_LOCALE } from '@/i18n/locale'
import type { LoadedKindHub } from '@/data/comparisonPage'

type KindHubProps = {
  data: LoadedKindHub
}

export function KindHub({ data }: KindHubProps) {
  const { kind, items, popular } = data
  const t = (
    id: Parameters<typeof translate>[1],
    vars?: Record<string, string | number>
  ) => translate(DEFAULT_LOCALE, id, vars)

  return (
    <section className="hub">
      <nav className="hub__breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{EN['comparison.breadcrumbHome']}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{kind.namePlural}</span>
      </nav>

      <header className="hub__header">
        <span className="badge">{kind.name}</span>
        <h1 className="hub__title">
          {t('hub.title', { kind: kind.namePlural })}
        </h1>
        <p className="hub__subtitle">{kind.description}</p>
      </header>

      {popular.length > 0 ? (
        <div>
          <h2 className="hub__section-title">
            {t('hub.popularHeading', { kind: kind.namePlural })}
          </h2>
          <ul className="hub__popular">
            {popular.map((entry) => (
              <li key={entry.pairKey}>
                <Link href={entry.href} className="hub__popular-link">
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h2 className="hub__section-title">
          {t('hub.itemsHeading', { kind: kind.namePlural })}
        </h2>
        <HubPicker
          kindSlug={kind.slug}
          items={items.map((item) => ({
            slug: item.slug,
            name: item.name,
            brand: item.brand
          }))}
        />
      </div>
    </section>
  )
}
