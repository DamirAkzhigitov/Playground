import type { Bindings } from './types'

const LISTING_SCHEMA_NAME = 'apartment_listing_extract'

const LISTING_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description:
        'Short listing title or property name. Empty string if not found.'
    },
    address: {
      type: 'string',
      description: 'Street and city or full postal address. Empty if unknown.'
    },
    price: {
      type: 'string',
      description:
        'Numeric price only (ASCII digits, optional single dot for decimals). No currency symbols or thousands separators. Empty string if absent or unclear.'
    },
    notes: {
      type: 'string',
      description:
        'Other notable facts (size, floor, fees, contact). Empty if nothing extra.'
    }
  },
  required: ['title', 'address', 'price', 'notes'],
  additionalProperties: false
} as const

export type ListingExtractResult = {
  title: string
  address: string
  price: number | null
  notes: string
}

function extractOutputTextJson(raw: Record<string, unknown>): string | null {
  const direct = raw.output_text
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim()
  }
  const output = raw.output
  if (!Array.isArray(output)) return null
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (o.type === 'message' && o.role === 'assistant') {
      const content = o.content
      if (!Array.isArray(content)) continue
      for (const part of content) {
        if (!part || typeof part !== 'object') continue
        const p = part as Record<string, unknown>
        if (p.type === 'output_text' && typeof p.text === 'string' && p.text) {
          return p.text.trim()
        }
      }
    }
  }
  return null
}

function hasRefusal(raw: Record<string, unknown>): boolean {
  const output = raw.output
  if (!Array.isArray(output)) return false
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (o.type === 'refusal') return true
    if (o.type === 'message' && o.role === 'assistant') {
      const content = o.content
      if (!Array.isArray(content)) continue
      for (const part of content) {
        if (!part || typeof part !== 'object') continue
        if ((part as Record<string, unknown>).type === 'refusal') return true
      }
    }
  }
  return false
}

function clampStrings(input: ListingExtractResult): ListingExtractResult {
  return {
    title: input.title.trim().slice(0, 200),
    address: input.address.trim().slice(0, 500),
    price:
      input.price !== null &&
      typeof input.price === 'number' &&
      Number.isFinite(input.price)
        ? input.price
        : null,
    notes: input.notes.trim().slice(0, 5000)
  }
}

export async function extractListingWithOpenAI(
  env: Bindings,
  listingText: string,
  init?: { signal?: AbortSignal }
): Promise<ListingExtractResult> {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const model =
    typeof env.OPENAI_LISTING_MODEL === 'string' &&
    env.OPENAI_LISTING_MODEL.trim()
      ? env.OPENAI_LISTING_MODEL.trim()
      : 'gpt-4o-mini'

  const body = {
    model,
    store: false,
    instructions: `You extract structured apartment listing fields from marketing text, emails, or HTML snippets.
Rules:
- Only use facts that appear in the source text. Do not invent addresses, prices, or titles.
- If a field is not clearly supported by the text, use an empty string (including price when unknown).
- price must be a plain ASCII number string: optional digits, optional single dot for decimals, no thousands separators, no currency. Use empty string if absent or unclear.
- Strip boilerplate/navigation from HTML mentally; focus on the actual listing.`,
    input: `Source text:\n\n${listingText}`,
    text: {
      format: {
        type: 'json_schema',
        name: LISTING_SCHEMA_NAME,
        strict: true,
        schema: LISTING_JSON_SCHEMA
      }
    }
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: init?.signal
  })

  const rawText = await res.text()
  let rawJson: Record<string, unknown>
  try {
    rawJson = JSON.parse(rawText) as Record<string, unknown>
  } catch {
    throw new Error('OpenAI returned non-JSON')
  }

  if (!res.ok) {
    const msg =
      typeof rawJson.error === 'object' &&
      rawJson.error !== null &&
      typeof (rawJson.error as { message?: string }).message === 'string'
        ? (rawJson.error as { message: string }).message
        : `OpenAI error HTTP ${res.status}`
    throw new Error(msg)
  }

  if (hasRefusal(rawJson)) {
    throw new Error('The model refused to process this input')
  }

  const jsonStr = extractOutputTextJson(rawJson)
  if (!jsonStr) {
    throw new Error('OpenAI returned no structured output')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('OpenAI structured output was not valid JSON')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI structured output had unexpected shape')
  }

  const p = parsed as Record<string, unknown>
  const title = typeof p.title === 'string' ? p.title : ''
  const address = typeof p.address === 'string' ? p.address : ''
  const notes = typeof p.notes === 'string' ? p.notes : ''
  const rawPrice = typeof p.price === 'string' ? p.price.trim() : ''
  let price: number | null = null
  if (rawPrice !== '') {
    const n = Number(rawPrice.replace(',', '.'))
    if (Number.isFinite(n)) {
      price = n
    }
  }

  return clampStrings({ title, address, price, notes })
}
