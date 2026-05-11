import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
import { AnswerField } from '@/components/AnswerField'
import { QuestionPhotosSection } from '@/components/QuestionPhotosSection'
import { ErrorState } from '@/components/ErrorState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
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
import { cn } from '@/lib/utils'
import {
  type AnswerDraft,
  buildAnswerDraftMap,
  firstQuestionIndexForCategory,
  firstUnfilledQuestionIndex,
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
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
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
  const [isNavBusy, setIsNavBusy] = useState(false)
  const seededRef = useRef(false)
  const navBusyRef = useRef(false)

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
    const gr = questionsQuery.data ?? EMPTY_GROUPS
    const flatList = flattenActiveQuestions(gr)
    if (!id || flatList.length === 0) {
      return
    }
    const apt = apartmentQuery.data
    const resume = new URLSearchParams(location.search).get('resume') === '1'
    if (resume && apt && questionsQuery.data) {
      const drafts = buildAnswerDraftMap(questionsQuery.data, apt.answers)
      setIndex(firstUnfilledQuestionIndex(flatList, drafts))
      setPhase('question')
      try {
        sessionStorage.removeItem(sessionIndexKey(id))
        sessionStorage.removeItem(sessionPhaseKey(id))
      } catch {
        /* ignore */
      }
      navigate({ pathname: location.pathname, search: '' }, { replace: true })
      return
    }
    if (resume) {
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
      if (!Number.isNaN(n) && n >= 0 && n < flatList.length) {
        setIndex(n)
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    apartmentQuery.data,
    flat.length,
    id,
    location.pathname,
    location.search,
    navigate,
    questionsQuery.data
  ])

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
          toast.error(e instanceof Error ? e.message : t('errors.saveAnswer'))
        }
        return { ...prev, [questionId]: next }
      })
    },
    [id, queueSave, t]
  )

  const goNext = useCallback(async () => {
    if (!current || navBusyRef.current) {
      return
    }
    navBusyRef.current = true
    setIsNavBusy(true)
    try {
      await flushSave()
      setNoteExpanded(false)
      if (index >= flat.length - 1) {
        setPhase('summary')
        return
      }
      setIndex((i) => i + 1)
    } finally {
      navBusyRef.current = false
      setIsNavBusy(false)
    }
  }, [current, flushSave, index, flat.length])

  const goPrev = useCallback(async () => {
    if (navBusyRef.current) {
      return
    }
    navBusyRef.current = true
    setIsNavBusy(true)
    try {
      await flushSave()
      setNoteExpanded(false)
      if (phase === 'summary') {
        setPhase('question')
        setIndex(Math.max(0, flat.length - 1))
        return
      }
      setIndex((i) => Math.max(0, i - 1))
    } finally {
      navBusyRef.current = false
      setIsNavBusy(false)
    }
  }, [flushSave, phase, flat.length])

  const goBackToApartment = useCallback(async () => {
    if (!id || navBusyRef.current) {
      return
    }
    navBusyRef.current = true
    setIsNavBusy(true)
    try {
      await flushSave()
      setNoteExpanded(false)
      navigate(`/apartments/${id}`)
    } finally {
      navBusyRef.current = false
      setIsNavBusy(false)
    }
  }, [flushSave, id, navigate])

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
    return <LoadingState label={t('inspection.loading')} />
  }
  if (isErr) {
    return <ErrorState message={errMsg ?? t('errors.generic')} />
  }
  if (!id || !apartmentQuery.data) {
    return <ErrorState message={t('errors.notFound')} />
  }
  if (flat.length === 0) {
    return (
      <section className="space-y-4">
        <PageHeader
          title={t('inspection.title')}
          description={apartmentQuery.data.title}
        />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t('inspection.noQuestionsBody')}
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'flex flex-col gap-4',
        phase === 'question' &&
          'h-[calc(100dvh_-_var(--global-header-height)_-_8rem)] min-h-0 overflow-hidden'
      )}
    >
      <PageHeader
        className="shrink-0"
        title={t('inspection.title')}
        description={apartmentQuery.data.title}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/apartments/${id}`}>{t('inspection.apartment')}</Link>
          </Button>
        }
      />

      {phase === 'summary' ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">{t('inspection.summary')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {missingRequired.length === 0
                ? t('inspection.summaryDone')
                : t('inspection.summaryMissing', {
                    n: missingRequired.length
                  })}
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
              <Button
                type="button"
                variant="outline"
                disabled={isNavBusy}
                onClick={() => void goPrev()}
              >
                {t('inspection.backToLast')}
              </Button>
              <Button type="button" asChild>
                <Link to={`/apartments/${id}`}>{t('common.done')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t('inspection.questionBadge', {
                  current: index + 1,
                  total: flat.length
                })}
              </Badge>
              {current?.required ? (
                <Badge variant="outline">{t('common.required')}</Badge>
              ) : null}
            </div>
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                  aria-label={t('inspection.openSections')}
                >
                  <List className="size-4" aria-hidden />
                  <span className="hidden sm:inline">
                    {t('common.sections')}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh]">
                <SheetHeader>
                  <SheetTitle>{t('inspection.jumpTo')}</SheetTitle>
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

          <div className="min-h-0 flex-1 overflow-y-auto pb-page-pinned">
            {current ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base leading-snug sm:text-lg">
                    {current.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <QuestionPhotosSection
                    apartmentId={id}
                    questionId={current.id}
                    questionLabel={current.label}
                    allPhotos={apartmentQuery.data.photos}
                    density="comfortable"
                  />
                </CardContent>
              </Card>
            ) : null}
            <p className="pt-3 text-center text-xs text-muted-foreground">
              {t('inspection.autosave')}
            </p>
          </div>

          <PinnedActionBar>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() =>
                void (index === 0 ? goBackToApartment() : goPrev())
              }
              disabled={isNavBusy || upsert.isPending}
            >
              <ChevronLeft className="size-4" aria-hidden />
              {index === 0 ? t('common.back') : t('common.previous')}
            </Button>
            <Button
              type="button"
              className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
              disabled={isNavBusy || upsert.isPending}
              onClick={() => void goNext()}
            >
              {index >= flat.length - 1 ? t('common.finish') : t('common.next')}
              {index < flat.length - 1 ? (
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              ) : null}
            </Button>
          </PinnedActionBar>
        </div>
      )}
    </section>
  )
}
