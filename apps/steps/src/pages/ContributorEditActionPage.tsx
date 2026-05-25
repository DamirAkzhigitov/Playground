import { useParams, Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ContributorEditActionPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <PageHeader
        title={`Edit action ${id ?? ''}`}
        description="Phase 4 editor stub"
      />
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground space-y-2">
          Full step editor, reorder, markdown, requirements, preview toggle, and
          publish button ship in Phase 4.
          <div>
            <Button variant="outline" asChild>
              <Link to="/contributor">Back to hub</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
