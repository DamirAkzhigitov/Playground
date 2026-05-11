import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AnswerField } from '@/components/AnswerField'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { useApartment, useQuestions, useUpsertAnswer } from '@/hooks'
import { useDebouncedAnswerSave } from '@/hooks/useDebouncedAnswerSave'
import { isQuestionAnswerFilled } from '@/lib/answerValue'
import {
  type AnswerDraft,
  buildAnswerDraftMap,
  firstQuestionIndexForCategory,
  flattenActiveQuestions,
  questionIndexInFlatList
} from '@/lib/questions'
import type { QuestionGroup } from '@/types'

const EMPTY_GROUPS: QuestionGroup[] = []

const sessionIndexKey = (apartmentId: string) =>
  `apartments.inspect.${apartmentId}.index`
const sessionPhaseKey = (apartmentId: string) =>
  `apartments.inspect.${apartmentId}.phase`

function categoryProgressList(
  groups: QuestionGroup[],
  answers: Record<string, AnswerDraft | undefined>
) {
  return groups.map((g) => {
    const qs = g.questions.filter((q) => !q.isArchived)
    let answered = 0
    for (const q of qs) {
      if (isQuestionAnswerFilled(q, answers[q.id]?.value)) {
        answered++
      }
    }
    return {
      categoryId: g.id,
      name: g.name,
      answered,
      total: qs.length
    }
  })
}

export function InspectionPage() {
  const { id } = useParams<{ id: string }>()
  const apartmentQuery = useApartment(id)
  const questionsQuery = useQuestions(false)
  const upsert = useUpsertAnswer()
  const { queueSave, flushSave } = useDebouncedAnswerSave(upsert.mutateAsync)

  const groups = questionsQuery.data ?? EMPTY_GROUPS
  const flat = useMemo(() => flattenActiveQuestions(groups), [groups])

  const [phase, setPhase] = useState<'question' | 'summary'>('question')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const seededRef = useRef(false)

  useEffect(() => {
    seededRef.current = false
  }, [id])

  useEffect(() => {
    const apt = apartmentQuery.data
    const gr = questionsQuery.data
    if (!apt || !gr || seededRef.current) {
      return
    }
    seededRef.current = true
    setAnswers(buildAnswerDraftMap(gr, apt.answers))
  }, [apartmentQuery.data, questionsQuery.data])

  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore saved progress once lists load */
    if (!id || flat.length === 0) {
      return
    }
    const rawPhase = sessionStorage.getItem(sessionPhaseKey(id))
    const rawIndex = sessionStorage.getItem(sessionIndexKey(id))
    if (rawPhase === 'summary') {
      setPhase('summary')
      return
    }
    if (rawIndex !== null) {
      const n = Number.parseInt(rawIndex, 10)
      if (!Number.isNaN(n) && n >= 0 && n < flat.length) {
        setIndex(n)
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id, flat.length])

  useEffect(() => {
    if (!id) {
      return
    }
    try {
      sessionStorage.setItem(sessionPhaseKey(id), phase)
      if (phase === 'question') {
        sessionStorage.setItem(sessionIndexKey(id), String(index))
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [id, phase, index])

  const current = flat[index]
  const draft = current ? answers[current.id] : undefined

  const updateDraft = useCallback(
    (questionId: string, patch: Partial<AnswerDraft>) => {
      if (!id) {
        return
      }
      setAnswers((prev) => {
        const cur = prev[questionId] ?? { value: null, note: null }
        const next = { ...cur, ...patch }
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
    },
    [id, queueSave]
  )

  const goNext = useCallback(async () => {
    if (!current) {
      return
    }
    await flushSave()
    setNoteExpanded(false)
    if (index >= flat.length - 1) {
      setPhase('summary')
      return
    }
    setIndex((i) => i + 1)
  }, [current, flushSave, index, flat.length])

  const goPrev = useCallback(async () => {
    await flushSave()
    setNoteExpanded(false)
    if (phase === 'summary') {
      setPhase('question')
      setIndex(Math.max(0, flat.length - 1))
      return
    }
    setIndex((i) => Math.max(0, i - 1))
  }, [flushSave, phase, flat.length])

  const missingRequired = useMemo(() => {
    return flat.filter(
      (q) => q.required && !isQuestionAnswerFilled(q, answers[q.id]?.value)
    )
  }, [flat, answers])

  const catProgress = useMemo(
    () => categoryProgressList(groups, answers),
    [groups, answers]
  )

  const isLoading = apartmentQuery.isPending || questionsQuery.isPending
  const isErr = apartmentQuery.isError || questionsQuery.isError
  const errMsg = apartmentQuery.error?.message ?? questionsQuery.error?.message

  if (isLoading) {
    return <LoadingState label="Loading inspection…" />
  }
  if (isErr) {
    return <ErrorState message={errMsg ?? 'Something went wrong.'} />
  }
  if (!id || !apartmentQuery.data) {
    return <ErrorState message="Apartment not found." />
  }
  if (flat.length === 0) {
    return (
      <section className="space-y-4">
        <PageHeader
          title="Inspection"
          description={apartmentQuery.data.title}
        />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            There are no active questions yet. Add questions under the Questions
            tab first.
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Inspection"
        description={apartmentQuery.data.title}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/apartments/${id}`}>Apartment</Link>
          </Button>
        }
      />

      {phase === 'summary' ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Summary</CardTitle>
            <p className="text-sm text-muted-foreground">
              {missingRequired.length === 0
                ? 'All required questions have an answer.'
                : `${missingRequired.length} required question${missingRequired.length === 1 ? '' : 's'} still need an answer.`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingRequired.length > 0 ? (
              <ul className="space-y-2">
                {missingRequired.map((q) => (
                  <li key={q.id}>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-left font-normal"
                      onClick={() => {
                        const i = questionIndexInFlatList(flat, q.id)
                        if (i >= 0) {
                          setNoteExpanded(false)
                          setPhase('question')
                          setIndex(i)
                        }
                      }}
                    >
                      {q.label}
                      {q.required ? (
                        <span className="text-destructive"> *</span>
                      ) : null}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => goPrev()}>
                Back to last question
              </Button>
              <Button type="button" asChild>
                <Link to={`/apartments/${id}`}>Done</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Question {index + 1} / {flat.length}
              </Badge>
              {current?.required ? (
                <Badge variant="outline">Required</Badge>
              ) : null}
            </div>
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                  aria-label="Open sections menu"
                >
                  <List className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Sections</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Jump to section</SheetTitle>
                </SheetHeader>
                <ScrollArea className="mt-4 h-[55vh] pr-3">
                  <ul className="space-y-2">
                    {catProgress.map((c) => (
                      <li key={c.categoryId}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-between gap-3 py-3 text-left font-normal"
                          onClick={() => {
                            const i = firstQuestionIndexForCategory(
                              flat,
                              c.categoryId
                            )
                            if (i >= 0) {
                              void flushSave()
                              setNoteExpanded(false)
                              setIndex(i)
                              setDrawerOpen(false)
                            }
                          }}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {c.answered}/{c.total}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {current ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base leading-snug sm:text-lg">
                  {current.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AnswerField
                  question={current}
                  value={draft?.value ?? null}
                  note={draft?.note ?? null}
                  onValueChange={(v) => updateDraft(current.id, { value: v })}
                  onNoteChange={(n) => updateDraft(current.id, { note: n })}
                  noteExpanded={noteExpanded}
                  onToggleNote={() => setNoteExpanded((e) => !e)}
                  density="comfortable"
                />
              </CardContent>
            </Card>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => void goPrev()}
              disabled={index === 0}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Button>
            <Button
              type="button"
              className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
              onClick={() => void goNext()}
            >
              {index >= flat.length - 1 ? 'Finish' : 'Next'}
              {index < flat.length - 1 ? (
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              ) : null}
            </Button>
          </div>
        </>
      )}

      {phase === 'question' ? (
        <p className="text-center text-xs text-muted-foreground">
          Answers save automatically as you go.
        </p>
      ) : null}
    </section>
  )
}
