import { Pencil } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AnswerField } from '@/components/AnswerField'
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
import { buildAnswerDraftMap, flattenActiveQuestions } from '@/lib/questions'

const EMPTY_GROUPS: QuestionGroup[] = []

export function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const apartmentQuery = useApartment(id)
  const questionsQuery = useQuestions(false)
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
        toast.error(e instanceof Error ? e.message : 'Could not save answer.')
      }
      return { ...prev, [questionId]: next }
    })
  }

  const isLoading = apartmentQuery.isPending || questionsQuery.isPending
  const isErr = apartmentQuery.isError || questionsQuery.isError
  const errMsg = apartmentQuery.error?.message ?? questionsQuery.error?.message

  if (isLoading) {
    return <LoadingState label="Loading apartment…" />
  }
  if (isErr) {
    return <ErrorState message={errMsg ?? 'Something went wrong.'} />
  }
  if (!id || !apartmentQuery.data) {
    return <ErrorState message="Apartment not found." />
  }

  const data = apartmentQuery.data
  const status = deriveApartmentStatus(completion ?? undefined)
  const inspectLabel =
    status === 'completed' ? 'Review inspection' : 'Start / resume inspection'

  return (
    <section className="flex flex-col gap-6 pb-page-pinned">
      <PageHeader
        title={data.title}
        description={
          data.price !== null && data.price !== undefined
            ? `${data.address ?? 'No address yet'} · €${data.price.toLocaleString()}`
            : (data.address ?? 'No address yet')
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ApartmentStatusBadge completion={completion ?? undefined} />
            <Button variant="outline" size="sm" asChild>
              <Link
                to={`/apartments/${data.id}/edit`}
                className="inline-flex items-center gap-2"
                aria-label="Edit apartment"
              >
                <Pencil className="size-4" aria-hidden />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="flex min-h-[calc(100dvh_-_var(--global-header-height)_-_13rem)] flex-col">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            Completion is based on active questions and saved answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          {completion ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Progress</span>{' '}
                <span className="font-medium tabular-nums">
                  {completion.percent}%
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
              <div>
                <span className="text-muted-foreground">Answered</span>{' '}
                <span className="font-medium tabular-nums">
                  {completion.answeredQuestions}/{completion.totalQuestions}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
              <div>
                <span className="text-muted-foreground">Critical gaps</span>{' '}
                <span className="font-medium tabular-nums text-destructive">
                  {completion.criticalMissingCount}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No questions configured yet.
            </p>
          )}

          {missingRequired.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Missing required answers</p>
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
                          Required
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {question.type.replaceAll('-', ' ')}
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
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      <PinnedActionBar>
        <Button variant="outline" asChild className="min-h-11 flex-1">
          <Link to="/apartments">All apartments</Link>
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
