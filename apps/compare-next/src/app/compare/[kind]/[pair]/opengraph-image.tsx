import { ImageResponse } from 'next/og'

import { loadComparison } from '@/data/comparisonPage'
import { comparisonTitleFromNames, isPairSegment } from '@/lib/comparison'
import { SITE_NAME } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type OgImageProps = {
  params: Promise<{ kind: string; pair: string }>
}

export default async function OgImage({ params }: OgImageProps) {
  const { kind, pair } = await params

  if (!isPairSegment(pair)) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111827',
            color: '#f9fafb',
            fontSize: 48,
            fontWeight: 700
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size
    )
  }

  const data = await loadComparison(kind, pair)
  const title = data
    ? comparisonTitleFromNames(data.items.map((item) => item.name))
    : 'Comparison'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          color: '#f9fafb'
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#a5b4fc',
            marginBottom: 24
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </div>
        {data ? (
          <div
            style={{
              marginTop: 32,
              fontSize: 28,
              color: '#d1d5db'
            }}
          >
            {data.kind.name} specs compared side by side
          </div>
        ) : null}
      </div>
    ),
    size
  )
}
