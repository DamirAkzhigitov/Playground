import { Badge } from '@/components/ui/badge'
import { deriveApartmentStatus } from '@/lib/apartmentStatus'
import type { Apartment } from '@/types'

type Props = {
  completion?: Apartment['completion']
  className?: string
}

export function ApartmentStatusBadge({ completion, className }: Props) {
  const status = deriveApartmentStatus(completion)
  if (status === 'missing-critical') {
    return (
      <Badge variant="destructive" className={className}>
        Missing critical
      </Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge variant="secondary" className={className}>
        Completed
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={className}>
      Needs review
    </Badge>
  )
}
