const PROD_AUTH_ORIGIN = 'https://auth.da-mr.com'
const DEV_AUTH_ORIGIN = 'http://localhost:3004'

/** Vite dev ports for compare, steps, auth, main. */
export const DEV_RETURN_URL_PORTS = new Set([
  3000, 3002, 3003, 3004, 8787, 8788, 8789
])

export function getAuthOrigin(): string {
  const fromEnv = import.meta.env.VITE_AUTH_ORIGIN as string | undefined
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? DEV_AUTH_ORIGIN : PROD_AUTH_ORIGIN
}

export function buildAuthLoginUrl(returnUrl: string): string {
  const origin = getAuthOrigin()
  return `${origin}/login?returnUrl=${encodeURIComponent(returnUrl)}`
}

export function buildAuthRegisterUrl(returnUrl: string): string {
  const origin = getAuthOrigin()
  return `${origin}/register?returnUrl=${encodeURIComponent(returnUrl)}`
}

function isAllowedDevHost(hostname: string, port: number): boolean {
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return false
  }
  return DEV_RETURN_URL_PORTS.has(port)
}

function isAllowedProductionHost(hostname: string): boolean {
  return hostname === 'da-mr.com' || hostname.endsWith('.da-mr.com')
}

/**
 * Reject open redirects: only https tool subdomains and local dev ports.
 */
export function validateReturnUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return false
  }

  const port =
    parsed.port === ''
      ? parsed.protocol === 'https:'
        ? 443
        : 80
      : Number.parseInt(parsed.port, 10)

  if (Number.isNaN(port)) {
    return false
  }

  if (parsed.protocol === 'http:') {
    return isAllowedDevHost(parsed.hostname, port)
  }

  if (port !== 443) {
    return false
  }

  return isAllowedProductionHost(parsed.hostname)
}

export function resolveReturnUrl(
  candidate: string | null | undefined,
  fallback: string
): string {
  if (candidate && validateReturnUrl(candidate)) {
    return candidate
  }
  return fallback
}
