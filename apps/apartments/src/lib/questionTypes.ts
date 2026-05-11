import type { QuestionType } from '@/types'

/** Display labels for question types (API values stay snake/lowercase). */
export const QUESTION_TYPE_LABELS = {
  text: 'Long text',
  number: 'Number',
  date: 'Date',
  boolean: 'Yes or No',
  select: 'Single choice',
  'multi-select': 'Multiple choice',
  rating: 'Rating scale'
} as const satisfies Record<QuestionType, string>

export function questionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type]
}

export const QUESTION_TYPE_ORDER: QuestionType[] = [
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multi-select',
  'rating'
]
