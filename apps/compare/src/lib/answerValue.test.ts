import { describe, expect, it } from 'vitest'

import { isAnswerValueFilled, isQuestionAnswerFilled } from './answerValue'
import type { Question } from '@/types'

const baseQuestion = (type: Question['type']): Question => ({
  id: 'q1',
  label: 'Q',
  type,
  categoryId: 'c1',
  required: false,
  isArchived: false,
  order: 0,
  ratingMin: null,
  ratingMax: null,
  valuePreference: null,
  options: []
})

describe('isAnswerValueFilled', () => {
  it('treats null, empty, and [] as empty', () => {
    expect(isAnswerValueFilled('text', null)).toBe(false)
    expect(isAnswerValueFilled('text', '')).toBe(false)
    expect(isAnswerValueFilled('text', '  ')).toBe(false)
    expect(isAnswerValueFilled('multi-select', '[]')).toBe(false)
    expect(isAnswerValueFilled('multi-select', '  []  ')).toBe(false)
    expect(isAnswerValueFilled('text', '  []  ')).toBe(false)
  })

  it('accepts non-empty text and boolean strings', () => {
    expect(isAnswerValueFilled('text', 'hello')).toBe(true)
    expect(isAnswerValueFilled('boolean', 'false')).toBe(true)
  })

  it('accepts only valid ISO calendar dates', () => {
    expect(isAnswerValueFilled('date', null)).toBe(false)
    expect(isAnswerValueFilled('date', '')).toBe(false)
    expect(isAnswerValueFilled('date', '2024-06-15')).toBe(true)
    expect(isAnswerValueFilled('date', '2024-02-30')).toBe(false)
    expect(isAnswerValueFilled('date', 'not-a-date')).toBe(false)
  })

  it('parses multi-select JSON', () => {
    expect(isAnswerValueFilled('multi-select', '["a"]')).toBe(true)
    expect(isAnswerValueFilled('multi-select', '["a","b"]')).toBe(true)
    expect(isAnswerValueFilled('multi-select', 'not-json')).toBe(false)
  })
})

describe('isQuestionAnswerFilled', () => {
  it('delegates to type', () => {
    expect(isQuestionAnswerFilled(baseQuestion('rating'), '3')).toBe(true)
    expect(isQuestionAnswerFilled(baseQuestion('rating'), null)).toBe(false)
  })
})
