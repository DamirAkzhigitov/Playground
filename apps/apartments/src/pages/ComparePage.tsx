import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function ComparePage() {
  return (
    <section className="space-y-4">
      <PageHeader
        title="Compare Apartments"
        description="Side-by-side comparison of every answer across apartments."
      />
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          Comparison matrix lands in Phase 5.
        </CardContent>
      </Card>
    </section>
  )
}
