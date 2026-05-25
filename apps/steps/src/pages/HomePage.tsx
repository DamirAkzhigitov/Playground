import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { ActionCard } from '@/components/ActionCard'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/lib/queryKeys'
import { listActions } from '@/lib/stepsApi'

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const popularQuery = useQuery({
    queryKey: queryKeys.actions.list({ sort: 'popular', limit: 8 }),
    queryFn: () => listActions({ sort: 'popular', limit: 8, page: 1 })
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/actions?q=${encodeURIComponent(q)}` : '/actions')
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Guided steps for real life"
        description="Discover step-by-step guides for complex tasks — from mortgages to major purchases. Search, start a guide, and track your progress."
      />

      <form onSubmit={handleSearch} className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Find a guide…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-12 text-base"
          aria-label="Search guides"
        />
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Popular guides</h2>
          <Button variant="link" asChild className="px-0">
            <Link to="/actions">View all actions</Link>
          </Button>
        </div>

        {popularQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : null}

        {popularQuery.isError ? (
          <ErrorState
            message="Could not load popular guides."
            onRetry={() => popularQuery.refetch()}
          />
        ) : null}

        {popularQuery.isSuccess && popularQuery.data.items.length === 0 ? (
          <LoadingState label="No published guides yet." />
        ) : null}

        {popularQuery.isSuccess && popularQuery.data.items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {popularQuery.data.items.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
