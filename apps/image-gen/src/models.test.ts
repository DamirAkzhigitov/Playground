import { describe, expect, it } from 'vitest'

import {
  estimateUsdPerImage,
  openRouterModelToImageGenModel,
  pickDefaultModelId,
  sortImageGenModels
} from './models'

describe('estimateUsdPerImage', () => {
  it('uses per-image pricing when present', () => {
    expect(estimateUsdPerImage({ image: '0.01' })).toBe(0.01)
  })

  it('falls back to token-based estimate', () => {
    const est = estimateUsdPerImage({
      prompt: '0.0000003',
      completion: '0.0000025'
    })
    expect(est).toBeGreaterThan(0.001)
  })
})

describe('openRouterModelToImageGenModel', () => {
  it('maps image-only models', () => {
    const m = openRouterModelToImageGenModel({
      id: 'black-forest-labs/flux.2-pro',
      name: 'FLUX.2 Pro',
      architecture: {
        output_modalities: ['image'],
        input_modalities: ['text', 'image']
      },
      pricing: { prompt: '0', completion: '0' }
    })
    expect(m).toMatchObject({
      id: 'black-forest-labs/flux.2-pro',
      label: 'FLUX.2 Pro',
      modalities: ['image']
    })
  })

  it('includes text modality when model outputs text', () => {
    const m = openRouterModelToImageGenModel({
      id: 'google/gemini-2.5-flash-image',
      name: 'Gemini 2.5 Flash Image',
      architecture: {
        output_modalities: ['image', 'text'],
        input_modalities: ['text', 'image']
      },
      pricing: {
        prompt: '0.0000003',
        completion: '0.0000025',
        image: '0.0000003'
      }
    })
    expect(m?.modalities).toEqual(['image', 'text'])
  })

  it('returns null when model does not output images', () => {
    expect(
      openRouterModelToImageGenModel({
        id: 'openai/gpt-4',
        name: 'GPT-4',
        architecture: { output_modalities: ['text'] }
      })
    ).toBeNull()
  })
})

describe('pickDefaultModelId', () => {
  it('prefers gemini flash image when available', () => {
    const id = pickDefaultModelId([
      { id: 'a/b', label: 'A', modalities: ['image'], avgUsdPerImage: 1 },
      {
        id: 'google/gemini-2.5-flash-image',
        label: 'Gemini',
        modalities: ['image', 'text'],
        avgUsdPerImage: 1
      }
    ])
    expect(id).toBe('google/gemini-2.5-flash-image')
  })
})

describe('sortImageGenModels', () => {
  it('sorts by label', () => {
    const sorted = sortImageGenModels([
      { id: 'z', label: 'Zebra', modalities: ['image'], avgUsdPerImage: 1 },
      { id: 'a', label: 'Alpha', modalities: ['image'], avgUsdPerImage: 1 }
    ])
    expect(sorted.map((m) => m.label)).toEqual(['Alpha', 'Zebra'])
  })
})
