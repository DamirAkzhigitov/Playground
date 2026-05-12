import { describe, expect, it } from 'vitest'

import { categoryNameById } from '@/lib/questions'
import type { QuestionGroup } from '@/types'

const sampleGroup = (
  id: string,
  name: string,
  questions: QuestionGroup['questions']
): QuestionGroup => ({
  id,
  name,
  order: 0,
  questions
})

describe('categoryNameById', () => {
  it('maps each group id to its display name', () => {
    const groups: QuestionGroup[] = [
      sampleGroup('c1', 'Kitchen', []),
      sampleGroup('c2', 'Bathroom', [])
    ]
    const map = categoryNameById(groups)
    expect(map.get('c1')).toBe('Kitchen')
    expect(map.get('c2')).toBe('Bathroom')
    expect(map.size).toBe(2)
  })
})
