import type { Apartment, QuestionType } from '@/types'

import { isAnswerValueFilled } from './answerValue'

export type ApartmentStatusKind =
  | 'completed'
  | 'missing-critical'
  | 'needs-review'

export function deriveApartmentStatus(
  completion?: Apartment['completion']
): ApartmentStatusKind {
  if (!completion || completion.totalQuestions === 0) {
    return 'needs-review'
  }
  const critical = completion.criticalMissingCount ?? 0
  if (critical > 0) {
    return 'missing-critical'
  }
  if (completion.percent >= 100) {
    return 'completed'
  }
  return 'needs-review'
}

export function computeCompletionFromQuestions(
  questions: Array<{ id: string; required: boolean; type: QuestionType }>,
  answers: Array<{ questionId: string; value: string | null }>
): {
  answeredQuestions: number
  totalQuestions: number
  percent: number
  criticalMissingCount: number
} {
  const map = new Map(answers.map((a) => [a.questionId, a.value]))
  let answered = 0
  let critical = 0
  for (const q of questions) {
    const v = map.get(q.id) ?? null
    const filled = isAnswerValueFilled(q.type, v)
    if (filled) {
      answered++
    }
    if (q.required && !filled) {
      critical++
    }
  }
  const total = questions.length
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0
  return {
    answeredQuestions: answered,
    totalQuestions: total,
    percent,
    criticalMissingCount: critical
  }
}
