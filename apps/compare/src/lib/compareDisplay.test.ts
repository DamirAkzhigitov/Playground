import { describe, expect, it } from 'vitest'

import {
  COMPARE_EMPTY,
  normalizeAnswerForCompare,
  answerStrengthRatio,
  dateMinMaxAcrossValues,
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
    expect(dateMinMaxAcrossValues([null, 'bad', '2024-02-30'])).toBeNull()
  })

  it('returns UTC ms min and max', () => {
    expect(dateMinMaxAcrossValues(['2024-01-10', null, '2024-06-01'])).toEqual({
      min: Date.UTC(2024, 0, 10),
      max: Date.UTC(2024, 5, 1)
    })
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

  it('normalizes number within range', () => {
    const q = baseQuestion({ type: 'number' })
    expect(answerStrengthRatio(q, '50', { min: 0, max: 100 })).toBeCloseTo(0.5)
    expect(answerStrengthRatio(q, '0', { min: 0, max: 100 })).toBe(0)
    expect(answerStrengthRatio(q, '100', { min: 0, max: 100 })).toBe(1)
  })

  it('inverts number strength when lower is better (e.g. price)', () => {
    const q = baseQuestion({ type: 'number', valuePreference: 'lower' })
    const r = { min: 100_000, max: 150_000 }
    expect(answerStrengthRatio(q, '100000', r)).toBeCloseTo(1)
    expect(answerStrengthRatio(q, '125000', r)).toBeCloseTo(0.5)
    expect(answerStrengthRatio(q, '150000', r)).toBeCloseTo(0)
  })

  it('treats legacy null valuePreference on number as higher-is-better', () => {
    const q = baseQuestion({ type: 'number', valuePreference: null })
    expect(answerStrengthRatio(q, '0', { min: 0, max: 100 })).toBe(0)
    expect(answerStrengthRatio(q, '100', { min: 0, max: 100 })).toBe(1)
  })

  it('normalizes date by range with lower default (earlier is better)', () => {
    const q = baseQuestion({ type: 'date', valuePreference: null })
    const r = {
      min: Date.UTC(2024, 0, 1),
      max: Date.UTC(2024, 0, 3)
    }
    expect(answerStrengthRatio(q, '2024-01-01', r)).toBeCloseTo(1)
    expect(answerStrengthRatio(q, '2024-01-02', r)).toBeCloseTo(0.5)
    expect(answerStrengthRatio(q, '2024-01-03', r)).toBeCloseTo(0)
  })

  it('date higher-is-better inverts the scale', () => {
    const q = baseQuestion({ type: 'date', valuePreference: 'higher' })
    const r = {
      min: Date.UTC(2024, 0, 1),
      max: Date.UTC(2024, 0, 3)
    }
    expect(answerStrengthRatio(q, '2024-01-01', r)).toBeCloseTo(0)
    expect(answerStrengthRatio(q, '2024-01-03', r)).toBeCloseTo(1)
  })

  it('treats single number value as full strength', () => {
    const q = baseQuestion({ type: 'number' })
    expect(answerStrengthRatio(q, '42', { min: 42, max: 42 })).toBe(1)
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

  it('rates text as binary; date without range is full strength', () => {
    const textQ = baseQuestion({ type: 'text' })
    expect(answerStrengthRatio(textQ, 'hello', null)).toBe(1)
    expect(answerStrengthRatio(textQ, '  ', null)).toBe(0)
    const dateQ = baseQuestion({ type: 'date' })
    expect(answerStrengthRatio(dateQ, '2024-01-01', null)).toBe(1)
    expect(answerStrengthRatio(dateQ, 'bad', null)).toBe(0)
  })
})
