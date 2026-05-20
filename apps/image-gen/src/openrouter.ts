const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export type OpenRouterCredits = {
  totalCredits: number
  totalUsage: number
  remaining: number
}

export async function fetchOpenRouterCredits(
  apiKey: string
): Promise<OpenRouterCredits> {
  const res = await fetch(`${OPENROUTER_BASE}/credits`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  })

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const msg =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      body.error &&
      typeof body.error === 'object' &&
      'message' in body.error &&
      typeof (body.error as { message: unknown }).message === 'string'
        ? (body.error as { message: string }).message
        : `HTTP ${res.status}`
    throw new Error(msg)
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('data' in body) ||
    !body.data ||
    typeof body.data !== 'object'
  ) {
    throw new Error('Unexpected credits response')
  }

  const data = body.data as Record<string, unknown>
  const totalCredits = Number(data.total_credits)
  const totalUsage = Number(data.total_usage)

  if (!Number.isFinite(totalCredits) || !Number.isFinite(totalUsage)) {
    throw new Error('Invalid credits payload')
  }

  return {
    totalCredits,
    totalUsage,
    remaining: Math.max(0, totalCredits - totalUsage)
  }
}

type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type GenerateImageParams = {
  apiKey: string
  model: string
  modalities: ('image' | 'text')[]
  prompt: string
  /** Optional reference image as a data URL or HTTPS URL */
  referenceImageUrl?: string
}

function extractImageUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.url === 'string' && o.url.startsWith('data:')) return o.url
  if (o.image_url && typeof o.image_url === 'object') {
    const inner = o.image_url as Record<string, unknown>
    if (typeof inner.url === 'string') return inner.url
  }
  if (o.imageUrl && typeof o.imageUrl === 'object') {
    const inner = o.imageUrl as Record<string, unknown>
    if (typeof inner.url === 'string') return inner.url
  }
  return null
}

export function parseGeneratedImageUrls(message: unknown): string[] {
  if (!message || typeof message !== 'object') return []
  const m = message as Record<string, unknown>
  const images = m.images
  if (!Array.isArray(images)) return []
  const urls: string[] = []
  for (const item of images) {
    const url = extractImageUrl(item)
    if (url) urls.push(url)
  }
  return urls
}

export async function generateImageViaChat(
  params: GenerateImageParams
): Promise<string[]> {
  const content: ChatContentPart[] | string =
    params.referenceImageUrl && params.referenceImageUrl.length > 0
      ? [
          {
            type: 'text',
            text:
              params.prompt.trim() ||
              'Generate an image based on the reference.'
          },
          {
            type: 'image_url',
            image_url: { url: params.referenceImageUrl }
          }
        ]
      : params.prompt.trim() || 'Generate an image.'

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: 'user', content }],
      modalities: params.modalities
    })
  })

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      body.error &&
      typeof body.error === 'object' &&
      'message' in body.error
    ) {
      const m = (body.error as { message?: unknown }).message
      if (typeof m === 'string') msg = m
    }
    throw new Error(msg)
  }

  if (!body || typeof body !== 'object' || !('choices' in body)) {
    throw new Error('Unexpected completion response')
  }

  const choices = (body as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('No choices in response')
  }

  const first = choices[0]
  if (!first || typeof first !== 'object' || !('message' in first)) {
    throw new Error('Invalid choice')
  }

  const urls = parseGeneratedImageUrls((first as { message?: unknown }).message)
  if (urls.length === 0) {
    throw new Error(
      'No image in the model response. Try another model or a clearer prompt.'
    )
  }
  return urls
}
