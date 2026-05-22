import {
  openRouterModelToImageGenModel,
  sortImageGenModels,
  type ImageGenModel
} from './models'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

/** OpenRouter app attribution (https://openrouter.ai/docs/api/reference/overview) */
const OPENROUTER_APP_REFERER = 'https://image-gen.da-mr.com'
const OPENROUTER_APP_TITLE = 'Playground Image Gen'

const DEFAULT_CREDITS_TIMEOUT_MS = 30_000
const DEFAULT_MODELS_TIMEOUT_MS = 30_000
const DEFAULT_CHAT_TIMEOUT_MS = 180_000

export type OpenRouterRequestOptions = {
  signal?: AbortSignal
  /** Aborts the request after this many milliseconds (merged with `signal`). */
  timeoutMs?: number
}

export type OpenRouterCredits = {
  totalCredits: number
  totalUsage: number
  remaining: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseOpenRouterErrorMessage(
  body: unknown,
  status: number
): string {
  if (!isRecord(body) || !('error' in body)) return `HTTP ${status}`
  const err = body.error
  if (!isRecord(err) || typeof err.message !== 'string') return `HTTP ${status}`
  return err.message
}

function mergeRequestSignals(
  signal?: AbortSignal,
  timeoutMs?: number
): AbortSignal | undefined {
  const parts: AbortSignal[] = []
  if (
    timeoutMs != null &&
    timeoutMs > 0 &&
    typeof AbortSignal.timeout === 'function'
  ) {
    parts.push(AbortSignal.timeout(timeoutMs))
  }
  if (signal) parts.push(signal)
  if (parts.length === 0) return undefined
  if (parts.length === 1) return parts[0]
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(parts)
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  for (const s of parts) {
    if (s.aborted) {
      controller.abort()
      return controller.signal
    }
    s.addEventListener('abort', onAbort, { once: true })
  }
  return controller.signal
}

function openRouterHeaders(
  apiKey: string | undefined,
  extra?: Record<string, string>
): HeadersInit {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    'HTTP-Referer': OPENROUTER_APP_REFERER,
    'X-OpenRouter-Title': OPENROUTER_APP_TITLE,
    ...extra
  }
}

async function readJsonBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null)
}

function assertOk(res: Response, body: unknown): void {
  if (res.ok) return
  throw new Error(parseOpenRouterErrorMessage(body, res.status))
}

export async function fetchOpenRouterCredits(
  apiKey: string,
  options?: OpenRouterRequestOptions
): Promise<OpenRouterCredits> {
  const res = await fetch(`${OPENROUTER_BASE}/credits`, {
    method: 'GET',
    headers: openRouterHeaders(apiKey),
    signal: mergeRequestSignals(
      options?.signal,
      options?.timeoutMs ?? DEFAULT_CREDITS_TIMEOUT_MS
    )
  })

  const body = await readJsonBody(res)
  assertOk(res, body)

  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error('Unexpected credits response')
  }

  const totalCredits = Number(body.data.total_credits)
  const totalUsage = Number(body.data.total_usage)

  if (!Number.isFinite(totalCredits) || !Number.isFinite(totalUsage)) {
    throw new Error('Invalid credits payload')
  }

  return {
    totalCredits,
    totalUsage,
    remaining: Math.max(0, totalCredits - totalUsage)
  }
}

export async function fetchOpenRouterImageModels(
  apiKey?: string,
  options?: OpenRouterRequestOptions
): Promise<ImageGenModel[]> {
  const url = new URL(`${OPENROUTER_BASE}/models`)
  url.searchParams.set('output_modalities', 'image')

  const res = await fetch(url, {
    method: 'GET',
    headers: openRouterHeaders(apiKey?.trim() || undefined),
    signal: mergeRequestSignals(
      options?.signal,
      options?.timeoutMs ?? DEFAULT_MODELS_TIMEOUT_MS
    )
  })

  const body = await readJsonBody(res)
  assertOk(res, body)

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error('Unexpected models response')
  }

  const models: ImageGenModel[] = []
  for (const item of body.data) {
    const mapped = openRouterModelToImageGenModel(item)
    if (mapped) models.push(mapped)
  }

  if (models.length === 0) {
    throw new Error('No image-generation models returned from OpenRouter')
  }

  return sortImageGenModels(models)
}

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type GenerateImageParams = OpenRouterRequestOptions & {
  apiKey: string
  model: string
  modalities: ('image' | 'text')[]
  prompt: string
  /** Optional reference image as a data URL or HTTPS URL */
  referenceImageUrl?: string
}

function isValidResultImageUrl(url: string): boolean {
  return (
    url.length > 0 &&
    (url.startsWith('data:') ||
      url.startsWith('https://') ||
      url.startsWith('http://'))
  )
}

function extractImageUrl(raw: unknown): string | null {
  if (!isRecord(raw)) return null

  if (typeof raw.url === 'string' && isValidResultImageUrl(raw.url)) {
    return raw.url
  }

  for (const key of ['image_url', 'imageUrl'] as const) {
    const nested = raw[key]
    if (
      isRecord(nested) &&
      typeof nested.url === 'string' &&
      isValidResultImageUrl(nested.url)
    ) {
      return nested.url
    }
  }

  return null
}

export function parseGeneratedImageUrls(message: unknown): string[] {
  if (!isRecord(message) || !Array.isArray(message.images)) return []
  const urls: string[] = []
  for (const item of message.images) {
    const url = extractImageUrl(item)
    if (url) urls.push(url)
  }
  return urls
}

export async function generateImageViaChat(
  params: GenerateImageParams
): Promise<string[]> {
  const {
    signal,
    timeoutMs,
    apiKey,
    model,
    modalities,
    prompt,
    referenceImageUrl
  } = params

  const content: ChatContentPart[] | string =
    referenceImageUrl && referenceImageUrl.length > 0
      ? [
          {
            type: 'text',
            text: prompt.trim() || 'Generate an image based on the reference.'
          },
          {
            type: 'image_url',
            image_url: { url: referenceImageUrl }
          }
        ]
      : prompt.trim() || 'Generate an image.'

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: openRouterHeaders(apiKey, { 'Content-Type': 'application/json' }),
    signal: mergeRequestSignals(signal, timeoutMs ?? DEFAULT_CHAT_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      modalities
    })
  })

  const body = await readJsonBody(res)
  assertOk(res, body)

  if (
    !isRecord(body) ||
    !Array.isArray(body.choices) ||
    body.choices.length === 0
  ) {
    throw new Error('Unexpected completion response')
  }

  const first = body.choices[0]
  if (!isRecord(first) || !('message' in first)) {
    throw new Error('Invalid choice')
  }

  const urls = parseGeneratedImageUrls(first.message)
  if (urls.length === 0) {
    throw new Error(
      'No image in the model response. Try another model or a clearer prompt.'
    )
  }
  return urls
}
