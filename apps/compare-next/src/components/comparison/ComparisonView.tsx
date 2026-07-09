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
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="self-start">
          {kind.name}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
      </header>

      <ComparisonTable items={items} specs={specs} kindSlug={kind.slug} />

      {verdict ? <ComparisonVerdictBlock verdict={verdict} /> : null}

      <ComparisonPicker
        kindSlug={kind.slug}
        currentSlugs={slugs}
        allItems={data.allItems.map((item) => ({
          slug: item.slug,
          name: item.name
        }))}
      />

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
