import { useQueries } from '@tanstack/react-query'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
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
import { useListings, useQuestions } from '@/hooks'
import { queryKeys } from '@/hooks/queryKeys'
import { apiRequest } from '@/lib/api'
import {
  answerStrengthRatio,
  dateMinMaxAcrossValues,
  formatCompareAnswerLabel,
  numberMinMaxAcrossValues,
  type CompareBooleanLabels
} from '@/lib/compareDisplay'
import { cn } from '@/lib/utils'
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
  walkActionsDisabled: boolean
  t: (id: MessageId, vars?: Record<string, string | number>) => string
}

/** Filled portion clips a track-wide red → brand gradient so low scores read as mostly red. */
function CompareStrengthBar({
  pct,
  className,
  'aria-valuenow': ariaValueNow,
  'aria-label': ariaLabel
}: {
  pct: number
  className?: string
  'aria-valuenow': number
  'aria-label': string
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-muted',
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaValueNow}
      aria-label={ariaLabel}
    >
      {pct > 0 ? (
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-destructive to-primary"
            style={{ width: `${(100 / pct) * 100}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function CompareWizardShell({
  flatAll,
  answerMaps,
  comparisonColumns,
  categoryNames,
  boolLabels,
  rankings,
  walkActionsDisabled,
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

  const currentScalarRange = useMemo(() => {
    if (!currentQuestion) {
      return null
    }
    const values = answerMaps.map(
      (m) => m.get(currentQuestion.id)?.value ?? null
    )
    if (currentQuestion.type === 'number') {
      return numberMinMaxAcrossValues(values)
    }
    if (currentQuestion.type === 'date') {
      return dateMinMaxAcrossValues(values)
    }
    return null
  }, [answerMaps, currentQuestion])

  return (
    <>
      {currentQuestion ? (
        <div className="overflow-hidden">
          <div className="space-y-4 sm:p-5">
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
            <ul className="space-y-3">
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
                  currentScalarRange
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
                    className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {apt.title}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <CompareStrengthBar
                      className="mt-2 h-2"
                      pct={pct}
                      aria-valuenow={pct}
                      aria-label={t('compare.answerStrength', {
                        percent: pct
                      })}
                    />
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
        <div className="overflow-hidden">
          <div className="space-y-3 sm:p-5">
            <h2 className="text-lg font-semibold text-foreground">
              {t('compare.resultsTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('compare.resultsDescription')}
            </p>
            <ul className="m-0 space-y-3 p-0 marker:text-muted-foreground">
              {rankings.map(({ apt, score }) => {
                const pct = Math.round(score * 100)
                return (
                  <li
                    key={apt.id}
                    className="rounded-lg border border-border bg-card px-3 py-3 pl-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {apt.title}
                      </span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {t('compare.totalScore', { percent: pct })}
                      </span>
                    </div>
                    <CompareStrengthBar
                      className="mt-2 h-2.5"
                      pct={pct}
                      aria-valuenow={pct}
                      aria-label={t('compare.totalScore', {
                        percent: pct
                      })}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <PinnedActionBar>
        <div className="flex w-full flex-col gap-2">
          {!isResultsStep ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 inline-flex w-full items-center justify-center gap-1"
              disabled={walkActionsDisabled}
              onClick={() => setCompareStep(flatAll.length)}
            >
              <BarChart3 className="size-4 shrink-0" aria-hidden />
              {t('compare.viewResults')}
            </Button>
          ) : null}
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

  const listingsQuery = useListings()
  const questionsQuery = useQuestions(false)
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(
    null
  )

  const groups = questionsQuery.data ?? EMPTY_GROUPS
  const flatAll = useMemo(() => flattenActiveQuestions(groups), [groups])
  const categoryNames = useMemo(() => categoryNameById(groups), [groups])

  const list = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data])
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
      queryKey: queryKeys.listing(id),
      queryFn: () => apiRequest<ApartmentDetail>(`/api/listings/${id}`),
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

  const scalarRangesByQuestionId = useMemo(() => {
    const m = new Map<string, { min: number; max: number } | null>()
    for (const q of flatAll) {
      if (q.type !== 'number' && q.type !== 'date') {
        continue
      }
      const values = answerMaps.map((am) => am.get(q.id)?.value ?? null)
      m.set(
        q.id,
        q.type === 'number'
          ? numberMinMaxAcrossValues(values)
          : dateMinMaxAcrossValues(values)
      )
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
        const scalarRange =
          q.type === 'number' || q.type === 'date'
            ? (scalarRangesByQuestionId.get(q.id) ?? null)
            : null
        sum += answerStrengthRatio(q, v, scalarRange)
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
  }, [answerMaps, comparisonColumns, flatAll, scalarRangesByQuestionId])

  const showWalk =
    selectedIds.length > 0 &&
    !isLoadingDetails &&
    !hasDetailError &&
    flatAll.length > 0

  const walkActionsDisabled =
    listingsQuery.isPending ||
    listingsQuery.isError ||
    questionsQuery.isPending ||
    questionsQuery.isError ||
    selectedIds.length === 0 ||
    isLoadingDetails ||
    hasDetailError

  return (
    <section className="pb-page-pinned space-y-4">
      {listingsQuery.isPending ? (
        <div>
          <LoadingState label={t('compare.loadingApts')} />
        </div>
      ) : null}
      {listingsQuery.isError ? (
        <div>
          <ErrorState message={listingsQuery.error.message} />
        </div>
      ) : null}

      {!listingsQuery.isPending && !listingsQuery.isError ? (
        <>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('compare.noApts')}
            </p>
          ) : (
            <div>
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
            <div>
              <LoadingState label={t('compare.loadingQs')} />
            </div>
          ) : null}
          {questionsQuery.isError ? (
            <div>
              <ErrorState message={questionsQuery.error.message} />
            </div>
          ) : null}

          {!questionsQuery.isPending && !questionsQuery.isError ? (
            <>
              {hasDetailError ? (
                <div>
                  <ErrorState message={t('compare.loadFailed')} />
                </div>
              ) : null}

              {selectedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('compare.noneSelected')}
                </p>
              ) : isLoadingDetails ? (
                <div>
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
                  walkActionsDisabled={walkActionsDisabled}
                  t={t}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
