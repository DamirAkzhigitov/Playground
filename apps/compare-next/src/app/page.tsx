import type { Metadata } from 'next'

import { CatalogueRoute } from '@/components/catalogue/CatalogueRoute'
import { catalogueMetadata } from '@/lib/catalogueMetadata'

export const metadata: Metadata = catalogueMetadata({
  sort: 'new',
  isHome: true
})

export default function Home() {
  return <CatalogueRoute sort="new" isHome />
}
