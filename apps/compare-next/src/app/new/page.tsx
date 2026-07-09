import type { Metadata } from 'next'

import { CatalogueRoute } from '@/components/catalogue/CatalogueRoute'
import { catalogueMetadata } from '@/lib/catalogueMetadata'

export const metadata: Metadata = catalogueMetadata({ sort: 'new' })

export default function NewCataloguePage() {
  return <CatalogueRoute sort="new" />
}
