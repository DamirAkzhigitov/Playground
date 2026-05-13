import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/contexts/I18nContext'
import { deriveListingStatus } from '@/lib/listingStatus.ts'
import type { Listing } from '@/types'

type Props = {
  completion?: Listing['completion']
  className?: string
}

export function ListingStatusBadge({ completion, className }: Props) {
  const { t } = useI18n()
  const status = deriveListingStatus(completion)
  if (status === 'missing-critical') {
    return (
      <Badge variant="destructive" className={className}>
        {t('status.missingCritical')}
      </Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge variant="secondary" className={className}>
        {t('status.completed')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={className}>
      {t('status.needsReview')}
    </Badge>
  )
}
