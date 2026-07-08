export type CatalogueCardSize = 'default' | 'wide' | 'tall' | 'featured'

export type CatalogueSort = 'new' | 'hot' | 'popular'

export type CatalogueEntry = {
  id: string
  title: string
  description: string
  badge: string
  imageUrl: string
  size: CatalogueCardSize
  publishedAt: string
  viewCount: number
}
