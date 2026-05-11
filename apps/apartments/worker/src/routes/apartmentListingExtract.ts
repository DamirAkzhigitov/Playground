import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { extractListingWithOpenAI } from '../listingExtractOpenai'
import { fetchUrlTextSafe } from '../safeUrlText'

const MAX_PASTE_CHARS = 48_000
const MAX_FILE_BYTES = 128_000
const EXTRACT_TIMEOUT_MS = 55_000

const jsonBodySchema = z
  .object({
    text: z.string().max(MAX_PASTE_CHARS).optional(),
    url: z.string().max(2048).optional()
  })
  .superRefine((val, ctx) => {
    const text = val.text?.trim() ?? ''
    const url = val.url?.trim() ?? ''
    const n = (text !== '' ? 1 : 0) + (url !== '' ? 1 : 0)
    if (n !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide exactly one of text or url'
      })
    }
  })

function stripHtmlToApproxText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type ParsedBody = Record<string, string | File>

async function resolveSourceText(c: {
  req: {
    header: (n: string) => string | undefined
    json: () => Promise<unknown>
    parseBody: () => Promise<ParsedBody>
  }
}): Promise<string> {
  const ct = c.req.header('content-type') ?? ''

  if (ct.includes('application/json')) {
    const raw = jsonBodySchema.parse(await c.req.json())
    if (raw.text !== undefined && raw.text.trim() !== '') {
      return raw.text.trim().slice(0, MAX_PASTE_CHARS)
    }
    const signal = AbortSignal.timeout(EXTRACT_TIMEOUT_MS)
    const fetched = await fetchUrlTextSafe(raw.url!.trim(), { signal })
    return stripHtmlToApproxText(fetched).slice(0, MAX_PASTE_CHARS)
  }

  if (
    ct.includes('multipart/form-data') ||
    ct.includes('application/x-www-form-urlencoded')
  ) {
    const body = await c.req.parseBody()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const file = body.file

    let fileText = ''
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const f = file as File
      if (f.size > MAX_FILE_BYTES) {
        throw new Error('Uploaded file is too large')
      }
      const mime = (f.type ?? '').toLowerCase()
      const lowerName = f.name.toLowerCase()
      const mimeOk =
        mime === 'text/plain' ||
        mime === 'text/markdown' ||
        mime === 'application/json' ||
        mime === ''
      const extOk =
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.json')
      if (!mimeOk && !extOk) {
        throw new Error(
          'Unsupported file type. Use a .txt, .md, or .json text file.'
        )
      }
      fileText = (await f.text()).slice(0, MAX_PASTE_CHARS)
    }

    const n =
      (text !== '' ? 1 : 0) + (url !== '' ? 1 : 0) + (fileText !== '' ? 1 : 0)
    if (n !== 1) {
      throw new Error(
        'Provide exactly one of pasted text, listing URL, or file'
      )
    }
    if (fileText !== '') {
      return fileText
    }
    if (text !== '') {
      return text.slice(0, MAX_PASTE_CHARS)
    }
    const signal = AbortSignal.timeout(EXTRACT_TIMEOUT_MS)
    const fetched = await fetchUrlTextSafe(url, { signal })
    return stripHtmlToApproxText(fetched).slice(0, MAX_PASTE_CHARS)
  }

  throw new Error('Unsupported Content-Type')
}

const listingExtract = new Hono<AppEnv>()

listingExtract.post('/', async (c) => {
  if (!c.env.OPENAI_API_KEY) {
    return c.json(
      {
        error:
          'Listing extraction is not configured on this server (missing OPENAI_API_KEY).'
      },
      503
    )
  }

  try {
    const source = await resolveSourceText(c)
    if (!source.trim()) {
      return c.json(
        { error: 'No text could be read from the provided source' },
        400
      )
    }

    const signal = AbortSignal.timeout(EXTRACT_TIMEOUT_MS)
    const extracted = await extractListingWithOpenAI(c.env, source, { signal })

    return c.json({
      title: extracted.title,
      address: extracted.address,
      price: extracted.price,
      notes: extracted.notes
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: e.flatten() }, 400)
    }
    const msg = e instanceof Error ? e.message : 'Extraction failed'
    if (msg === 'Unsupported Content-Type') {
      return c.json({ error: msg }, 415)
    }
    if (
      msg.includes('Provide exactly one') ||
      msg.includes('too large') ||
      msg.includes('Unsupported file') ||
      msg.includes('Only HTTPS') ||
      msg.includes('not allowed') ||
      msg.includes('Invalid URL') ||
      msg.includes('Private') ||
      msg.includes('credentials')
    ) {
      return c.json({ error: msg }, 400)
    }
    console.error('listing extract error', e)
    return c.json({ error: msg }, 502)
  }
})

export { listingExtract }
