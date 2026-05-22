import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchOpenRouterCredits,
  fetchOpenRouterImageModels,
  generateImageViaChat,
  parseGeneratedImageUrls,
  parseOpenRouterErrorMessage
} from './openrouter'

describe('parseOpenRouterErrorMessage', () => {
  it('returns API error message when present', () => {
    expect(
      parseOpenRouterErrorMessage({ error: { message: 'Invalid key' } }, 401)
    ).toBe('Invalid key')
  })

  it('falls back to HTTP status', () => {
    expect(parseOpenRouterErrorMessage(null, 500)).toBe('HTTP 500')
  })
})

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

  it('reads top-level https url', () => {
    const urls = parseGeneratedImageUrls({
      images: [{ url: 'https://cdn.example.com/out.png' }]
    })
    expect(urls).toEqual(['https://cdn.example.com/out.png'])
  })

  it('ignores invalid url shapes', () => {
    expect(
      parseGeneratedImageUrls({
        images: [
          { url: 'ftp://x' },
          { url: '' },
          { image_url: { url: 'nope' } }
        ]
      })
    ).toEqual([])
  })
})

describe('fetchOpenRouterCredits', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses credits from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { total_credits: 10, total_usage: 3.5 }
          })
      })
    )

    const credits = await fetchOpenRouterCredits('test-key')
    expect(credits).toEqual({
      totalCredits: 10,
      totalUsage: 3.5,
      remaining: 6.5
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]!
    expect(url).toBe('https://openrouter.ai/api/v1/credits')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'HTTP-Referer': 'https://image-gen.da-mr.com',
      'X-OpenRouter-Title': 'Playground Image Gen'
    })
  })

  it('throws API error message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } })
      })
    )

    await expect(fetchOpenRouterCredits('bad')).rejects.toThrow('Unauthorized')
  })
})

describe('fetchOpenRouterImageModels', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests image output models and maps the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'google/gemini-2.5-flash-image',
                name: 'Gemini 2.5 Flash Image',
                architecture: {
                  output_modalities: ['image', 'text'],
                  input_modalities: ['text', 'image']
                },
                pricing: { prompt: '0', completion: '0', image: '0.05' }
              },
              {
                id: 'openai/gpt-4',
                name: 'GPT-4',
                architecture: { output_modalities: ['text'] }
              }
            ]
          })
      })
    )

    const models = await fetchOpenRouterImageModels()
    expect(models).toHaveLength(1)
    expect(models[0]).toMatchObject({
      id: 'google/gemini-2.5-flash-image',
      label: 'Gemini 2.5 Flash Image',
      modalities: ['image', 'text'],
      avgUsdPerImage: 0.05
    })

    const [url] = vi.mocked(fetch).mock.calls[0]!
    expect(url instanceof URL ? url.href : url).toBe(
      'https://openrouter.ai/api/v1/models?output_modalities=image'
    )
  })

  it('throws when catalog has no image models', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })
    )

    await expect(fetchOpenRouterImageModels()).rejects.toThrow(
      /No image-generation models/
    )
  })
})

describe('generateImageViaChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns image urls from completion choices', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  images: [
                    {
                      image_url: { url: 'data:image/png;base64,ZZZ' }
                    }
                  ]
                }
              }
            ]
          })
      })
    )

    const urls = await generateImageViaChat({
      apiKey: 'k',
      model: 'google/gemini-2.0-flash-exp:free',
      modalities: ['image'],
      prompt: 'a cat'
    })
    expect(urls).toEqual(['data:image/png;base64,ZZZ'])

    const [, init] = vi.mocked(fetch).mock.calls[0]!
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: 'google/gemini-2.0-flash-exp:free',
      modalities: ['image']
    })
  })

  it('throws when no images in response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'text only' } }]
          })
      })
    )

    await expect(
      generateImageViaChat({
        apiKey: 'k',
        model: 'm',
        modalities: ['image'],
        prompt: 'x'
      })
    ).rejects.toThrow(/No image in the model response/)
  })
})
