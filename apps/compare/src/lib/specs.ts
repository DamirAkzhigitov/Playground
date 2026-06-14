import { isQuestionAnswerFilled } from '@/lib/answerValue'
import type { Spec, SpecSection } from '@/types'

export type AnswerDraft = { value: string | null; note: string | null }

export function buildAnswerDraftMap(
  sections: SpecSection[],
  rows: Array<{ specId: string; value: string | null; note: string | null }>
): Record<string, AnswerDraft> {
  const map: Record<string, AnswerDraft> = {}
  for (const section of sections) {
    for (const spec of section.specs) {
      if (!spec.isArchived) {
        map[spec.id] = { value: null, note: null }
      }
    }
  }
  for (const row of rows) {
    if (map[row.specId] !== undefined) {
      map[row.specId] = { value: row.value, note: row.note }
    }
  }
  return map
}

export function flattenActiveSpecs(sections: SpecSection[]): Spec[] {
  return sections.flatMap((section) =>
    [...section.specs]
      .filter((s) => !s.isArchived)
      .sort((a, b) => a.order - b.order)
  )
}

export function sectionNameById(sections: SpecSection[]): Map<string, string> {
  return new Map(sections.map((s) => [s.id, s.name]))
}

export function specIndexInFlatList(flat: Spec[], specId: string): number {
  return flat.findIndex((s) => s.id === specId)
}

export function firstSpecIndexForSection(
  flat: Spec[],
  sectionId: string
): number {
  return flat.findIndex((s) => s.sectionId === sectionId)
}

export function firstUnfilledSpecIndex(
  flat: Spec[],
  drafts: Record<string, AnswerDraft | undefined>
): number {
  const i = flat.findIndex(
    (s) => !isQuestionAnswerFilled(s, drafts[s.id]?.value)
  )
  return i < 0 ? 0 : i
}
