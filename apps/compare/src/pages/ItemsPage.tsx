import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useItemTypes, useItems } from '@/hooks'

export function ItemsPage() {
  const { t } = useI18n()
  const { data: types } = useItemTypes()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const { data, isPending, isError, error } = useItems(
    typeFilter === 'all' ? undefined : typeFilter
  )
  const [query, setQuery] = useState('')

  const typeNameById = useMemo(
    () => new Map((types ?? []).map((type) => [type.id, type.name])),
    [types]
  )

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((item) => item.isOwner !== false)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((item) => item.title.toLowerCase().includes(q))
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
          placeholder={t('items.searchPlaceholder')}
          className="h-11 rounded-full border-input bg-muted/40 pl-10 shadow-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={typeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('all')}
        >
          {t('items.allTypes')}
        </Button>
        {(types ?? []).map((type) => (
          <Button
            key={type.id}
            size="sm"
            variant={typeFilter === type.id ? 'default' : 'outline'}
            onClick={() => setTypeFilter(type.id)}
          >
            {type.name}
          </Button>
        ))}
      </div>

      {isPending ? <LoadingState label={t('items.loading')} /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('items.empty')}</p>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/items/${item.id}`}
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition-colors group-hover:bg-accent/40">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug group-hover:underline">
                          {item.title}
                        </CardTitle>
                        <div className="flex gap-1.5">
                          <Badge variant="secondary">
                            {typeNameById.get(item.itemTypeId) ?? '—'}
                          </Badge>
                          <Badge
                            variant={item.isPublic ? 'secondary' : 'outline'}
                          >
                            {item.isPublic
                              ? t('items.public')
                              : t('items.private')}
                          </Badge>
                        </div>
                      </div>
                      {item.completion ? (
                        <CardDescription>
                          {t('items.progress', {
                            percent: item.completion.percent
                          })}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}

      <PinnedActionBar>
        <Button asChild className="min-h-11 w-full">
          <Link to="/add-item">
            <Plus className="size-4" aria-hidden />
            {t('items.add')}
          </Link>
        </Button>
      </PinnedActionBar>
    </section>
  )
}
