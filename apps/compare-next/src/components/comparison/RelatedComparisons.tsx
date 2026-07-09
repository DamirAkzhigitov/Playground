import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { EN } from '@/i18n/messages'
import type { RelatedComparison } from '@/data/comparisonPage'

type RelatedComparisonsProps = {
  heading: string
  comparisons: RelatedComparison[]
}

export function RelatedComparisons({
  heading,
  comparisons
}: RelatedComparisonsProps) {
  if (comparisons.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{heading}</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
        {comparisons.map((entry) => (
          <li key={entry.pairKey} className="flex flex-col gap-1">
            <Link
              href={entry.href}
              className="font-semibold text-foreground hover:text-primary"
            >
              {entry.title}
            </Link>
            <Badge variant="secondary" className="self-start">
              {EN['comparison.viewCount'].replace(
                '{count}',
                entry.viewCount.toLocaleString('en-US')
              )}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  )
}
