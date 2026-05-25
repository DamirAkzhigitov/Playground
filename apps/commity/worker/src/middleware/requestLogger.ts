import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from '../types'
import {
  isLocalLoggingEnabled,
  readBodyForLog,
  readResponseBodyForLog,
  redactData,
  runWithLocalLogEnv,
  writeLocalLog
} from '../lib/localLogger'

const SESSION_COOKIE = 'session'

export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!isLocalLoggingEnabled(c.env)) {
    await next()
    return
  }

  return runWithLocalLogEnv(c.env, async () => {
    const started = Date.now()
    const requestId = crypto.randomUUID()
    const clonedRequest = c.req.raw.clone()

    let requestBody: unknown
    try {
      requestBody = await readBodyForLog(clonedRequest)
    } catch {
      requestBody = '[failed to read request body]'
    }

    const query: Record<string, string> = {}
    const url = new URL(c.req.url)
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    writeLocalLog({
      kind: 'inbound',
      phase: 'request',
      requestId,
      method: c.req.method,
      path: c.req.path,
      query: redactData(query),
      headers: redactData(
        Object.fromEntries(
          [...c.req.raw.headers.entries()].map(([k, v]) => [
            k,
            k.toLowerCase() === 'cookie' ? '[REDACTED]' : v
          ])
        )
      ),
      body: requestBody
    })

    await next()

    const userId = c.get('userId')
    const sessionPresent = Boolean(getCookie(c, SESSION_COOKIE))

    let responseBody: unknown
    try {
      responseBody = await readResponseBodyForLog(c.res.clone())
    } catch {
      responseBody = '[failed to read response body]'
    }

    writeLocalLog({
      kind: 'inbound',
      phase: 'response',
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - started,
      userId: userId ?? undefined,
      sessionPresent,
      body: responseBody
    })
  })
}
