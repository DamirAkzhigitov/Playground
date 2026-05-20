/**
 * Image-generation models available in the UI. `avgUsdPerImage` is a rough
 * planning estimate for “images left” (remaining credits ÷ estimate); real
 * cost varies by prompt, reference image size, and provider pricing.
 */
export type ImageGenModel = {
  id: string
  label: string
  /** OpenRouter `modalities` for chat/completions */
  modalities: ('image' | 'text')[]
  /** Rough expected cost per output image in USD */
  avgUsdPerImage: number
}

export const IMAGE_GEN_MODELS: readonly ImageGenModel[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image',
    modalities: ['image', 'text'],
    avgUsdPerImage: 0.04
  },
  {
    id: 'google/gemini-3.1-flash-image-preview',
    label: 'Gemini 3.1 Flash Image (preview)',
    modalities: ['image', 'text'],
    avgUsdPerImage: 0.05
  },
  {
    id: 'black-forest-labs/flux.2-pro',
    label: 'FLUX.2 Pro',
    modalities: ['image'],
    avgUsdPerImage: 0.06
  },
  {
    id: 'black-forest-labs/flux.2-flex',
    label: 'FLUX.2 Flex',
    modalities: ['image'],
    avgUsdPerImage: 0.055
  },
  {
    id: 'sourceful/riverflow-v2-standard-preview',
    label: 'Riverflow v2 Standard (preview)',
    modalities: ['image', 'text'],
    avgUsdPerImage: 0.045
  }
] as const

export const DEFAULT_MODEL_ID = IMAGE_GEN_MODELS[0]!.id

export function getModelById(id: string): ImageGenModel | undefined {
  return IMAGE_GEN_MODELS.find((m) => m.id === id)
}
