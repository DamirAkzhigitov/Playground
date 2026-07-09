import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { after } from 'next/server'

import { ComparisonView } from '@/components/comparison/ComparisonView'
import { ItemView } from '@/components/comparison/ItemView'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  loadComparison,
  loadItem,
  loadRelatedComparisons
} from '@/data/comparisonPage'
import { recordComparisonView } from '@/data/comparisons'
import {
  buildPairKey,
  canonicalComparisonPath,
  canonicalOrder,
  isCanonicalOrder,
  isPairSegment,
  parsePairSegment
} from '@/lib/comparison'
import { comparisonJsonLd, itemJsonLd } from '@/lib/comparisonJsonLd'
import { comparisonMetadata, itemMetadata } from '@/lib/comparisonMetadata'

type CompareSegmentPageProps = {
  params: Promise<{ kind: string; pair: string }>
}

export async function generateMetadata({
  params
}: CompareSegmentPageProps): Promise<Metadata> {
  const { kind, pair } = await params

  if (!isPairSegment(pair)) {
    const data = await loadItem(kind, pair)
    if (!data) {
      return { title: 'Item not found', robots: { index: false } }
    }
    return itemMetadata(data.kind, data.item, data.specs)
  }

  const requestedSlugs = parsePairSegment(pair)
  if (!isCanonicalOrder(requestedSlugs)) {
    return { robots: { index: false, follow: true } }
  }

  const data = await loadComparison(kind, pair)
  if (!data) {
    return { title: 'Comparison not found', robots: { index: false } }
  }

  return comparisonMetadata({
    kind: data.kind,
    items: data.items,
    slugs: data.slugs,
    specs: data.specs,
    stat: data.stat
  })
}

export default async function CompareSegmentPage({
  params
}: CompareSegmentPageProps) {
  const { kind, pair } = await params

  if (!isPairSegment(pair)) {
    const data = await loadItem(kind, pair)
    if (!data) notFound()

    const jsonLd = itemJsonLd(data.kind, data.item, data.specs)

    return (
      <AppLayout>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ItemView data={data} />
      </AppLayout>
    )
  }

  const requestedSlugs = parsePairSegment(pair)
  if (!isCanonicalOrder(requestedSlugs)) {
    redirect(canonicalComparisonPath(kind, requestedSlugs))
  }

  const data = await loadComparison(kind, pair)
  if (!data) notFound()

  const slugs = canonicalOrder(data.slugs)
  const pairKey = buildPairKey(kind, slugs)

  after(() => {
    recordComparisonView(kind, pairKey, slugs).catch((error: unknown) => {
      console.error('Failed to record comparison view', {
        kind,
        pairKey,
        error
      })
    })
  })

  const related = await loadRelatedComparisons(kind, data.slugs, pairKey)
  const jsonLd = comparisonJsonLd(data.kind, data.items, data.specs, data.slugs)

  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ComparisonView data={data} related={related} />
    </AppLayout>
  )
}
