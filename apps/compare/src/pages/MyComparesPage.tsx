import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useItemTypes, useMyCompareGroups } from '@/hooks'

export function MyComparesPage() {
  const { t } = useI18n()
  const { data: groups, isPending, isError, error } = useMyCompareGroups()
  const { data: types } = useItemTypes()

  const typeName = (id: string) =>
    types?.find((type) => type.id === id)?.name ?? '—'

  return (
    <section className="pb-page-pinned space-y-6">
      <PageHeader
        title={t('myCompares.title')}
        description={t('myCompares.description')}
      />

      {isPending ? <LoadingState label={t('myCompares.loading')} /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {(groups ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('myCompares.empty')}
            </p>
          ) : (
            (groups ?? []).map((group) => (
              <li key={group.id}>
                <Link
                  to={`/my-compares/${group.id}`}
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition-colors group-hover:bg-accent/40">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base group-hover:underline">
                          {group.title}
                        </CardTitle>
                        <Badge variant="secondary">
                          {typeName(group.itemTypeId)}
                        </Badge>
                      </div>
                      <CardDescription>
                        {group.selectionMode === 'all'
                          ? t('myCompares.modeAll')
                          : t('myCompares.modeCurated')}
                      </CardDescription>
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
          <Link to="/my-compares/new">
            <Plus className="size-4" aria-hidden />
            {t('myCompares.new')}
          </Link>
        </Button>
      </PinnedActionBar>
    </section>
  )
}
