import { MapPin, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
import { ListingStatusBadge } from '@/components/ListingStatusBadge.tsx'
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
import { useListings } from '@/hooks'

export function ListingsPage() {
  const { t } = useI18n()
  const { data, isPending, isError, error } = useListings()
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
          placeholder={t('listings.searchPlaceholder')}
          className="h-11 rounded-full border-input bg-muted/40 pl-10 shadow-sm focus-visible:bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('listings.searchAria')}
        />
      </div>

      {isPending ? <LoadingState label={t('listings.loading')} /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {filtered.map((listing) => {
            const percent = listing.completion?.percent
            const critical = listing.completion?.criticalMissingCount ?? 0
            return (
              <li key={listing.id}>
                <Link
                  to={`/listings/${listing.id}`}
                  className="group block rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Card className="transition-colors group-hover:bg-accent/40">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug group-hover:underline">
                          {listing.title}
                        </CardTitle>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          <ListingStatusBadge completion={listing.completion} />
                          {typeof percent === 'number' ? (
                            <Badge variant="secondary">{percent}%</Badge>
                          ) : (
                            <Badge variant="outline">{t('listings.new')}</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-1.5">
                        <MapPin
                          aria-hidden="true"
                          className="size-3.5 shrink-0"
                        />
                        <span className="line-clamp-2">
                          {listing.address ?? t('listings.noAddress')}
                        </span>
                      </CardDescription>
                      {critical > 0 ? (
                        <p className="text-destructive text-xs font-medium">
                          {critical === 1
                            ? t('listings.criticalMissingOne', {
                                n: critical
                              })
                            : t('listings.criticalMissingMany', {
                                n: critical
                              })}
                        </p>
                      ) : null}
                    </CardHeader>
                    {listing.price !== null && listing.price !== undefined ? (
                      <CardContent className="text-sm text-muted-foreground">
                        €{listing.price.toLocaleString()}
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
                  {t('listings.empty', {
                    newApartment: t('listings.newApartment')
                  })}
                </CardContent>
              </Card>
            </li>
          ) : null}
          {(data ?? []).length > 0 && filtered.length === 0 ? (
            <li>
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {t('listings.noMatch', { query: query.trim() })}
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
          <Link to="/listings/new" aria-label={t('listings.newAria')}>
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            {t('listings.newApartment')}
          </Link>
        </Button>
      </PinnedActionBar>
    </section>
  )
}
