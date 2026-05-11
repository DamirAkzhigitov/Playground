import { MapPin, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useApartments } from '@/hooks'

export function ApartmentsPage() {
  const { data, isPending, isError, error } = useApartments()

  return (
    <section className="space-y-6">
      <PageHeader
        title="Apartments"
        description="Track every place you visit and how complete the data is."
        actions={
          <Button asChild size="sm">
            <Link to="/apartments/new">
              <Plus aria-hidden="true" />
              <span className="hidden sm:inline">New apartment</span>
              <span className="sr-only sm:hidden">New apartment</span>
            </Link>
          </Button>
        }
      />

      {isPending ? <LoadingState label="Loading apartments..." /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {(data ?? []).map((apartment) => {
            const percent = apartment.completion?.percent
            return (
              <li key={apartment.id}>
                <Card className="transition-colors hover:bg-accent/40">
                  <CardHeader className="gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">
                        <Link
                          className="hover:underline focus-visible:underline focus-visible:outline-none"
                          to={`/apartments/${apartment.id}`}
                        >
                          {apartment.title}
                        </Link>
                      </CardTitle>
                      {typeof percent === 'number' ? (
                        <Badge variant="secondary">{percent}%</Badge>
                      ) : (
                        <Badge variant="outline">New</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5" />
                      <span className="line-clamp-1">
                        {apartment.address ?? 'No address yet'}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  {apartment.price !== null && apartment.price !== undefined ? (
                    <CardContent className="text-sm text-muted-foreground">
                      €{apartment.price.toLocaleString()}
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            )
          })}
          {(data ?? []).length === 0 ? (
            <li>
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No apartments yet. Tap{' '}
                  <span className="font-medium text-foreground">
                    New apartment
                  </span>{' '}
                  to add one.
                </CardContent>
              </Card>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  )
}
