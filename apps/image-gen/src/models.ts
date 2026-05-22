/**
 * Image-generation model shown in the UI. `avgUsdPerImage` is a rough planning
 * estimate for “images left” (remaining credits ÷ estimate); real cost varies by
 * prompt, reference image size, and provider pricing.
 */
export type ImageGenModel = {
  id: string
  label: string
  /** OpenRouter `modalities` for chat/completions */
  modalities: ('image' | 'text')[]
  /** Rough expected cost per output image in USD */
  avgUsdPerImage: number
}

/** Preferred default when present in the fetched catalog */
export const PREFERRED_DEFAULT_MODEL_ID = 'google/gemini-2.5-flash-image'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePrice(value: unknown): number {
  if (value == null) return 0
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/**
 * Rough per-image USD from OpenRouter `pricing` (per-token rates plus optional
 * per-image / per-request fields). Used only for “images left” planning.
 */
export function estimateUsdPerImage(pricing: Record<string, unknown>): number {
  const image = parsePrice(pricing.image)
  const imageOutput = parsePrice(pricing.image_output)
  const request = parsePrice(pricing.request)

  if (imageOutput >= 0.001) return imageOutput
  if (image >= 0.001) return image
  if (request >= 0.001) return request

  const prompt = parsePrice(pricing.prompt)
  const completion = parsePrice(pricing.completion)
  const tokenEstimate = prompt * 800 + completion * 12_000 + image * 8_000
  if (tokenEstimate >= 0.001) return tokenEstimate

  return 0.05
}

/** Map one OpenRouter `/models` entry to a UI model, or null if unusable */
export function openRouterModelToImageGenModel(
  raw: unknown
): ImageGenModel | null {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'string' ||
    typeof raw.name !== 'string'
  ) {
    return null
  }

  const arch = raw.architecture
  if (!isRecord(arch) || !Array.isArray(arch.output_modalities)) return null
  if (!arch.output_modalities.includes('image')) return null

  const modalities: ('image' | 'text')[] = []
  if (arch.output_modalities.includes('image')) modalities.push('image')
  if (arch.output_modalities.includes('text')) modalities.push('text')
  if (modalities.length === 0) modalities.push('image')

  const pricing = isRecord(raw.pricing) ? raw.pricing : {}

  return {
    id: raw.id,
    label: raw.name,
    modalities,
    avgUsdPerImage: estimateUsdPerImage(pricing)
  }
}

export function sortImageGenModels(models: ImageGenModel[]): ImageGenModel[] {
  return [...models].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  )
}

export function pickDefaultModelId(models: readonly ImageGenModel[]): string {
  if (models.length === 0) return ''
  const preferred = models.find((m) => m.id === PREFERRED_DEFAULT_MODEL_ID)
  return preferred?.id ?? models[0]!.id
}

export function findModelById(
  models: readonly ImageGenModel[],
  id: string
): ImageGenModel | undefined {
  return models.find((m) => m.id === id)
}
