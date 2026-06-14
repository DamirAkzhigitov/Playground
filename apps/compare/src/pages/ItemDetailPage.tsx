import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AnswerField } from '@/components/AnswerField'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/contexts/I18nContext'
import { useDebouncedAnswerSave, useItem, useUpsertAnswer } from '@/hooks'
import { buildAnswerDraftMap } from '@/lib/specs'

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const { data, isPending, isError, error } = useItem(id)
  const upsert = useUpsertAnswer()
  const { queueSave } = useDebouncedAnswerSave(upsert.mutateAsync)
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({})

  const drafts = useMemo(() => {
    if (!data?.sections) return {}
    return buildAnswerDraftMap(
      data.sections,
      data.answers.map((a) => ({
        specId: a.specId,
        value: a.value,
        note: a.note
      }))
    )
  }, [data])

  if (isPending) return <LoadingState label={t('itemDetail.loading')} />
  if (isError) return <ErrorState message={error.message} />
  if (!data) return <ErrorState message={t('errors.notFound')} />

  const readOnly = !data.isOwner

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/items">{t('itemDetail.allItems')}</Link>
        </Button>
        {data.isOwner ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/items/${data.id}/edit`}>{t('common.edit')}</Link>
          </Button>
        ) : null}
      </div>

      <PageHeader title={data.title} description={data.notes ?? undefined} />

      <div className="flex flex-wrap gap-2">
        <Badge variant={data.isPublic ? 'secondary' : 'outline'}>
          {data.isPublic ? t('items.public') : t('items.private')}
        </Badge>
        {readOnly ? (
          <Badge variant="outline">{t('itemDetail.readOnly')}</Badge>
        ) : null}
      </div>

      <div className="space-y-6">
        {data.sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {section.name}
            </h2>
            {section.specs
              .filter((s) => !s.isArchived)
              .map((spec) => (
                <AnswerField
                  key={spec.id}
                  question={spec}
                  value={drafts[spec.id]?.value ?? null}
                  note={drafts[spec.id]?.note ?? null}
                  disabled={readOnly}
                  noteExpanded={noteOpen[spec.id] ?? false}
                  onToggleNote={() =>
                    setNoteOpen((prev) => ({
                      ...prev,
                      [spec.id]: !prev[spec.id]
                    }))
                  }
                  onValueChange={(value) => {
                    if (readOnly || !id) return
                    queueSave({
                      itemId: id,
                      specId: spec.id,
                      value,
                      note: drafts[spec.id]?.note ?? null
                    })
                  }}
                  onNoteChange={(note) => {
                    if (readOnly || !id) return
                    queueSave({
                      itemId: id,
                      specId: spec.id,
                      value: drafts[spec.id]?.value ?? null,
                      note
                    })
                  }}
                  density="compact"
                />
              ))}
          </div>
        ))}
      </div>
    </section>
  )
}
