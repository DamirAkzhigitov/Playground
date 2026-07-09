import Link from 'next/link'

import { HubPicker } from '@/components/comparison/HubPicker'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
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
            <BreadcrumbPage>{kind.namePlural}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="self-start">
          {kind.name}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('hub.title', { kind: kind.namePlural })}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {kind.description}
        </p>
      </header>

      {popular.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {t('hub.popularHeading', { kind: kind.namePlural })}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
            {popular.map((entry) => (
              <li key={entry.pairKey}>
                <Link
                  href={entry.href}
                  className="block rounded-md border border-border bg-background p-4 font-semibold text-foreground transition-colors hover:border-primary/35 hover:shadow-sm"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold">
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
