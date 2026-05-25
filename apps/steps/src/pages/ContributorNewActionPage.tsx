import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ContributorNewActionPage() {
  return (
    <div>
      <PageHeader title="New action" description="Phase 4 editor" />
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          The contributor editor (metadata + steps CRUD + preview + publish) is
          built in Phase 4.
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/contributor">Back to hub</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
