import Link from 'next/link'

import { ItemSpecTable } from '@/components/comparison/ItemSpecTable'
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
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex items-start gap-6">
        {item.imageUrl ? (
          <img
            className="h-36 w-48 rounded-md border border-border object-cover"
            src={item.imageUrl}
            alt={item.name}
          />
        ) : null}
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="self-start">
            {kind.name}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {item.name}
          </h1>
          {item.brand ? (
            <p className="text-sm text-muted-foreground">{item.brand}</p>
          ) : null}
        </div>
      </header>

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {EN['item.specsHeading']}
        </h2>
        <ItemSpecTable item={item} specs={specs} />
      </div>

      {compareLinks.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {EN['item.compareWithHeading']}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
            {compareLinks.map((other) => (
              <li key={other.slug}>
                <Link
                  href={comparisonPath(kind.slug, [item.slug, other.slug])}
                  className="block rounded-md border border-border bg-background p-3 font-semibold text-foreground transition-colors hover:border-primary/35"
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
