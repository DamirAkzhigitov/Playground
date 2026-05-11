import { MapPin, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApartmentStatusBadge } from '@/components/ApartmentStatusBadge'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useApartments } from '@/hooks'

export function ApartmentsPage() {
  const { data, isPending, isError, error } = useApartments()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const list = data ?? []
    const q = query.trim().toLowerCase()
    if (!q) {
      return list
    }
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.address?.toLowerCase().includes(q) ?? false)
    )
  }, [data, query])

  return (
    <section className="pb-page-pinned space-y-6">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          placeholder="Search by title or address…"
          className="h-11 rounded-full border-input bg-muted/40 pl-10 shadow-sm focus-visible:bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search listings"
        />
      </div>

      {isPending ? <LoadingState label="Loading listings…" /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {filtered.map((apartment) => {
            const percent = apartment.completion?.percent
            const critical = apartment.completion?.criticalMissingCount ?? 0
            return (
              <li key={apartment.id}>
                <Link
                  to={`/apartments/${apartment.id}`}
                  className="group block rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Card className="transition-colors group-hover:bg-accent/40">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug group-hover:underline">
                          {apartment.title}
                        </CardTitle>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          <ApartmentStatusBadge
                            completion={apartment.completion}
                          />
                          {typeof percent === 'number' ? (
                            <Badge variant="secondary">{percent}%</Badge>
                          ) : (
                            <Badge variant="outline">New</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-1.5">
                        <MapPin
                          aria-hidden="true"
                          className="size-3.5 shrink-0"
                        />
                        <span className="line-clamp-2">
                          {apartment.address ?? 'No address yet'}
                        </span>
                      </CardDescription>
                      {critical > 0 ? (
                        <p className="text-destructive text-xs font-medium">
                          {critical} critical question
                          {critical === 1 ? '' : 's'} missing
                        </p>
                      ) : null}
                    </CardHeader>
                    {apartment.price !== null &&
                    apartment.price !== undefined ? (
                      <CardContent className="text-sm text-muted-foreground">
                        €{apartment.price.toLocaleString()}
                      </CardContent>
                    ) : null}
                  </Card>
                </Link>
              </li>
            )
          })}
          {(data ?? []).length === 0 ? (
            <li>
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No listings yet. Tap{' '}
                  <span className="font-medium text-foreground">
                    New listing
                  </span>{' '}
                  to add one.
                </CardContent>
              </Card>
            </li>
          ) : null}
          {(data ?? []).length > 0 && filtered.length === 0 ? (
            <li>
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No listings match “{query.trim()}”.
                </CardContent>
              </Card>
            </li>
          ) : null}
        </ul>
      ) : null}

      <PinnedActionBar>
        <Button
          asChild
          className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
        >
          <Link to="/apartments/new" aria-label="New listing">
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            New listing
          </Link>
        </Button>
      </PinnedActionBar>
    </section>
  )
}
