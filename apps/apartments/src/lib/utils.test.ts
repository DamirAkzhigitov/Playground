import { describe, it, expect } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('omits falsy conditional classes', () => {
    expect(cn('foo', false, 'baz')).toBe('foo baz')
  })
})
