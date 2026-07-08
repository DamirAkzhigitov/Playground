import Link from 'next/link'

import { ItemSpecTable } from '@/components/comparison/ItemSpecTable'
import { RelatedComparisons } from '@/components/comparison/RelatedComparisons'
import { EN } from '@/i18n/messages'
import { comparisonPath, kindHubPath } from '@/lib/comparison'
import type { LoadedItem } from '@/data/comparisonPage'

type ItemViewProps = {
  data: LoadedItem
}

export function ItemView({ data }: ItemViewProps) {
  const { kind, item, specs, allItems, related } = data
  const compareLinks = allItems
    .filter((other) => other.slug !== item.slug)
    .slice(0, 6)

  return (
    <section className="item-page">
      <nav className="item-page__breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{EN['comparison.breadcrumbHome']}</Link>
        <span aria-hidden="true">/</span>
        <Link href={kindHubPath(kind.slug)}>{kind.namePlural}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{item.name}</span>
      </nav>

      <header className="item-page__header">
        {item.imageUrl ? (
          <img
            className="item-page__image"
            src={item.imageUrl}
            alt={item.name}
          />
        ) : null}
        <div>
          <span className="badge">{kind.name}</span>
          <h1 className="item-page__title">{item.name}</h1>
          {item.brand ? <p className="item-page__brand">{item.brand}</p> : null}
        </div>
      </header>

      <div>
        <h2 className="item-page__section-title">{EN['item.specsHeading']}</h2>
        <ItemSpecTable item={item} specs={specs} />
      </div>

      {compareLinks.length > 0 ? (
        <div>
          <h2 className="item-page__section-title">
            {EN['item.compareWithHeading']}
          </h2>
          <ul className="item-page__compare-list">
            {compareLinks.map((other) => (
              <li key={other.slug}>
                <Link
                  href={comparisonPath(kind.slug, [item.slug, other.slug])}
                  className="item-page__compare-link"
                >
                  {item.name} vs {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <RelatedComparisons
        heading={EN['comparison.peopleAlsoCompare']}
        comparisons={related}
      />
    </section>
  )
}
