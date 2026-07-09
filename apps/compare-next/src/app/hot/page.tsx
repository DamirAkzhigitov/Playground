import type { Metadata } from 'next'

import { CatalogueRoute } from '@/components/catalogue/CatalogueRoute'
import { catalogueMetadata } from '@/lib/catalogueMetadata'

export const metadata: Metadata = catalogueMetadata({ sort: 'hot' })

export default function HotCataloguePage() {
  return <CatalogueRoute sort="hot" />
}
