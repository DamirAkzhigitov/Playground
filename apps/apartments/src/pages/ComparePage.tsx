import { useQueries } from '@tanstack/react-query'
import { Check, MessageSquare, X } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApartments, useQuestions } from '@/hooks'
import { queryKeys } from '@/hooks/queryKeys'
import { apiRequest } from '@/lib/api'
import {
  formatCompareAnswerLabel,
  normalizeAnswerForCompare,
  ratingBarRatio
} from '@/lib/compareDisplay'
import { flattenActiveQuestions } from '@/lib/questions'
import { cn } from '@/lib/utils'
import type {
  Apartment,
  ApartmentDetail,
  Question,
  QuestionGroup
} from '@/types'

const EMPTY_GROUPS: QuestionGroup[] = []

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

export function ComparePage() {
  const apartmentsQuery = useApartments()
  const questionsQuery = useQuestions(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string>('all')
  const [highlightDiffs, setHighlightDiffs] = useState(true)

  const groups = questionsQuery.data ?? EMPTY_GROUPS
  const flatAll = useMemo(() => flattenActiveQuestions(groups), [groups])

  const categoryTabs = useMemo(() => {
    const sorted = [...groups].sort((a, b) => a.order - b.order)
    return sorted.map((g) => ({ id: g.id, name: g.name }))
  }, [groups])

  const flatFiltered = useMemo(() => {
    if (categoryId === 'all') {
      return flatAll
    }
    return flatAll.filter((q) => q.categoryId === categoryId)
  }, [categoryId, flatAll])

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
    const list = apartmentsQuery.data ?? []
    return selectedIds
      .map((id, mapIndex) => {
        const apt = list.find((a) => a.id === id)
        if (!apt) {
          return null
        }
        return { apt, mapIndex }
      })
      .filter((x): x is { apt: Apartment; mapIndex: number } => x !== null)
  }, [apartmentsQuery.data, selectedIds])

  const isLoadingDetails =
    selectedIds.length > 0 && detailQueries.some((q) => q.isPending)

  const hasDetailError = detailQueries.some((q) => q.isError)

  const toggleApartment = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) {
          return prev
        }
        return [...prev, id]
      }
      return prev.filter((x) => x !== id)
    })
  }, [])

  const list = apartmentsQuery.data ?? []

  return (
    <section className="space-y-6 pb-8">
      <PageHeader
        title="Compare Apartments"
        description="Pick apartments, then scan answers side by side. Swipe horizontally on small screens."
      />

      {apartmentsQuery.isPending ? (
        <LoadingState label="Loading apartments…" />
      ) : null}
      {apartmentsQuery.isError ? (
        <ErrorState message={apartmentsQuery.error.message} />
      ) : null}

      {!apartmentsQuery.isPending && !apartmentsQuery.isError ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select apartments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No apartments yet. Create one from the Apartments tab.
                </p>
              ) : (
                <ul className="max-h-60 space-y-2 overflow-y-auto pr-1 sm:max-h-72">
                  {list.map((apt) => {
                    const checked = selectedIds.includes(apt.id)
                    const boxId = `compare-apt-${apt.id}`
                    return (
                      <li key={apt.id}>
                        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                          <Checkbox
                            id={boxId}
                            checked={checked}
                            onCheckedChange={(c) =>
                              toggleApartment(apt.id, c === true)
                            }
                            className="mt-0.5"
                            aria-label={`Include ${apt.title} in comparison`}
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <Label
                              htmlFor={boxId}
                              className="cursor-pointer text-sm font-medium leading-snug"
                            >
                              {apt.title}
                            </Label>
                            {apt.address ? (
                              <p className="text-xs text-muted-foreground">
                                {apt.address}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {questionsQuery.isPending ? (
            <LoadingState label="Loading questions…" />
          ) : null}
          {questionsQuery.isError ? (
            <ErrorState message={questionsQuery.error.message} />
          ) : null}

          {!questionsQuery.isPending && !questionsQuery.isError ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Category</p>
                  <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1 sm:max-w-2xl">
                    <Tabs value={categoryId} onValueChange={setCategoryId}>
                      <TabsList
                        variant="line"
                        className="inline-flex h-auto w-max flex-nowrap justify-start gap-1 bg-transparent p-0"
                      >
                        <TabsTrigger value="all" className="shrink-0">
                          All
                        </TabsTrigger>
                        {categoryTabs.map((c) => (
                          <TabsTrigger
                            key={c.id}
                            value={c.id}
                            className="max-w-[10rem] shrink-0 truncate"
                            title={c.name}
                          >
                            {c.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <Switch
                    id="highlight-diffs"
                    checked={highlightDiffs}
                    onCheckedChange={(v) => setHighlightDiffs(v === true)}
                    disabled={comparisonColumns.length < 2}
                  />
                  <Label
                    htmlFor="highlight-diffs"
                    className={cn(
                      'cursor-pointer text-sm font-normal',
                      comparisonColumns.length < 2 && 'text-muted-foreground'
                    )}
                  >
                    Highlight differences
                  </Label>
                </div>
              </div>

              {hasDetailError ? (
                <ErrorState message="Could not load answers for one or more apartments." />
              ) : null}

              {selectedIds.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    Select at least one apartment to see the comparison table.
                  </CardContent>
                </Card>
              ) : isLoadingDetails ? (
                <LoadingState label="Loading answers…" />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                  <table className="w-max min-w-full border-collapse text-left text-sm">
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
                      {flatFiltered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={comparisonColumns.length + 1}
                            className="px-3 py-6 text-center text-muted-foreground"
                          >
                            No questions in this category.
                          </td>
                        </tr>
                      ) : (
                        flatFiltered.map((question) => (
                          <CompareRow
                            key={question.id}
                            question={question}
                            columns={comparisonColumns}
                            answerMaps={answerMaps}
                            highlightDiffs={
                              highlightDiffs && comparisonColumns.length >= 2
                            }
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

type CompareRowProps = {
  question: Question
  columns: Array<{ apt: Apartment; mapIndex: number }>
  answerMaps: Array<Map<string, AnswerCell>>
  highlightDiffs: boolean
}

function CompareRow({
  question,
  columns,
  answerMaps,
  highlightDiffs
}: CompareRowProps) {
  const keys = columns.map(({ mapIndex }) => {
    const map = answerMaps[mapIndex] ?? new Map<string, AnswerCell>()
    const cell = map.get(question.id)
    return normalizeAnswerForCompare(question, cell?.value)
  })
  const divergent = highlightDiffs && keys.length >= 2 && new Set(keys).size > 1

  return (
    <tr className="border-b border-border last:border-b-0">
      <th
        scope="row"
        className="sticky left-0 z-20 max-w-[12rem] border-r border-border bg-background px-3 py-3 align-top text-xs font-normal text-foreground sm:max-w-[16rem] sm:text-sm"
      >
        <div className="line-clamp-3 font-medium leading-snug">
          {question.label}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {question.type}
          </Badge>
          {question.required ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              Required
            </Badge>
          ) : null}
        </div>
      </th>
      {columns.map(({ apt, mapIndex }) => {
        const map = answerMaps[mapIndex] ?? new Map<string, AnswerCell>()
        const cell = map.get(question.id)
        const value = cell?.value ?? null
        const note = cell?.note ?? null
        const label = formatCompareAnswerLabel(question, value)
        const titleParts = [label]
        if (note?.trim()) {
          titleParts.push(`Note: ${note.trim()}`)
        }
        const title = titleParts.join(' · ')

        return (
          <td
            key={apt.id}
            className={cn(
              'max-w-[11rem] px-2 py-2 align-top',
              divergent && 'bg-accent/35'
            )}
          >
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
      className="flex min-h-11 flex-col justify-center gap-1 rounded-md border border-border bg-card px-2 py-2"
      title={title}
    >
      {inner}
      {question.type === 'rating' && ratio !== null ? (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      ) : null}
      {showNote ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
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
