import { useParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function InspectionPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <section className="space-y-4">
      <PageHeader
        title="Inspection"
        description={`Apartment id: ${id ?? '—'}`}
      />
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          Guided one-question flow lands in Phase 3.
        </CardContent>
      </Card>
    </section>
  )
}
