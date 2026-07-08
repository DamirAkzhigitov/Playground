import type { MetadataRoute } from 'next'
import { CATALOGUE_SORT_PATHS } from '@/lib/catalogueRoutes'
import { getSiteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1
    },
    ...Object.values(CATALOGUE_SORT_PATHS).map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.9
    }))
  ]
}
