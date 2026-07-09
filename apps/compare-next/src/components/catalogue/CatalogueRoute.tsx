import { CataloguePage } from '@/components/catalogue/CataloguePage'
import { AppLayout } from '@/components/layout/AppLayout'
import { getCataloguePage } from '@/data/catalogue'
import { catalogueJsonLd } from '@/lib/catalogueJsonLd'
import type { CatalogueSort } from '@/types/catalogue'

type CatalogueRouteProps = {
  sort: CatalogueSort
  isHome?: boolean
}

export async function CatalogueRoute({
  sort,
  isHome = false
}: CatalogueRouteProps) {
  const initialPage = await getCataloguePage(0, '', sort)

  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(catalogueJsonLd(initialPage, sort, isHome))
        }}
      />
      <CataloguePage initialPage={initialPage} sort={sort} isHome={isHome} />
    </AppLayout>
  )
}
