import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CatalogueEntry } from '@/types/catalogue'

type CatalogueCardProps = {
  entry: CatalogueEntry
}

export function CatalogueCard({ entry }: CatalogueCardProps) {
  const isFeatured = entry.size === 'featured'

  return (
    <Link
      href={entry.href}
      className="group block h-full rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card
        data-catalogue-size={entry.size}
        className="h-full py-0 transition-[box-shadow,transform] group-hover:-translate-y-0.5 group-hover:shadow-lg"
      >
        {entry.imageUrl ? (
          <img
            className="catalogue-card__media min-h-0 w-full flex-1 object-cover"
            src={entry.imageUrl}
            alt={entry.title}
            loading="lazy"
          />
        ) : null}
        <CardContent className="flex flex-col gap-2 pb-(--card-spacing)">
          <Badge variant="secondary">{entry.badge}</Badge>
          <CardTitle
            className={cn(
              'line-clamp-2 text-base font-semibold',
              isFeatured && 'text-lg'
            )}
          >
            {entry.title}
          </CardTitle>
          <CardDescription
            className={cn('line-clamp-2', isFeatured && 'line-clamp-3')}
          >
            {entry.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
