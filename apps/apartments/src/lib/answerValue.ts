import type { Question, QuestionType } from '@/types'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Validates `YYYY-MM-DD` calendar dates (rejects e.g. 2024-02-30). */
export function isValidIsoDateString(value: string): boolean {
  const s = value.trim()
  if (!ISO_DATE_RE.test(s)) {
    return false
  }
  const parts = s.split('-')
  if (parts.length !== 3) {
    return false
  }
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (![y, m, d].every((n) => Number.isInteger(n))) {
    return false
  }
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/** Locale-aware label for a stored ISO date (safe for compare/export UI). */
export function formatIsoDateForDisplay(iso: string): string {
  if (!isValidIsoDateString(iso)) {
    return iso.trim()
  }
  const s = iso.trim()
  const parts = s.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function isAnswerValueFilled(
  type: QuestionType,
  value: string | null | undefined
): boolean {
  if (value === null || value === undefined) {
    return false
  }
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '[]') {
    return false
  }
  if (type === 'date') {
    return isValidIsoDateString(trimmed)
  }
  if (type === 'multi-select') {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return false
    }
  }
  return true
}

export function isQuestionAnswerFilled(
  question: Question,
  value: string | null | undefined
): boolean {
  return isAnswerValueFilled(question.type, value)
}

export function parseMultiSelect(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : []
  } catch {
    return []
  }
}

export function stringifyMultiSelect(values: string[]): string {
  return JSON.stringify(values)
}
