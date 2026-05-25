import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export function ContributorHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributor hub"
        description="Drafts and published actions you manage. Full editor in Phase 4."
        actions={
          <Button asChild>
            <Link to="/contributor/actions/new">New action</Link>
          </Button>
        }
      />

      <div className="text-sm text-muted-foreground">
        Your actions list will load here (Phase 4). Use the API directly for now
        via curl (see IMPLEMENTATION.md smoke tests).
      </div>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/contributor/actions/seed-123/edit">
            Edit example (stub)
          </Link>
        </Button>
      </div>
    </div>
  )
}
