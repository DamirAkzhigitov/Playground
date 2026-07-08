import Link from 'next/link'

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
    <section className="cmp-related">
      <h2 className="cmp-related__title">{heading}</h2>
      <ul className="cmp-related__list">
        {comparisons.map((entry) => (
          <li key={entry.pairKey}>
            <Link href={entry.href} className="cmp-related__link">
              {entry.title}
            </Link>
            <span className="cmp-related__views">
              {EN['comparison.viewCount'].replace(
                '{count}',
                entry.viewCount.toLocaleString('en-US')
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
