import Link from 'next/link'

import type { CatalogueEntry } from '@/types/catalogue'

type CatalogueCardProps = {
  entry: CatalogueEntry
}

function sizeClass(size: CatalogueEntry['size']): string {
  if (size === 'default') return 'card'
  return `card card--${size}`
}

export function CatalogueCard({ entry }: CatalogueCardProps) {
  return (
    <Link href={entry.href} className="card-link">
      <article className={sizeClass(entry.size)}>
        {entry.imageUrl ? (
          <img
            className="card__media"
            src={entry.imageUrl}
            alt={entry.title}
            loading="lazy"
          />
        ) : null}
        <div className="card__body">
          <span className="badge">{entry.badge}</span>
          <h2 className="card__title">{entry.title}</h2>
          <p className="card__description">{entry.description}</p>
        </div>
      </article>
    </Link>
  )
}
