import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { KindHub } from '@/components/comparison/KindHub'
import { AppLayout } from '@/components/layout/AppLayout'
import { loadKindHub } from '@/data/comparisonPage'
import { kindHubJsonLd } from '@/lib/comparisonJsonLd'
import { kindHubMetadata } from '@/lib/comparisonMetadata'

type KindHubPageProps = {
  params: Promise<{ kind: string }>
}

export async function generateMetadata({
  params
}: KindHubPageProps): Promise<Metadata> {
  const { kind } = await params
  const data = await loadKindHub(kind)

  if (!data) {
    return { title: 'Category not found', robots: { index: false } }
  }

  return kindHubMetadata(data.kind)
}

export default async function KindHubPage({ params }: KindHubPageProps) {
  const { kind } = await params
  const data = await loadKindHub(kind)

  if (!data) notFound()

  const jsonLd = kindHubJsonLd(data.kind, data.items)

  return (
    <AppLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KindHub data={data} />
    </AppLayout>
  )
}
