import Link from 'next/link'

import { ComparisonPicker } from '@/components/comparison/ComparisonPicker'
import { ComparisonTable } from '@/components/comparison/ComparisonTable'
import { ComparisonVerdictBlock } from '@/components/comparison/ComparisonVerdict'
import { RelatedComparisons } from '@/components/comparison/RelatedComparisons'
import { EN } from '@/i18n/messages'
import { comparisonTitleFromNames, kindHubPath } from '@/lib/comparison'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import type { LoadedComparison, RelatedComparison } from '@/data/comparisonPage'

type ComparisonViewProps = {
  data: LoadedComparison
  related: RelatedComparison[]
}

export function ComparisonView({ data, related }: ComparisonViewProps) {
  const { kind, items, specs, slugs } = data
  const title = comparisonTitleFromNames(items.map((item) => item.name))
  const verdict = buildComparisonVerdict(items, specs)

  return (
    <section className="cmp">
      <nav className="cmp__breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{EN['comparison.breadcrumbHome']}</Link>
        <span aria-hidden="true">/</span>
        <Link href={kindHubPath(kind.slug)}>{kind.namePlural}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <header className="cmp__header">
        <span className="badge">{kind.name}</span>
        <h1 className="cmp__title">{title}</h1>
      </header>

      {verdict ? <ComparisonVerdictBlock verdict={verdict} /> : null}

      <ComparisonPicker
        kindSlug={kind.slug}
        currentSlugs={slugs}
        allItems={data.allItems.map((item) => ({
          slug: item.slug,
          name: item.name
        }))}
      />

      <ComparisonTable items={items} specs={specs} kindSlug={kind.slug} />

      {slugs.length > 2 ? (
        <p className="cmp__note">{EN['comparison.customNote']}</p>
      ) : null}

      <RelatedComparisons
        heading={EN['comparison.peopleAlsoCompare']}
        comparisons={related}
      />
    </section>
  )
}
