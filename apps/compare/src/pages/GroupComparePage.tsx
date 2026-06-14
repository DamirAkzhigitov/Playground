import { Link, useParams } from 'react-router-dom'

import { useI18n } from '@/contexts/I18nContext'
import { CompareMatrix } from '@/components/CompareMatrix'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useCompareGroupView } from '@/hooks'

export function GroupComparePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { t } = useI18n()
  const { data, isPending, isError, error } = useCompareGroupView(groupId)

  return (
    <section className="pb-page-pinned space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">{t('browse.back')}</Link>
        </Button>
      </div>

      {isPending ? <LoadingState label={t('compare.loading')} /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {data ? (
        <>
          <PageHeader
            title={data.group.title}
            description={data.itemType.name}
          />
          <CompareMatrix sections={data.sections} items={data.items} />
        </>
      ) : null}
    </section>
  )
}
