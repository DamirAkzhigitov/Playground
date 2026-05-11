import { Pencil } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
import { AnswerField } from '@/components/AnswerField'
import { QuestionPhotosSection } from '@/components/QuestionPhotosSection'
import { ApartmentStatusBadge } from '@/components/ApartmentStatusBadge'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
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
import { Separator } from '@/components/ui/separator'
import type { QuestionGroup, UpsertAnswerInput } from '@/types'

import { useApartment, useQuestions, useUpsertAnswer } from '@/hooks'
import { useKeyedDebouncedAnswerSave } from '@/hooks/useDebouncedAnswerSave'
import {
  computeCompletionFromQuestions,
  deriveApartmentStatus
} from '@/lib/apartmentStatus'
import { isQuestionAnswerFilled } from '@/lib/answerValue'
import { questionTypeMessageId } from '@/lib/questionTypeMessageId'
import { buildAnswerDraftMap, flattenActiveQuestions } from '@/lib/questions'

const EMPTY_GROUPS: QuestionGroup[] = []

export function ApartmentDetailPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const apartmentQuery = useApartment(id)
  const questionsQuery = useQuestions({ apartmentId: id })
  const upsert = useUpsertAnswer()
  const dirtyQuestionIdsRef = useRef(new Set<string>())

  const saveAnswer = useCallback(
    async (payload: { answer: UpsertAnswerInput }) => {
      await upsert.mutateAsync(payload)
      dirtyQuestionIdsRef.current.delete(payload.answer.questionId)
    },
    [upsert]
  )

  const { queueSave, flushSave } = useKeyedDebouncedAnswerSave(saveAnswer)

  const groups = questionsQuery.data ?? EMPTY_GROUPS
  const flat = useMemo(() => flattenActiveQuestions(groups), [groups])

  const [answers, setAnswers] = useState<
    Record<string, { value: string | null; note: string | null }>
  >({})
  const [noteExpanded, setNoteExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dirtyQuestionIdsRef.current.clear()
  }, [id])

  useEffect(() => {
    const data = apartmentQuery.data
    const gr = questionsQuery.data
    if (!data || !gr) {
      return
    }
    const server = buildAnswerDraftMap(gr, data.answers)
    setAnswers((prev) => {
      if (Object.keys(prev).length === 0) {
        return server
      }
      const merged: Record<
        string,
        { value: string | null; note: string | null }
      > = { ...server }
      for (const qid of dirtyQuestionIdsRef.current) {
        const local = prev[qid]
        if (local !== undefined) {
          merged[qid] = local
        }
      }
      return merged
    })
  }, [apartmentQuery.data, questionsQuery.data])

  useEffect(() => {
    return () => {
      void flushSave()
    }
  }, [flushSave])

  const completion = useMemo(() => {
    if (!flat.length) {
      return null
    }
    const rows = flat.map((q) => ({
      questionId: q.id,
      value: answers[q.id]?.value ?? null
    }))
    return computeCompletionFromQuestions(
      flat.map((q) => ({ id: q.id, required: q.required, type: q.type })),
      rows
    )
  }, [flat, answers])

  const missingRequired = useMemo(() => {
    return flat.filter(
      (q) => q.required && !isQuestionAnswerFilled(q, answers[q.id]?.value)
    )
  }, [flat, answers])

  const updateAnswer = (
    questionId: string,
    patch: Partial<{ value: string | null; note: string | null }>
  ) => {
    if (!id) {
      return
    }
    setAnswers((prev) => {
      const cur = prev[questionId] ?? { value: null, note: null }
      const next = { ...cur, ...patch }
      dirtyQuestionIdsRef.current.add(questionId)
      try {
        queueSave({
          apartmentId: id,
          questionId,
          value: next.value,
          note: next.note
        })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('errors.saveAnswer'))
      }
      return { ...prev, [questionId]: next }
    })
  }

  const isLoading = apartmentQuery.isPending || questionsQuery.isPending
  const isErr = apartmentQuery.isError || questionsQuery.isError
  const errMsg = apartmentQuery.error?.message ?? questionsQuery.error?.message

  if (isLoading) {
    return <LoadingState label={t('detail.loading')} />
  }
  if (isErr) {
    return <ErrorState message={errMsg ?? t('errors.generic')} />
  }
  if (!id || !apartmentQuery.data) {
    return <ErrorState message={t('errors.notFound')} />
  }

  const data = apartmentQuery.data
  const status = deriveApartmentStatus(completion ?? undefined)
  const inspectLabel =
    status === 'completed'
      ? t('detail.reviewInspection')
      : t('detail.startInspection')

  return (
    <section className="flex flex-col gap-6 pb-page-pinned">
      <PageHeader
        title={data.title}
        description={
          data.price !== null && data.price !== undefined
            ? `${data.address ?? t('apartments.noAddress')} · €${data.price.toLocaleString()}`
            : (data.address ?? t('apartments.noAddress'))
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ApartmentStatusBadge completion={completion ?? undefined} />
            <Button variant="outline" size="sm" asChild>
              <Link
                to={`/apartments/${data.id}/edit`}
                className="inline-flex items-center gap-2"
                aria-label={t('detail.editAria')}
              >
                <Pencil className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t('common.edit')}</span>
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="flex flex-col">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t('detail.overview')}</CardTitle>
          <CardDescription>{t('detail.overviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          {completion ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t('detail.progress')}
                </span>{' '}
                <span className="font-medium tabular-nums">
                  {completion.percent}%
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
              <div>
                <span className="text-muted-foreground">
                  {t('detail.answered')}
                </span>{' '}
                <span className="font-medium tabular-nums">
                  {completion.answeredQuestions}/{completion.totalQuestions}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
              <div>
                <span className="text-muted-foreground">
                  {t('detail.criticalGaps')}
                </span>{' '}
                <span className="font-medium tabular-nums text-destructive">
                  {completion.criticalMissingCount}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('detail.noQuestions')}
            </p>
          )}

          {missingRequired.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t('detail.missingRequiredTitle')}
              </p>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {missingRequired.map((q) => (
                  <li key={q.id}>{q.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {groups.map((group) => {
        const active = group.questions
          .filter((q) => !q.isArchived)
          .sort((a, b) => a.order - b.order)
        if (active.length === 0) {
          return null
        }
        return (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base">{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {active.map((question) => {
                const draft = answers[question.id]
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium leading-snug">
                        {question.label}
                      </p>
                      {question.required ? (
                        <Badge variant="outline" className="text-xs">
                          {t('common.required')}
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-xs">
                        {t(questionTypeMessageId(question.type))}
                      </Badge>
                    </div>
                    <AnswerField
                      question={question}
                      value={draft?.value ?? null}
                      note={draft?.note ?? null}
                      onValueChange={(v) =>
                        updateAnswer(question.id, { value: v })
                      }
                      onNoteChange={(n) =>
                        updateAnswer(question.id, { note: n })
                      }
                      noteExpanded={Boolean(noteExpanded[question.id])}
                      onToggleNote={() =>
                        setNoteExpanded((prev) => ({
                          ...prev,
                          [question.id]: !prev[question.id]
                        }))
                      }
                      density="compact"
                    />
                    <QuestionPhotosSection
                      apartmentId={data.id}
                      questionId={question.id}
                      questionLabel={question.label}
                      allPhotos={data.photos}
                      density="compact"
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      <PinnedActionBar>
        <Button variant="outline" asChild className="min-h-11 flex-1">
          <Link to="/apartments">{t('detail.allApartments')}</Link>
        </Button>
        <Button
          asChild
          className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
        >
          <Link to={`/apartments/${data.id}/inspect?resume=1`}>
            {inspectLabel}
          </Link>
        </Button>
      </PinnedActionBar>
    </section>
  )
}
