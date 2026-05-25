const DEFAULT_LOG_URL = 'http://127.0.0.1:8799/log'
const MAX_LOG_BODY_CHARS = 100_000

export type LocalLogEnv = {
  LOCAL_LOGS?: string
  /** Host-side log sink (see worker/scripts/localLogServer.mjs). */
  LOCAL_LOG_URL?: string
}

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|api[_-]?key/i

let requestLogEnv: LocalLogEnv | undefined
let sinkUnreachableWarned = false

export function isLocalLoggingEnabled(env?: LocalLogEnv): boolean {
  const flag = env?.LOCAL_LOGS?.trim().toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes'
}

/** Scope outbound/inbound logs to the current HTTP request (set by request logger middleware). */
export async function runWithLocalLogEnv<T>(
  env: LocalLogEnv,
  fn: () => Promise<T>
): Promise<T> {
  const prev = requestLogEnv
  requestLogEnv = env
  try {
    return await fn()
  } finally {
    requestLogEnv = prev
  }
}

function activeLogEnv(): LocalLogEnv | undefined {
  return requestLogEnv
}

function logSinkUrl(env?: LocalLogEnv): string {
  const custom = env?.LOCAL_LOG_URL?.trim()
  return custom || DEFAULT_LOG_URL
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function truncate(value: string): string {
  if (value.length <= MAX_LOG_BODY_CHARS) return value
  return `${value.slice(0, MAX_LOG_BODY_CHARS)}… [truncated ${value.length - MAX_LOG_BODY_CHARS} chars]`
}

export function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) {
    return '[REDACTED]'
  }
  if (typeof value === 'string' && /^Bearer\s+/i.test(value)) {
    return '[REDACTED Bearer]'
  }
  return value
}

export function redactData(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (Array.isArray(data)) {
    return data.map((item) => redactData(item))
  }
  if (typeof data === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      const redacted = redactValue(key, val)
      out[key] =
        redacted !== val && typeof val === 'string'
          ? redacted
          : redactData(redacted)
    }
    return out
  }
  if (typeof data === 'string' && data.length > MAX_LOG_BODY_CHARS) {
    return truncate(data)
  }
  return data
}

function headersToRecord(
  headers: HeadersInit | undefined
): Record<string, string> {
  if (!headers) return {}
  const record: Record<string, string> = {}
  const h = headers instanceof Headers ? headers : new Headers(headers)
  h.forEach((value, key) => {
    record[key] = redactValue(key, value) as string
  })
  return record
}

function bodyForLog(body: BodyInit | null | undefined): unknown {
  if (body === undefined || body === null) return undefined
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (!trimmed) return ''
    return redactData(tryParseJson(trimmed))
  }
  if (body instanceof URLSearchParams) {
    const params: Record<string, unknown> = {}
    body.forEach((value, key) => {
      params[key] = redactValue(key, value)
    })
    return params
  }
  return `[${body.constructor?.name ?? 'Body'}]`
}

export function writeLocalLog(entry: Record<string, unknown>): void {
  const env = activeLogEnv()
  if (!isLocalLoggingEnabled(env)) return

  const payload = JSON.stringify({
    ts: new Date().toISOString(),
    ...(redactData(entry) as Record<string, unknown>)
  })

  void fetch(logSinkUrl(env), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: payload
  }).catch((err) => {
    if (sinkUnreachableWarned) return
    sinkUnreachableWarned = true
    console.warn(
      '[localLogger] log sink unreachable (start API with pnpm dev — it runs localLogServer):',
      err instanceof Error ? err.message : err
    )
  })
}

export async function readBodyForLog(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('json') && !contentType.includes('text')) {
    return contentType ? `[${contentType}]` : undefined
  }
  const text = await request.text()
  if (!text.trim()) return undefined
  return redactData(tryParseJson(text))
}

export async function readResponseBodyForLog(
  response: Response
): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (response.status === 204) return null
  if (!contentType.includes('json') && !contentType.includes('text')) {
    return contentType ? `[${contentType}]` : undefined
  }
  const text = await response.text()
  if (!text.trim()) return undefined
  return redactData(tryParseJson(truncate(text)))
}

export async function loggedFetch(
  label: string,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const started = Date.now()
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  const method =
    init?.method ?? (input instanceof Request ? input.method : 'GET')

  writeLocalLog({
    kind: 'outbound',
    label,
    phase: 'request',
    url,
    method,
    headers: headersToRecord(init?.headers),
    body: bodyForLog(
      init?.body ?? (input instanceof Request ? input.body : null)
    )
  })

  const response = await fetch(input, init)
  let responseBody: unknown = '[failed to read]'
  try {
    responseBody = await readResponseBodyForLog(response.clone())
  } catch {
    /* ignore */
  }

  writeLocalLog({
    kind: 'outbound',
    label,
    phase: 'response',
    url,
    method,
    status: response.status,
    durationMs: Date.now() - started,
    body: responseBody
  })

  return response
}
