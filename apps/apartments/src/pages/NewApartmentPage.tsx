import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function NewApartmentPage() {
  return (
    <section className="space-y-4">
      <PageHeader
        title="Create Apartment"
        description="Start tracking a new place you're considering."
      />
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          Form UI comes in Phase 3.
        </CardContent>
      </Card>
    </section>
  )
}
