import type { Metadata } from 'next'

import {
  canonicalComparisonPath,
  comparisonTitleFromNames,
  itemPath,
  kindHubPath
} from '@/lib/comparison'
import { shouldIndexComparison } from '@/lib/comparisonIndexing'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import type {
  ComparisonStat,
  Item,
  Kind,
  SpecDefinition
} from '@/types/catalogue'

type ComparisonMetadataOptions = {
  kind: Kind
  items: Item[]
  slugs: string[]
  specs: SpecDefinition[]
  stat?: ComparisonStat | null
}

function ogImagePath(kindSlug: string, pairSegment: string): string {
  return `/compare/${kindSlug}/${pairSegment}/opengraph-image`
}

/**
 * Metadata for a derived comparison page. Indexation follows tiered rules;
 * 3+ way comparisons are always noindex.
 */
export function comparisonMetadata({
  kind,
  items,
  slugs,
  specs,
  stat = null
}: ComparisonMetadataOptions): Metadata {
  const names = items.map((item) => item.name)
  const shortTitle = comparisonTitleFromNames(names)
  const verdict = buildComparisonVerdict(items, specs)
  const description =
    verdict?.summary ??
    `Compare ${shortTitle}: ${kind.name.toLowerCase()} specs, features, and price side by side to decide which is right for you.`
  const canonicalPath = canonicalComparisonPath(kind.slug, slugs)
  const socialTitle = `${shortTitle} | ${SITE_NAME}`
  const indexable = shouldIndexComparison({
    slugs,
    items,
    specs,
    viewCount: stat?.viewCount,
    isFeatured: stat?.isFeatured
  })
  const pairSegment = slugs.join('-vs-')

  return {
    title: shortTitle,
    description,
    alternates: {
      canonical: canonicalPath
    },
    robots: {
      index: indexable,
      follow: true
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      url: `${getSiteUrl()}${canonicalPath}`,
      title: socialTitle,
      description,
      images: [
        {
          url: `${getSiteUrl()}${ogImagePath(kind.slug, pairSegment)}`,
          width: 1200,
          height: 630,
          alt: shortTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [`${getSiteUrl()}${ogImagePath(kind.slug, pairSegment)}`]
    }
  }
}

export function itemMetadata(
  kind: Kind,
  item: Item,
  specs: SpecDefinition[]
): Metadata {
  const shortTitle = `${item.name} specs`
  const canonicalPath = itemPath(kind.slug, item.slug)
  const filledSpecs = specs.filter((def) => {
    const value = item.specs[def.key]
    return value !== null && value !== undefined && value !== ''
  })
  const description = `Full ${kind.name.toLowerCase()} specifications for ${item.name}${item.brand ? ` by ${item.brand}` : ''}. Compare ${filledSpecs.length} specs and see popular matchups.`
  const socialTitle = `${item.name} | ${SITE_NAME}`

  return {
    title: shortTitle,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      url: `${getSiteUrl()}${canonicalPath}`,
      title: socialTitle,
      description,
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined
    },
    twitter: {
      card: item.imageUrl ? 'summary_large_image' : 'summary',
      title: socialTitle,
      description,
      images: item.imageUrl ? [item.imageUrl] : undefined
    }
  }
}

export function kindHubMetadata(kind: Kind): Metadata {
  const shortTitle = `Compare ${kind.namePlural}`
  const canonicalPath = kindHubPath(kind.slug)

  return {
    title: shortTitle,
    description: kind.description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      url: `${getSiteUrl()}${canonicalPath}`,
      title: `${shortTitle} | ${SITE_NAME}`,
      description: kind.description
    },
    twitter: {
      card: 'summary',
      title: `${shortTitle} | ${SITE_NAME}`,
      description: kind.description
    }
  }
}
