import { CataloguePage } from '@/components/catalogue/CataloguePage'
import { AppLayout } from '@/components/layout/AppLayout'
import { getCataloguePage } from '@/data/fetchCatalogue'
import { catalogueJsonLd } from '@/lib/catalogueJsonLd'

export default function Home() {
  const initialPage = getCataloguePage(0, '')

  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(catalogueJsonLd(initialPage))
        }}
      />
      <CataloguePage initialPage={initialPage} />
    </AppLayout>
  )
}
