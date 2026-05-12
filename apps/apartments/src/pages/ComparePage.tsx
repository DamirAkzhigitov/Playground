import { useQueries } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MessageSquare, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useI18n } from '@/contexts/I18nContext'
import type { MessageId } from '@/i18n/messages'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useApartments, useQuestions } from '@/hooks'
import { queryKeys } from '@/hooks/queryKeys'
import { apiRequest } from '@/lib/api'
import {
  answerStrengthRatio,
  formatCompareAnswerLabel,
  numberMinMaxAcrossValues,
  type CompareBooleanLabels
} from '@/lib/compareDisplay'
import { categoryNameById, flattenActiveQuestions } from '@/lib/questions'
import type {
  Apartment,
  ApartmentDetail,
  Question,
  QuestionGroup
} from '@/types'

const EMPTY_GROUPS: QuestionGroup[] = []

const COMPARE_ALL_VALUE = '__all__'
const COMPARE_NONE_VALUE = '__none__'
const COMPARE_MULTI_VALUE = '__multi__'

type AnswerCell = { value: string | null; note: string | null }

function buildAnswerMap(
  detail: ApartmentDetail | undefined
): Map<string, AnswerCell> {
  const map = new Map<string, AnswerCell>()
  if (!detail?.answers) {
    return map
  }
  for (const a of detail.answers) {
    map.set(a.questionId, { value: a.value, note: a.note })
  }
  return map
}

type RankRow = { apt: Apartment; mapIndex: number; score: number }

type CompareWizardShellProps = {
  flatAll: Question[]
  answerMaps: Array<Map<string, AnswerCell>>
  comparisonColumns: Array<{ apt: Apartment; mapIndex: number }>
  categoryNames: Map<string, string>
  boolLabels: CompareBooleanLabels
  rankings: RankRow[]
  printDisabled: boolean
  t: (id: MessageId, vars?: Record<string, string | number>) => string
}

function CompareWizardShell({
  flatAll,
  answerMaps,
  comparisonColumns,
  categoryNames,
  boolLabels,
  rankings,
  printDisabled,
  t
}: CompareWizardShellProps) {
  const [compareStep, setCompareStep] = useState(0)

  const sortedColumnsForQuestion = useMemo(() => {
    return [...comparisonColumns].sort((a, b) =>
      a.apt.title.localeCompare(b.apt.title, undefined, { sensitivity: 'base' })
    )
  }, [comparisonColumns])

  const isResultsStep = compareStep >= flatAll.length
  const currentQuestion =
    compareStep < flatAll.length ? flatAll[compareStep] : null

  const currentNumberRange = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== 'number') {
      return null
    }
    const values = answerMaps.map(
      (m) => m.get(currentQuestion.id)?.value ?? null
    )
    return numberMinMaxAcrossValues(values)
  }, [answerMaps, currentQuestion])

  return (
    <>
      {currentQuestion ? (
        <div className="compare-print-viewport overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="compare-print-scale space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="tabular-nums">
                {t('compare.questionProgress', {
                  current: compareStep + 1,
                  total: flatAll.length
                })}
              </Badge>
            </div>
            {categoryNames.get(currentQuestion.categoryId) ? (
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {categoryNames.get(currentQuestion.categoryId)}
              </p>
            ) : null}
            <h2 className="text-base font-semibold leading-snug text-foreground">
              {currentQuestion.label}
            </h2>
            <ul className="compare-print-wizard-list space-y-3">
              {sortedColumnsForQuestion.map(({ apt, mapIndex }) => {
                const map =
                  answerMaps[mapIndex] ?? new Map<string, AnswerCell>()
                const cell = map.get(currentQuestion.id)
                const value = cell?.value ?? null
                const note = cell?.note ?? null
                const label = formatCompareAnswerLabel(
                  currentQuestion,
                  value,
                  boolLabels
                )
                const ratio = answerStrengthRatio(
                  currentQuestion,
                  value,
                  currentNumberRange
                )
                const pct = Math.round(ratio * 100)
                const titleParts = [label]
                if (note?.trim()) {
                  titleParts.push(`${t('common.note')}: ${note.trim()}`)
                }
                const title = titleParts.join(' · ')
                const showNote = Boolean(note?.trim())
                return (
                  <li
                    key={apt.id}
                    className="compare-print-wizard-row rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {apt.title}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="compare-print-rating-track mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={t('compare.answerStrength', {
                        percent: pct
                      })}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground">
                      {showNote ? (
                        <MessageSquare
                          className="size-3.5 shrink-0"
                          aria-hidden
                        />
                      ) : null}
                      <span className="min-w-0 truncate" title={title}>
                        {label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : isResultsStep ? (
        <div className="compare-print-viewport overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="compare-print-scale space-y-3 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-foreground">
              {t('compare.resultsTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('compare.resultsDescription')}
            </p>
            <ol className="compare-print-wizard-list m-0 list-decimal space-y-3 p-0 pl-5 marker:text-muted-foreground">
              {rankings.map(({ apt, score }) => {
                const pct = Math.round(score * 100)
                return (
                  <li
                    key={apt.id}
                    className="compare-print-wizard-row rounded-lg border border-border bg-card px-3 py-3 pl-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {apt.title}
                      </span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {t('compare.totalScore', { percent: pct })}
                      </span>
                    </div>
                    <div
                      className="compare-print-rating-track mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={t('compare.totalScore', {
                        percent: pct
                      })}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      ) : null}

      <PinnedActionBar className="compare-print-screen-only">
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full gap-2">
            {isResultsStep ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 gap-1"
                  onClick={() =>
                    setCompareStep(Math.max(0, flatAll.length - 1))
                  }
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  {t('compare.backToQuestions')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1"
                  onClick={() => setCompareStep(0)}
                >
                  {t('compare.restartWalk')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 gap-1"
                  disabled={compareStep <= 0}
                  onClick={() => setCompareStep((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  {t('common.previous')}
                </Button>
                <Button
                  type="button"
                  className="min-h-11 flex-1 gap-1"
                  onClick={() =>
                    setCompareStep((s) => (s < flatAll.length ? s + 1 : s))
                  }
                >
                  {compareStep >= flatAll.length - 1
                    ? t('compare.showResults')
                    : t('common.next')}
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Button>
              </>
            )}
          </div>
          <Button
            type="button"
            className="min-h-11 inline-flex w-full items-center justify-center gap-1"
            disabled={printDisabled}
            onClick={() => window.print()}
          >
            <Printer className="size-4 shrink-0" aria-hidden />
            {t('common.print')}
          </Button>
        </div>
      </PinnedActionBar>
    </>
  )
}

export function ComparePage() {
  const { t } = useI18n()
  const boolLabels: CompareBooleanLabels = useMemo(
    () => ({
      yes: t('common.yes'),
      no: t('common.no'),
      empty: '—'
    }),
    [t]
  )

  const apartmentsQuery = useApartments()
  const questionsQuery = useQuestions(false)
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(
    null
  )

  const groups = questionsQuery.data ?? EMPTY_GROUPS
  const flatAll = useMemo(() => flattenActiveQuestions(groups), [groups])
  const categoryNames = useMemo(() => categoryNameById(groups), [groups])

  const list = useMemo(() => apartmentsQuery.data ?? [], [apartmentsQuery.data])
  const allIds = useMemo(() => list.map((a) => a.id), [list])

  const selectedIds = useMemo(() => {
    if (allIds.length === 0) {
      return []
    }
    if (selectionOverride === null) {
      return allIds
    }
    return selectionOverride.filter((id) => allIds.includes(id))
  }, [allIds, selectionOverride])

  const walkResetKey = useMemo(
    () => `${selectedIds.join(',')}:${flatAll.map((q) => q.id).join(',')}`,
    [selectedIds, flatAll]
  )

  const normalizeToAllWhenComplete = (ids: string[]) => {
    if (
      ids.length === allIds.length &&
      allIds.every((id) => ids.includes(id))
    ) {
      return null
    }
    return ids
  }

  const compareSelectValue = useMemo(() => {
    if (list.length === 0) {
      return COMPARE_NONE_VALUE
    }
    if (selectedIds.length === 0) {
      return COMPARE_NONE_VALUE
    }
    if (
      selectedIds.length === list.length &&
      list.every((a) => selectedIds.includes(a.id))
    ) {
      return COMPARE_ALL_VALUE
    }
    if (selectedIds.length === 1) {
      return selectedIds[0]
    }
    return COMPARE_MULTI_VALUE
  }, [selectedIds, list])

  const handleCompareSelectChange = (value: string) => {
    if (value === COMPARE_MULTI_VALUE) {
      return
    }
    if (value === COMPARE_ALL_VALUE) {
      setSelectionOverride(null)
      return
    }
    if (value === COMPARE_NONE_VALUE) {
      setSelectionOverride([])
      return
    }
    setSelectionOverride((prevOverride) => {
      const current =
        prevOverride === null
          ? [...allIds]
          : prevOverride.filter((id) => allIds.includes(id))
      const isFull =
        allIds.length > 0 &&
        current.length === allIds.length &&
        allIds.every((id) => current.includes(id))
      if (isFull) {
        return normalizeToAllWhenComplete(allIds.filter((id) => id !== value))
      }
      if (current.includes(value)) {
        return normalizeToAllWhenComplete(current.filter((id) => id !== value))
      }
      const next = new Set([...current, value])
      return normalizeToAllWhenComplete(allIds.filter((id) => next.has(id)))
    })
  }

  const detailQueries = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: queryKeys.apartment(id),
      queryFn: () => apiRequest<ApartmentDetail>(`/api/apartments/${id}`),
      staleTime: 60_000
    }))
  })

  const answerMaps = useMemo(() => {
    return selectedIds.map((id, i) => {
      const q = detailQueries[i]
      const data = q?.data
      if (!data || data.id !== id) {
        return new Map<string, AnswerCell>()
      }
      return buildAnswerMap(data)
    })
  }, [detailQueries, selectedIds])

  const comparisonColumns = useMemo(() => {
    return selectedIds
      .map((id, mapIndex) => {
        const apt = list.find((a) => a.id === id)
        if (!apt) {
          return null
        }
        return { apt, mapIndex }
      })
      .filter((x): x is { apt: Apartment; mapIndex: number } => x !== null)
  }, [list, selectedIds])

  const isLoadingDetails =
    selectedIds.length > 0 && detailQueries.some((q) => q.isPending)

  const hasDetailError = detailQueries.some((q) => q.isError)

  const numberRangesByQuestionId = useMemo(() => {
    const m = new Map<string, { min: number; max: number } | null>()
    for (const q of flatAll) {
      if (q.type !== 'number') {
        continue
      }
      const values = answerMaps.map((am) => am.get(q.id)?.value ?? null)
      m.set(q.id, numberMinMaxAcrossValues(values))
    }
    return m
  }, [flatAll, answerMaps])

  const rankings = useMemo((): RankRow[] => {
    if (flatAll.length === 0) {
      return []
    }
    const rows: RankRow[] = comparisonColumns.map(({ apt, mapIndex }) => {
      const map = answerMaps[mapIndex] ?? new Map<string, AnswerCell>()
      let sum = 0
      for (const q of flatAll) {
        const v = map.get(q.id)?.value ?? null
        const nr =
          q.type === 'number'
            ? (numberRangesByQuestionId.get(q.id) ?? null)
            : null
        sum += answerStrengthRatio(q, v, nr)
      }
      return { apt, mapIndex, score: sum / flatAll.length }
    })
    return rows.sort(
      (a, b) =>
        b.score - a.score ||
        a.apt.title.localeCompare(b.apt.title, undefined, {
          sensitivity: 'base'
        })
    )
  }, [answerMaps, comparisonColumns, flatAll, numberRangesByQuestionId])

  const showWalk =
    selectedIds.length > 0 &&
    !isLoadingDetails &&
    !hasDetailError &&
    flatAll.length > 0

  const printDisabled =
    apartmentsQuery.isPending ||
    apartmentsQuery.isError ||
    questionsQuery.isPending ||
    questionsQuery.isError ||
    selectedIds.length === 0 ||
    isLoadingDetails ||
    hasDetailError

  return (
    <section className="compare-print pb-page-pinned space-y-4">
      {apartmentsQuery.isPending ? (
        <div className="compare-print-screen-only">
          <LoadingState label={t('compare.loadingApts')} />
        </div>
      ) : null}
      {apartmentsQuery.isError ? (
        <div className="compare-print-screen-only">
          <ErrorState message={apartmentsQuery.error.message} />
        </div>
      ) : null}

      {!apartmentsQuery.isPending && !apartmentsQuery.isError ? (
        <>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground compare-print-screen-only">
              {t('compare.noApts')}
            </p>
          ) : (
            <div className="compare-print-screen-only">
              <Label htmlFor="compare-apartments-select" className="sr-only">
                {t('compare.selectLabel')}
              </Label>
              <Select
                value={compareSelectValue}
                onValueChange={handleCompareSelectChange}
              >
                <SelectTrigger
                  id="compare-apartments-select"
                  className="h-auto min-h-11 w-full py-2 whitespace-normal"
                  aria-label={t('compare.selectLabel')}
                >
                  <SelectValue placeholder={t('compare.choose')} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                >
                  <SelectItem value={COMPARE_ALL_VALUE}>
                    {t('compare.all')}
                  </SelectItem>
                  {compareSelectValue === COMPARE_MULTI_VALUE ? (
                    <SelectItem
                      value={COMPARE_MULTI_VALUE}
                      disabled
                      className="text-muted-foreground"
                    >
                      {t('compare.multi', {
                        selected: selectedIds.length,
                        total: list.length
                      })}
                    </SelectItem>
                  ) : null}
                  <SelectSeparator />
                  {list.map((apt) => (
                    <SelectItem
                      key={apt.id}
                      value={apt.id}
                      textValue={`${apt.title} ${apt.address ?? ''}`}
                    >
                      <span className="line-clamp-2 text-left">
                        {apt.title}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={COMPARE_NONE_VALUE}>
                    {t('compare.none')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {questionsQuery.isPending ? (
            <div className="compare-print-screen-only">
              <LoadingState label={t('compare.loadingQs')} />
            </div>
          ) : null}
          {questionsQuery.isError ? (
            <div className="compare-print-screen-only">
              <ErrorState message={questionsQuery.error.message} />
            </div>
          ) : null}

          {!questionsQuery.isPending && !questionsQuery.isError ? (
            <>
              {hasDetailError ? (
                <div className="compare-print-screen-only">
                  <ErrorState message={t('compare.loadFailed')} />
                </div>
              ) : null}

              {selectedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground compare-print-screen-only">
                  {t('compare.noneSelected')}
                </p>
              ) : isLoadingDetails ? (
                <div className="compare-print-screen-only">
                  <LoadingState label={t('compare.loadingAnswers')} />
                </div>
              ) : flatAll.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('compare.noQuestions')}
                </p>
              ) : showWalk ? (
                <CompareWizardShell
                  key={walkResetKey}
                  flatAll={flatAll}
                  answerMaps={answerMaps}
                  comparisonColumns={comparisonColumns}
                  categoryNames={categoryNames}
                  boolLabels={boolLabels}
                  rankings={rankings}
                  printDisabled={printDisabled}
                  t={t}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {!apartmentsQuery.isPending && !apartmentsQuery.isError ? (
        showWalk ? null : (
          <PinnedActionBar className="compare-print-screen-only">
            <Button
              type="button"
              className="min-h-11 inline-flex w-full flex-1 items-center justify-center gap-1"
              disabled={printDisabled}
              onClick={() => window.print()}
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              {t('common.print')}
            </Button>
          </PinnedActionBar>
        )
      ) : null}
    </section>
  )
}
