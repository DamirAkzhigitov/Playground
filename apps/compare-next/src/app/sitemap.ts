import type { MetadataRoute } from 'next'

import {
  getItemsByKind,
  getSpecDefinitions,
  listComparisonStats,
  listKinds
} from '@/data/comparisons'
import { CATALOGUE_SORT_PATHS } from '@/lib/catalogueRoutes'
import {
  canonicalComparisonPath,
  itemPath,
  kindHubPath
} from '@/lib/comparison'
import { shouldIndexComparison } from '@/lib/comparisonIndexing'
import { getSiteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const MAX_SITEMAP_PAIRS = 100

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = [
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

  const kinds = await listKinds()

  for (const kind of kinds) {
    entries.push({
      url: `${siteUrl}${kindHubPath(kind.slug)}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85
    })

    const [items, specs] = await Promise.all([
      getItemsByKind(kind.slug),
      getSpecDefinitions(kind.slug)
    ])

    for (const item of items) {
      entries.push({
        url: `${siteUrl}${itemPath(kind.slug, item.slug)}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8
      })
    }

    const stats = await listComparisonStats({ kindSlug: kind.slug, limit: 200 })
    const itemBySlug = new Map(items.map((item) => [item.slug, item]))

    let pairCount = 0
    for (const stat of stats) {
      if (pairCount >= MAX_SITEMAP_PAIRS) break

      const resolvedItems = stat.itemSlugs
        .map((slug) => itemBySlug.get(slug))
        .filter((item): item is NonNullable<typeof item> => item !== undefined)

      if (resolvedItems.length !== 2) continue

      const slugs = resolvedItems.map((item) => item.slug)
      if (
        !shouldIndexComparison({
          slugs,
          items: resolvedItems,
          specs,
          viewCount: stat.viewCount,
          isFeatured: stat.isFeatured
        })
      ) {
        continue
      }

      entries.push({
        url: `${siteUrl}${canonicalComparisonPath(kind.slug, slugs)}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: stat.isFeatured ? 0.75 : 0.7
      })
      pairCount += 1
    }
  }

  return entries
}
