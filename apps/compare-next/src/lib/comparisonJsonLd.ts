import {
  canonicalComparisonPath,
  formatSpecValue,
  itemPath,
  kindHubPath
} from '@/lib/comparison'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import { getSiteUrl } from '@/lib/site'
import type { Item, Kind, SpecDefinition } from '@/types/catalogue'

/**
 * Structured data for a comparison page: BreadcrumbList, optional FAQPage, plus
 * one Product per compared item with specs as additionalProperty.
 */
export function comparisonJsonLd(
  kind: Kind,
  items: Item[],
  specs: SpecDefinition[],
  slugs: string[]
) {
  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}${canonicalComparisonPath(kind.slug, slugs)}`
  const title = items.map((item) => item.name).join(' vs ')
  const verdict = buildComparisonVerdict(items, specs)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Compare ${kind.namePlural}`,
        item: `${siteUrl}${kindHubPath(kind.slug)}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: canonicalUrl
      }
    ]
  }

  const products = items.map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    brand: item.brand ? { '@type': 'Brand', name: item.brand } : undefined,
    image: item.imageUrl ?? undefined,
    category: kind.name,
    releaseDate: item.releaseDate ?? undefined,
    additionalProperty: specs
      .map((def) => {
        const value = item.specs[def.key]
        if (value === null || value === undefined || value === '') return null
        return {
          '@type': 'PropertyValue',
          name: def.label,
          value: formatSpecValue(value, def)
        }
      })
      .filter(Boolean)
  }))

  const blocks: Record<string, unknown>[] = [breadcrumb, ...products]

  if (verdict && verdict.faq.length > 0) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: verdict.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer
        }
      }))
    })
  }

  return blocks
}

export function itemJsonLd(kind: Kind, item: Item, specs: SpecDefinition[]) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}${itemPath(kind.slug, item.slug)}`
  const msrp = item.specs.msrp_usd

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Compare ${kind.namePlural}`,
        item: `${siteUrl}${kindHubPath(kind.slug)}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.name,
        item: pageUrl
      }
    ]
  }

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    brand: item.brand ? { '@type': 'Brand', name: item.brand } : undefined,
    image: item.imageUrl ?? undefined,
    category: kind.name,
    releaseDate: item.releaseDate ?? undefined,
    offers:
      typeof msrp === 'number'
        ? {
            '@type': 'Offer',
            price: msrp,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          }
        : undefined,
    additionalProperty: specs
      .map((def) => {
        const value = item.specs[def.key]
        if (value === null || value === undefined || value === '') return null
        return {
          '@type': 'PropertyValue',
          name: def.label,
          value: formatSpecValue(value, def)
        }
      })
      .filter(Boolean)
  }

  return [breadcrumb, product]
}

export function kindHubJsonLd(kind: Kind, items: Item[]) {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Compare ${kind.namePlural}`,
    description: kind.description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: `${siteUrl}${itemPath(kind.slug, item.slug)}`
      }
    }))
  }
}
