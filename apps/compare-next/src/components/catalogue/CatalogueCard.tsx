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
    <article className={sizeClass(entry.size)}>
      <img
        className="card__media"
        src={entry.imageUrl}
        alt={entry.title}
        loading="lazy"
      />
      <div className="card__body">
        <span className="badge">{entry.badge}</span>
        <h2 className="card__title">{entry.title}</h2>
        <p className="card__description">{entry.description}</p>
      </div>
    </article>
  )
}
