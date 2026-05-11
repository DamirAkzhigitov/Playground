import { describe, expect, it } from 'vitest'

import { COMPARE_EMPTY, normalizeAnswerForCompare } from '@/lib/compareDisplay'
import type { Question } from '@/types'

const baseQuestion = (overrides: Partial<Question>): Question => ({
  id: 'q1',
  label: 'Test',
  type: 'text',
  categoryId: 'c1',
  required: false,
  isArchived: false,
  order: 0,
  ratingMin: null,
  ratingMax: null,
  options: [],
  ...overrides
})

describe('normalizeAnswerForCompare', () => {
  it('treats unfilled text as empty sentinel', () => {
    const q = baseQuestion({ type: 'text' })
    expect(normalizeAnswerForCompare(q, null)).toBe(COMPARE_EMPTY)
    expect(normalizeAnswerForCompare(q, '  ')).toBe(COMPARE_EMPTY)
  })

  it('normalizes boolean', () => {
    const q = baseQuestion({ type: 'boolean' })
    expect(normalizeAnswerForCompare(q, 'true')).toBe('true')
    expect(normalizeAnswerForCompare(q, 'false')).toBe('false')
  })

  it('sorts multi-select values for stable keys', () => {
    const q = baseQuestion({
      type: 'multi-select',
      options: [
        { id: '1', questionId: 'q1', label: 'A', value: 'a', order: 0 },
        { id: '2', questionId: 'q1', label: 'B', value: 'b', order: 1 }
      ]
    })
    const aFirst = normalizeAnswerForCompare(q, '["a","b"]')
    const bFirst = normalizeAnswerForCompare(q, '["b","a"]')
    expect(aFirst).toBe(bFirst)
  })

  it('normalizes numbers', () => {
    const q = baseQuestion({ type: 'number' })
    expect(normalizeAnswerForCompare(q, '0')).toBe('0')
    expect(normalizeAnswerForCompare(q, '3.5')).toBe('3.5')
  })
})
