import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useI18n } from '@/contexts/I18nContext'
import { PinnedActionBar } from '@/components/layout/PinnedActionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  answerStrengthRatio,
  dateMinMaxAcrossValues,
  formatCompareAnswerLabel,
  numberMinMaxAcrossValues,
  type CompareBooleanLabels
} from '@/lib/compareDisplay'
import { cn } from '@/lib/utils'
import { sectionNameById, flattenActiveSpecs } from '@/lib/specs'
import type { Item, Spec, SpecSection } from '@/types'

type AnswerCell = { value: string | null; note: string | null }

type CompareMatrixProps = {
  sections: SpecSection[]
  items: Array<{
    id: string
    title: string
    answers: Array<{
      specId: string
      value: string | null
      note: string | null
    }>
  }>
  showPinnedBar?: boolean
}

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

export function CompareMatrix({
  sections,
  items,
  showPinnedBar = true
}: CompareMatrixProps) {
  const { t } = useI18n()
  const [compareStep, setCompareStep] = useState(0)

  const boolLabels: CompareBooleanLabels = useMemo(
    () => ({
      yes: t('common.yes'),
      no: t('common.no'),
      empty: '—'
    }),
    [t]
  )

  const flatAll = useMemo(() => flattenActiveSpecs(sections), [sections])
  const sectionNames = useMemo(() => sectionNameById(sections), [sections])

  const answerMaps = useMemo(() => {
    return items.map((item) => {
      const map = new Map<string, AnswerCell>()
      for (const a of item.answers) {
        map.set(a.specId, { value: a.value, note: a.note })
      }
      return map
    })
  }, [items])

  const comparisonColumns = useMemo(
    () =>
      items.map((item, mapIndex) => ({
        item: { id: item.id, title: item.title } as Pick<Item, 'id' | 'title'>,
        mapIndex
      })),
    [items]
  )

  const scalarRangesBySpecId = useMemo(() => {
    const m = new Map<string, { min: number; max: number } | null>()
    for (const spec of flatAll) {
      if (spec.type !== 'number' && spec.type !== 'date') continue
      const values = answerMaps.map((am) => am.get(spec.id)?.value ?? null)
      m.set(
        spec.id,
        spec.type === 'number'
          ? numberMinMaxAcrossValues(values)
          : dateMinMaxAcrossValues(values)
      )
    }
    return m
  }, [flatAll, answerMaps])

  const rankings = useMemo(() => {
    if (flatAll.length === 0) return []
    return comparisonColumns
      .map(({ item, mapIndex }) => {
        const map = answerMaps[mapIndex] ?? new Map()
        let sum = 0
        for (const spec of flatAll) {
          const v = map.get(spec.id)?.value ?? null
          const scalarRange =
            spec.type === 'number' || spec.type === 'date'
              ? (scalarRangesBySpecId.get(spec.id) ?? null)
              : null
          sum += answerStrengthRatio(spec, v, scalarRange)
        }
        return { item, mapIndex, score: sum / flatAll.length }
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.item.title.localeCompare(b.item.title, undefined, {
            sensitivity: 'base'
          })
      )
  }, [answerMaps, comparisonColumns, flatAll, scalarRangesBySpecId])

  const isResultsStep = compareStep >= flatAll.length
  const currentSpec: Spec | null =
    compareStep < flatAll.length ? (flatAll[compareStep] ?? null) : null

  const currentScalarRange = useMemo(() => {
    if (!currentSpec) return null
    const values = answerMaps.map((m) => m.get(currentSpec.id)?.value ?? null)
    if (currentSpec.type === 'number') {
      return numberMinMaxAcrossValues(values)
    }
    if (currentSpec.type === 'date') {
      return dateMinMaxAcrossValues(values)
    }
    return null
  }, [answerMaps, currentSpec])

  const sortedColumns = useMemo(
    () =>
      [...comparisonColumns].sort((a, b) =>
        a.item.title.localeCompare(b.item.title, undefined, {
          sensitivity: 'base'
        })
      ),
    [comparisonColumns]
  )

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('compare.noItems')}</p>
    )
  }

  if (flatAll.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('compare.noQuestions')}
      </p>
    )
  }

  const wizard = (
    <>
      {currentSpec ? (
        <div className="space-y-4">
          <Badge variant="secondary" className="tabular-nums">
            {t('compare.questionProgress', {
              current: compareStep + 1,
              total: flatAll.length
            })}
          </Badge>
          {sectionNames.get(currentSpec.sectionId) ? (
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {sectionNames.get(currentSpec.sectionId)}
            </p>
          ) : null}
          <h2 className="text-base font-semibold leading-snug">
            {currentSpec.label}
          </h2>
          <ul className="space-y-3">
            {sortedColumns.map(({ item, mapIndex }) => {
              const map = answerMaps[mapIndex] ?? new Map()
              const cell = map.get(currentSpec.id)
              const value = cell?.value ?? null
              const note = cell?.note ?? null
              const label = formatCompareAnswerLabel(
                currentSpec,
                value,
                boolLabels
              )
              const ratio = answerStrengthRatio(
                currentSpec,
                value,
                currentScalarRange
              )
              const pct = Math.round(ratio * 100)
              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                  <CompareStrengthBar
                    className="mt-2 h-2"
                    pct={pct}
                    aria-valuenow={pct}
                    aria-label={t('compare.answerStrength', { percent: pct })}
                  />
                  <div className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground">
                    {note?.trim() ? (
                      <MessageSquare
                        className="size-3.5 shrink-0"
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 truncate">{label}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : isResultsStep ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('compare.resultsTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('compare.resultsDescription')}
          </p>
          <ul className="space-y-3">
            {rankings.map(({ item, score }) => {
              const pct = Math.round(score * 100)
              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {t('compare.totalScore', { percent: pct })}
                    </span>
                  </div>
                  <CompareStrengthBar
                    className="mt-2 h-2.5"
                    pct={pct}
                    aria-valuenow={pct}
                    aria-label={t('compare.totalScore', { percent: pct })}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </>
  )

  if (!showPinnedBar) {
    return wizard
  }

  return (
    <>
      {wizard}
      <PinnedActionBar>
        <div className="flex w-full flex-col gap-2">
          {!isResultsStep ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full gap-1"
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
