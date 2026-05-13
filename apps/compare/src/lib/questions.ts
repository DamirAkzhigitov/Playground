import { isQuestionAnswerFilled } from '@/lib/answerValue'
import type { Question, QuestionGroup } from '@/types'

export type AnswerDraft = { value: string | null; note: string | null }

export function buildAnswerDraftMap(
  groups: QuestionGroup[],
  rows: Array<{ questionId: string; value: string | null; note: string | null }>
): Record<string, AnswerDraft> {
  const map: Record<string, AnswerDraft> = {}
  for (const g of groups) {
    for (const q of g.questions) {
      if (!q.isArchived) {
        map[q.id] = { value: null, note: null }
      }
    }
  }
  for (const row of rows) {
    if (map[row.questionId] !== undefined) {
      map[row.questionId] = { value: row.value, note: row.note }
    }
  }
  return map
}

export function flattenActiveQuestions(groups: QuestionGroup[]): Question[] {
  return groups.flatMap((group) =>
    [...group.questions]
      .filter((q) => !q.isArchived)
      .sort((a, b) => a.order - b.order)
  )
}

/** Maps category id → display name for the active question groups. */
export function categoryNameById(groups: QuestionGroup[]): Map<string, string> {
  return new Map(groups.map((g) => [g.id, g.name]))
}

export function questionIndexInFlatList(
  flat: Question[],
  questionId: string
): number {
  return flat.findIndex((q) => q.id === questionId)
}

export function firstQuestionIndexForCategory(
  flat: Question[],
  categoryId: string
): number {
  return flat.findIndex((q) => q.categoryId === categoryId)
}

/** First checklist-order question without a filled answer; `0` if all filled. */
export function firstUnfilledQuestionIndex(
  flat: Question[],
  drafts: Record<string, AnswerDraft | undefined>
): number {
  const i = flat.findIndex(
    (q) => !isQuestionAnswerFilled(q, drafts[q.id]?.value)
  )
  return i < 0 ? 0 : i
}
