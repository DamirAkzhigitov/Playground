import { useQueries } from '@tanstack/react-query'
import { Check, MessageSquare, Printer, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
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
import { useApartments } from '@/hooks'
import { queryKeys } from '@/hooks/queryKeys'
import { apiRequest } from '@/lib/api'
import { formatCompareAnswerLabel, ratingBarRatio } from '@/lib/compareDisplay'
import { flattenActiveQuestions } from '@/lib/questions'
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

function rowKeyForCompare(question: Question): string {
  const k = question.stableKey?.trim()
  return k && k.length > 0 ? k : question.id
}

type CompareRowModel = {
  canonicalQuestion: Question
  questionIdsByColumn: (string | null)[]
}

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

export function ComparePage() {
  const apartmentsQuery = useApartments()
  /** `null` means every apartment in `list` is selected (default). */
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(
    null
  )

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

  const questionsQueries = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: [
        ...queryKeys.questions,
        { includeArchived: false, apartmentId: id }
      ],
      queryFn: () =>
        apiRequest<QuestionGroup[]>(
          `/api/questions?${new URLSearchParams({
            includeArchived: 'false',
            apartmentId: id
          }).toString()}`
        ),
      enabled: selectedIds.length > 0,
      staleTime: 60_000
    }))
  })

  const compareRows = useMemo((): CompareRowModel[] => {
    if (selectedIds.length === 0) {
      return []
    }
    const flats = selectedIds.map((_, i) => {
      const data = questionsQueries[i]?.data ?? EMPTY_GROUPS
      return flattenActiveQuestions(data)
    })
    const orderedKeys: string[] = []
    const canonical = new Map<string, Question>()
    for (const q of flats[0] ?? []) {
      const k = rowKeyForCompare(q)
      if (!canonical.has(k)) {
        orderedKeys.push(k)
        canonical.set(k, q)
      }
    }
    for (let c = 1; c < flats.length; c++) {
      for (const q of flats[c] ?? []) {
        const k = rowKeyForCompare(q)
        if (!canonical.has(k)) {
          orderedKeys.push(k)
          canonical.set(k, q)
        }
      }
    }
    return orderedKeys.map((k) => {
      const cq = canonical.get(k)
      if (!cq) {
        throw new Error('compare row key missing canonical question')
      }
      return {
        canonicalQuestion: cq,
        questionIdsByColumn: flats.map(
          (flat) => flat.find((q) => rowKeyForCompare(q) === k)?.id ?? null
        )
      }
    })
  }, [selectedIds, questionsQueries])

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

  /** Preserves selection order; `mapIndex` indexes into `answerMaps` / `detailQueries`. */
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

  const isLoadingQuestions =
    selectedIds.length > 0 && questionsQueries.some((q) => q.isPending)
  const hasQuestionsError = questionsQueries.some((q) => q.isError)

  const printDisabled =
    apartmentsQuery.isPending ||
    apartmentsQuery.isError ||
    isLoadingQuestions ||
    hasQuestionsError ||
    selectedIds.length === 0 ||
    isLoadingDetails ||
    hasDetailError

  return (
    <section className="compare-print pb-page-pinned space-y-4">
      {apartmentsQuery.isPending ? (
        <div className="compare-print-screen-only">
          <LoadingState label="Loading listings…" />
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
              No listings yet.
            </p>
          ) : (
            <div className="compare-print-screen-only">
              <Label htmlFor="compare-apartments-select" className="sr-only">
                Listings to compare
              </Label>
              <Select
                value={compareSelectValue}
                onValueChange={handleCompareSelectChange}
              >
                <SelectTrigger
                  id="compare-apartments-select"
                  className="h-auto min-h-11 w-full py-2 whitespace-normal"
                  aria-label="Listings to compare"
                >
                  <SelectValue placeholder="Choose listings" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                >
                  <SelectItem value={COMPARE_ALL_VALUE}>
                    All listings
                  </SelectItem>
                  {compareSelectValue === COMPARE_MULTI_VALUE ? (
                    <SelectItem
                      value={COMPARE_MULTI_VALUE}
                      disabled
                      className="text-muted-foreground"
                    >
                      {selectedIds.length} of {list.length} listings
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
                    None selected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingQuestions ? (
            <div className="compare-print-screen-only">
              <LoadingState label="Loading questions…" />
            </div>
          ) : null}
          {hasQuestionsError ? (
            <div className="compare-print-screen-only">
              <ErrorState message="Could not load checklist for one or more listings." />
            </div>
          ) : null}

          {!isLoadingQuestions && !hasQuestionsError ? (
            <>
              {hasDetailError ? (
                <div className="compare-print-screen-only">
                  <ErrorState message="Could not load answers for one or more listings." />
                </div>
              ) : null}

              {selectedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground compare-print-screen-only">
                  No listings selected.
                </p>
              ) : isLoadingDetails ? (
                <div className="compare-print-screen-only">
                  <LoadingState label="Loading answers…" />
                </div>
              ) : (
                <div className="compare-print-viewport overflow-x-auto rounded-xl border border-border shadow-sm">
                  <div className="compare-print-scale w-max min-w-full">
                    <table className="compare-print-table w-max min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th
                            scope="col"
                            className="sticky left-0 top-0 z-30 min-w-[9rem] max-w-[12rem] border-r border-border bg-muted/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur sm:min-w-[11rem] sm:max-w-[16rem]"
                          >
                            Question
                          </th>
                          {comparisonColumns.map(({ apt }) => (
                            <th
                              key={apt.id}
                              scope="col"
                              className="sticky top-0 z-20 min-w-[9.5rem] max-w-[11rem] bg-muted/95 px-3 py-3 text-xs font-semibold text-foreground backdrop-blur"
                            >
                              <span className="line-clamp-2">{apt.title}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {compareRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={comparisonColumns.length + 1}
                              className="px-3 py-6 text-center text-muted-foreground"
                            >
                              No questions in scope for the selected listings.
                            </td>
                          </tr>
                        ) : (
                          compareRows.map((row) => (
                            <CompareRow
                              key={rowKeyForCompare(row.canonicalQuestion)}
                              row={row}
                              columns={comparisonColumns}
                              answerMaps={answerMaps}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </>
      ) : null}

      {!apartmentsQuery.isPending && !apartmentsQuery.isError ? (
        <PinnedActionBar className="compare-print-screen-only">
          <Button
            type="button"
            className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"
            disabled={printDisabled}
            onClick={() => window.print()}
          >
            <Printer className="size-4 shrink-0" aria-hidden />
            Print
          </Button>
        </PinnedActionBar>
      ) : null}
    </section>
  )
}

type CompareRowProps = {
  row: CompareRowModel
  columns: Array<{ apt: Apartment; mapIndex: number }>
  answerMaps: Array<Map<string, AnswerCell>>
}

function CompareRow({ row, columns, answerMaps }: CompareRowProps) {
  const question = row.canonicalQuestion
  return (
    <tr className="border-b border-border last:border-b-0">
      <th
        scope="row"
        className="sticky left-0 z-20 max-w-[9rem] border-r border-border bg-background px-3 py-3 align-center text-xs font-normal text-foreground sm:max-w-[16rem] sm:text-sm"
      >
        <div className="line-clamp-3 font-medium leading-snug">
          {question.label}
        </div>
      </th>
      {columns.map(({ apt, mapIndex }) => {
        const qid = row.questionIdsByColumn[mapIndex] ?? null
        const map = answerMaps[mapIndex] ?? new Map<string, AnswerCell>()
        const cell = qid ? map.get(qid) : undefined
        const value = cell?.value ?? null
        const note = cell?.note ?? null
        const label = formatCompareAnswerLabel(question, value)
        const titleParts = [label]
        if (note?.trim()) {
          titleParts.push(`Note: ${note.trim()}`)
        }
        const title = titleParts.join(' · ')

        return (
          <td key={apt.id} className="max-w-[11rem] px-2 py-2 align-top">
            <CompareCell
              question={question}
              value={value}
              note={note}
              label={label}
              title={title}
            />
          </td>
        )
      })}
    </tr>
  )
}

type CompareCellProps = {
  question: Question
  value: string | null
  note: string | null
  label: string
  title: string
}

function CompareCell({
  question,
  value,
  note,
  label,
  title
}: CompareCellProps) {
  const ratio = ratingBarRatio(question, value)
  const showNote = Boolean(note?.trim())

  const shell = (inner: ReactNode) => (
    <div
      className="compare-print-cell-shell flex min-h-11 flex-col justify-center gap-1 rounded-md border border-border bg-card px-2 py-2"
      title={title}
    >
      {inner}
      {question.type === 'rating' && ratio !== null ? (
        <div
          className="compare-print-rating-track h-1.5 w-full overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      ) : null}
      {showNote ? (
        <span className="compare-print-note-indicator inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageSquare className="size-3 shrink-0" aria-hidden />
          <span className="sr-only">Has note</span>
          <span className="truncate" title={note ?? undefined}>
            Note
          </span>
        </span>
      ) : null}
    </div>
  )

  if (question.type === 'boolean') {
    if (value === 'true') {
      return shell(
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Check className="size-4 shrink-0" aria-hidden />
          <span>Yes</span>
          <span className="sr-only">{title}</span>
        </span>
      )
    }
    if (value === 'false') {
      return shell(
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
          <X className="size-4 shrink-0" aria-hidden />
          <span>No</span>
          <span className="sr-only">{title}</span>
        </span>
      )
    }
    return shell(
      <span className="text-sm text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">No answer</span>
      </span>
    )
  }

  if (question.type === 'rating' && ratio !== null) {
    return shell(
      <span className="text-base font-semibold tabular-nums text-foreground">
        {label}
      </span>
    )
  }

  return shell(
    <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-snug text-foreground">
      {label}
    </p>
  )
}
