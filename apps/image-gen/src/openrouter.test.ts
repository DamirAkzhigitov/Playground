import { describe, expect, it } from 'vitest'

import { parseGeneratedImageUrls } from './openrouter'

describe('parseGeneratedImageUrls', () => {
  it('reads snake_case image_url from assistant message', () => {
    const urls = parseGeneratedImageUrls({
      role: 'assistant',
      content: 'ok',
      images: [
        {
          type: 'image_url',
          image_url: { url: 'data:image/png;base64,AAA' }
        }
      ]
    })
    expect(urls).toEqual(['data:image/png;base64,AAA'])
  })

  it('reads camelCase imageUrl', () => {
    const urls = parseGeneratedImageUrls({
      images: [{ imageUrl: { url: 'data:image/png;base64,BBB' } }]
    })
    expect(urls).toEqual(['data:image/png;base64,BBB'])
  })
})
