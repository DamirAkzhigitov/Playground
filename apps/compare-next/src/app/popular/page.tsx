import type { Metadata } from 'next'

import { CatalogueRoute } from '@/components/catalogue/CatalogueRoute'
import { catalogueMetadata } from '@/lib/catalogueMetadata'

export const metadata: Metadata = catalogueMetadata({ sort: 'popular' })

export default function PopularCataloguePage() {
  return <CatalogueRoute sort="popular" />
}
