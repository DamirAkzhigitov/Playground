import Link from 'next/link'

import { ComparisonPicker } from '@/components/comparison/ComparisonPicker'
import { ComparisonTable } from '@/components/comparison/ComparisonTable'
import { ComparisonVerdictBlock } from '@/components/comparison/ComparisonVerdict'
import { RelatedComparisons } from '@/components/comparison/RelatedComparisons'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { EN } from '@/i18n/messages'
import {
  comparisonBreadcrumbLabel,
  comparisonPageHeading,
  comparisonTitleFromNames,
  FULL_HEADING_MAX_ITEMS,
  kindHubPath
} from '@/lib/comparison'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import type { LoadedComparison, RelatedComparison } from '@/data/comparisonPage'

type ComparisonViewProps = {
  data: LoadedComparison
  related: RelatedComparison[]
}

export function ComparisonView({ data, related }: ComparisonViewProps) {
  const { kind, items, specs, slugs } = data
  const names = items.map((item) => item.name)
  const fullTitle = comparisonTitleFromNames(names)
  const heading = comparisonPageHeading(names)
  const breadcrumbLabel = comparisonBreadcrumbLabel(names)
  const showFullTitleDetails = names.length > FULL_HEADING_MAX_ITEMS
  const verdict = buildComparisonVerdict(items, specs)

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              {EN['comparison.breadcrumbHome']}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={kindHubPath(kind.slug)} />}>
              {kind.namePlural}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="self-start">
          {kind.name}
        </Badge>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          title={showFullTitleDetails ? fullTitle : undefined}
        >
          {heading}
        </h1>
        {showFullTitleDetails ? (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              {EN['comparison.allItemsHeading']}
            </summary>
            <p className="mt-2 leading-relaxed">{fullTitle}</p>
          </details>
        ) : null}
      </header>

      <ComparisonPicker
        kindSlug={kind.slug}
        currentSlugs={slugs}
        allItems={data.allItems.map((item) => ({
          slug: item.slug,
          name: item.name
        }))}
      />

      <ComparisonTable items={items} specs={specs} kindSlug={kind.slug} />

      {verdict ? <ComparisonVerdictBlock verdict={verdict} /> : null}

      {slugs.length > 2 ? (
        <p className="text-sm text-muted-foreground">
          {EN['comparison.customNote']}
        </p>
      ) : null}

      <RelatedComparisons
        heading={EN['comparison.peopleAlsoCompare']}
        comparisons={related}
      />
    </section>
  )
}
