import { describe, expect, it } from 'vitest'

import {
  COMPARE_EMPTY,
  answerStrengthRatio,
  dateMinMaxAcrossValues,
  effectiveValuePreference,
  normalizeAnswerForCompare,
  numberMinMaxAcrossValues
} from '@/lib/compareDisplay'
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
  valuePreference: null,
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

  it('normalizes dates', () => {
    const q = baseQuestion({ type: 'date' })
    expect(normalizeAnswerForCompare(q, '2024-06-15')).toBe('2024-06-15')
    expect(normalizeAnswerForCompare(q, '2024-02-30')).toBe(COMPARE_EMPTY)
  })
})

describe('numberMinMaxAcrossValues', () => {
  it('returns null when no numeric answers', () => {
    expect(numberMinMaxAcrossValues([null, '', 'x'])).toBeNull()
  })

  it('returns min and max', () => {
    expect(numberMinMaxAcrossValues(['10', '2', null, '5'])).toEqual({
      min: 2,
      max: 10
    })
  })
})

describe('dateMinMaxAcrossValues', () => {
  it('returns null when no valid dates', () => {
    expect(dateMinMaxAcrossValues([null, 'bad'])).toBeNull()
  })

  it('returns chronological min and max as ISO strings', () => {
    expect(
      dateMinMaxAcrossValues(['2024-06-01', '2024-01-15', '2024-03-20'])
    ).toEqual({ min: '2024-01-15', max: '2024-06-01' })
  })
})

describe('effectiveValuePreference', () => {
  it('uses stored preference when set', () => {
    expect(
      effectiveValuePreference(
        baseQuestion({ type: 'number', valuePreference: 'lower' })
      )
    ).toBe('lower')
  })

  it('defaults date to lower and number to higher', () => {
    expect(effectiveValuePreference(baseQuestion({ type: 'date' }))).toBe(
      'lower'
    )
    expect(effectiveValuePreference(baseQuestion({ type: 'number' }))).toBe(
      'higher'
    )
  })
})

describe('answerStrengthRatio', () => {
  it('maps boolean answers', () => {
    const q = baseQuestion({ type: 'boolean' })
    expect(answerStrengthRatio(q, 'true', null)).toBe(1)
    expect(answerStrengthRatio(q, 'false', null)).toBe(0)
    expect(answerStrengthRatio(q, null, null)).toBe(0)
  })

  it('normalizes rating', () => {
    const q = baseQuestion({ type: 'rating', ratingMin: 1, ratingMax: 5 })
    expect(answerStrengthRatio(q, '1', null)).toBe(0)
    expect(answerStrengthRatio(q, '5', null)).toBe(1)
    expect(answerStrengthRatio(q, '3', null)).toBe(0.5)
  })

  it('normalizes number within range (higher is better by default)', () => {
    const q = baseQuestion({ type: 'number' })
    expect(
      answerStrengthRatio(q, '50', { min: 0, max: 100 }, null)
    ).toBeCloseTo(0.5)
    expect(answerStrengthRatio(q, '0', { min: 0, max: 100 }, null)).toBe(0)
    expect(answerStrengthRatio(q, '100', { min: 0, max: 100 }, null)).toBe(1)
  })

  it('inverts number when lower is better', () => {
    const q = baseQuestion({ type: 'number', valuePreference: 'lower' })
    expect(answerStrengthRatio(q, '0', { min: 0, max: 100 }, null)).toBe(1)
    expect(answerStrengthRatio(q, '100', { min: 0, max: 100 }, null)).toBe(0)
    expect(
      answerStrengthRatio(q, '25', { min: 0, max: 100 }, null)
    ).toBeCloseTo(0.75)
  })

  it('treats single number value as full strength', () => {
    const q = baseQuestion({ type: 'number' })
    expect(answerStrengthRatio(q, '42', { min: 42, max: 42 }, null)).toBe(1)
  })

  it('maps select by option order', () => {
    const q = baseQuestion({
      type: 'select',
      options: [
        { id: '1', questionId: 'q1', label: 'Low', value: 'low', order: 0 },
        { id: '2', questionId: 'q1', label: 'High', value: 'high', order: 1 }
      ]
    })
    expect(answerStrengthRatio(q, 'low', null)).toBe(0)
    expect(answerStrengthRatio(q, 'high', null)).toBe(1)
  })

  it('rates text as binary', () => {
    const textQ = baseQuestion({ type: 'text' })
    expect(answerStrengthRatio(textQ, 'hello', null)).toBe(1)
    expect(answerStrengthRatio(textQ, '  ', null)).toBe(0)
  })

  it('normalizes date within range (sooner better by default)', () => {
    const q = baseQuestion({ type: 'date' })
    const range = { min: '2024-01-01', max: '2024-01-10' }
    expect(answerStrengthRatio(q, '2024-01-01', null, range)).toBe(1)
    expect(answerStrengthRatio(q, '2024-01-10', null, range)).toBe(0)
    expect(answerStrengthRatio(q, '2024-01-05', null, range)).toBeCloseTo(
      5 / 9,
      5
    )
  })

  it('inverts date when later is better', () => {
    const q = baseQuestion({ type: 'date', valuePreference: 'higher' })
    const range = { min: '2024-01-01', max: '2024-01-10' }
    expect(answerStrengthRatio(q, '2024-01-01', null, range)).toBe(0)
    expect(answerStrengthRatio(q, '2024-01-10', null, range)).toBe(1)
  })

  it('treats invalid date answer as zero', () => {
    const q = baseQuestion({ type: 'date' })
    expect(
      answerStrengthRatio(q, 'bad', null, {
        min: '2024-01-01',
        max: '2024-01-02'
      })
    ).toBe(0)
  })
})
