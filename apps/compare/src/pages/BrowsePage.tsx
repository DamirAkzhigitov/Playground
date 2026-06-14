import { BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
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
import { usePublicCompareGroups } from '@/hooks'
import { buildAuthLoginUrl } from '@playground/auth-react'
import { useAuth } from '@/contexts/AuthContext'

export function BrowsePage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data, isPending, isError, error } = usePublicCompareGroups()

  return (
    <section className="space-y-6">
      <PageHeader
        title={t('browse.title')}
        description={t('browse.description')}
      />

      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('browse.signInTitle')}
            </CardTitle>
            <CardDescription>{t('browse.signInDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="min-h-11">
              <a href={buildAuthLoginUrl(window.location.href)}>
                {t('browse.signInCta')}
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isPending ? <LoadingState label={t('browse.loading')} /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-3">
          {(data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('browse.empty')}</p>
          ) : (
            (data ?? []).map((group) => (
              <li key={group.id}>
                <Link
                  to={`/compare/${group.id}`}
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition-colors group-hover:bg-accent/40">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug group-hover:underline">
                          {group.title}
                        </CardTitle>
                        <Badge variant="secondary">{group.itemTypeName}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <BarChart2 className="size-4 shrink-0" aria-hidden />
                        {t('browse.itemCount', { count: group.itemCount ?? 0 })}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  )
}
