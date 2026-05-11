import type { Question, QuestionType } from '@/types'

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
