import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export function ExportPage() {
  return (
    <section className="space-y-4">
      <PageHeader
        title="Export"
        description="Download all listings and answers as JSON or XLSX."
      />
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          JSON and XLSX export tools land in Phase 5.
        </CardContent>
      </Card>
    </section>
  )
}
