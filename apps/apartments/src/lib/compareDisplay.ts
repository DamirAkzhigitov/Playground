import {
  formatIsoDateForDisplay,
  isAnswerValueFilled,
  isValidIsoDateString,
  parseMultiSelect
} from '@/lib/answerValue'
import type { Question, QuestionValuePreference } from '@/types'

function isoDateToUtcMs(iso: string): number {
  const parts = iso.trim().split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  return Date.UTC(y, m - 1, d)
}

function effectiveComparePreference(
  question: Question,
  kind: 'number' | 'date'
): QuestionValuePreference {
  if (
    question.valuePreference === 'higher' ||
    question.valuePreference === 'lower'
  ) {
    return question.valuePreference
  }
  return kind === 'number' ? 'higher' : 'lower'
}

/** 0–1 linear position in range; `preference` flips so “lower is better” maps small raw → high score. */
function scalarLinearStrength(
  n: number,
  range: { min: number; max: number },
  preference: QuestionValuePreference
): number {
  if (range.max <= range.min) {
    return 1
  }
  const clamped = Math.min(range.max, Math.max(range.min, n))
  const forward = (clamped - range.min) / (range.max - range.min)
  return preference === 'lower' ? 1 - forward : forward
}

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
    case 'date':
      return isValidIsoDateString(v) ? v.trim() : COMPARE_EMPTY
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
    case 'date':
      return formatIsoDateForDisplay(v)
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

/** Min/max of numeric answers (used to normalize number questions in compare). */
export function numberMinMaxAcrossValues(
  values: Array<string | null | undefined>
): { min: number; max: number } | null {
  const nums: number[] = []
  for (const v of values) {
    if (!isAnswerValueFilled('number', v)) {
      continue
    }
    const n = Number(v)
    if (Number.isFinite(n)) {
      nums.push(n)
    }
  }
  if (nums.length === 0) {
    return null
  }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

/** Min/max of valid ISO date answers as UTC ms (for compare normalization). */
export function dateMinMaxAcrossValues(
  values: Array<string | null | undefined>
): { min: number; max: number } | null {
  const nums: number[] = []
  for (const v of values) {
    if (!isAnswerValueFilled('date', v)) {
      continue
    }
    const s = String(v).trim()
    if (!isValidIsoDateString(s)) {
      continue
    }
    nums.push(isoDateToUtcMs(s))
  }
  if (nums.length === 0) {
    return null
  }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

/**
 * 0–1 strength for compare bars and aggregate scoring.
 * For `number` and `date`, pass min/max across the apartments being compared
 * (from {@link numberMinMaxAcrossValues} / {@link dateMinMaxAcrossValues}).
 */
export function answerStrengthRatio(
  question: Question,
  value: string | null | undefined,
  compareScalarRange: { min: number; max: number } | null
): number {
  if (question.type === 'rating') {
    return ratingBarRatio(question, value) ?? 0
  }
  switch (question.type) {
    case 'boolean':
      if (value === 'true') {
        return 1
      }
      if (value === 'false') {
        return 0
      }
      return 0
    case 'number': {
      if (!isAnswerValueFilled('number', value)) {
        return 0
      }
      const n = Number(value)
      if (!Number.isFinite(n)) {
        return 0
      }
      if (!compareScalarRange) {
        return 1
      }
      return scalarLinearStrength(
        n,
        compareScalarRange,
        effectiveComparePreference(question, 'number')
      )
    }
    case 'select': {
      if (!isAnswerValueFilled('select', value)) {
        return 0
      }
      const opts = [...question.options].sort((a, b) => a.order - b.order)
      if (opts.length === 0) {
        return 0
      }
      if (opts.length === 1) {
        return 1
      }
      const idx = opts.findIndex((o) => o.value === value)
      if (idx < 0) {
        return 0
      }
      return idx / (opts.length - 1)
    }
    case 'multi-select': {
      if (!isAnswerValueFilled('multi-select', value)) {
        return 0
      }
      const picked = parseMultiSelect(value).length
      const nOpts = question.options.length
      if (nOpts <= 0) {
        return 0
      }
      return Math.min(1, picked / nOpts)
    }
    case 'text':
      return isAnswerValueFilled('text', value) ? 1 : 0
    case 'date': {
      if (!isAnswerValueFilled('date', value)) {
        return 0
      }
      const s = String(value).trim()
      if (!isValidIsoDateString(s)) {
        return 0
      }
      if (!compareScalarRange) {
        return 1
      }
      const t = isoDateToUtcMs(s)
      return scalarLinearStrength(
        t,
        compareScalarRange,
        effectiveComparePreference(question, 'date')
      )
    }
    default:
      return 0
  }
}
