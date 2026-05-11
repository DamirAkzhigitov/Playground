import { isAnswerValueFilled, parseMultiSelect } from '@/lib/answerValue'
import type { Question } from '@/types'

/** Sentinel for missing / empty answers in comparison keys. */
export const COMPARE_EMPTY = '__empty__'

export function normalizeAnswerForCompare(
  question: Question,
  value: string | null | undefined
): string {
  if (!isAnswerValueFilled(question.type, value)) {
    return COMPARE_EMPTY
  }
  const v = value as string
  switch (question.type) {
    case 'boolean':
      return v === 'true' ? 'true' : v === 'false' ? 'false' : COMPARE_EMPTY
    case 'number': {
      const n = Number(v)
      return Number.isFinite(n) ? String(n) : COMPARE_EMPTY
    }
    case 'text':
      return v.trim().replace(/\s+/g, ' ')
    case 'select':
      return v
    case 'multi-select': {
      const arr = parseMultiSelect(v).slice().sort()
      return JSON.stringify(arr)
    }
    case 'rating': {
      const n = Number(v)
      return Number.isFinite(n) ? String(n) : COMPARE_EMPTY
    }
    default:
      return v.trim()
  }
}

export type CompareBooleanLabels = {
  yes: string
  no: string
  empty: string
}

export function formatCompareAnswerLabel(
  question: Question,
  value: string | null | undefined,
  boolLabels: CompareBooleanLabels = {
    yes: 'Yes',
    no: 'No',
    empty: '—'
  }
): string {
  if (!isAnswerValueFilled(question.type, value)) {
    return boolLabels.empty
  }
  const v = value as string
  switch (question.type) {
    case 'boolean':
      return v === 'true'
        ? boolLabels.yes
        : v === 'false'
          ? boolLabels.no
          : boolLabels.empty
    case 'number':
      return v
    case 'text':
      return v.trim() === '' ? boolLabels.empty : v.trim()
    case 'select': {
      const opt = question.options.find((o) => o.value === v)
      return opt?.label ?? v
    }
    case 'multi-select': {
      const values = parseMultiSelect(v)
      const labels = values
        .map(
          (val) => question.options.find((o) => o.value === val)?.label ?? val
        )
        .sort()
      return labels.length ? labels.join(', ') : boolLabels.empty
    }
    case 'rating': {
      const n = Number(v)
      return Number.isFinite(n) ? String(n) : boolLabels.empty
    }
    default:
      return v.trim() || boolLabels.empty
  }
}

/** 0–1 fill for rating bar; `null` if no rating. */
export function ratingBarRatio(
  question: Question,
  value: string | null | undefined
): number | null {
  if (question.type !== 'rating') {
    return null
  }
  if (!isAnswerValueFilled('rating', value)) {
    return null
  }
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return null
  }
  const min = question.ratingMin ?? 1
  const max = question.ratingMax ?? 5
  if (max <= min) {
    return 1
  }
  const clamped = Math.min(max, Math.max(min, n))
  return (clamped - min) / (max - min)
}
