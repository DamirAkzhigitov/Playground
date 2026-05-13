/** Max bytes read from a user-supplied URL (defense-in-depth with SSRF fetch). */
export const MAX_URL_RESPONSE_BYTES = 256_000

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.goog'
])

function isIpv4Literal(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
}

function isPrivateOrReservedIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return false
  const [a, b, c, d] = m.slice(1, 5).map((x) => Number(x))
  if ([a, b, c, d].some((n) => n > 255 || Number.isNaN(n))) return true
  if (a === 0 || a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 192 && b === 0 && c === 0) return true
  if (a === 192 && b === 0 && c === 2) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a === 224 || a >= 240) return true
  return false
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[/, '').replace(/]$/, '')
  if (!h.includes(':')) return false
  if (h === '::1' || h.endsWith(':0:0:0:0:0:0:1')) return true
  if (h.startsWith('fe80:')) return true
  if (h.startsWith('fc') || h.startsWith('fd')) return true
  if (h.startsWith('fec0:')) return true
  return false
}

export function assertSafeHttpsUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed')
  }
  if (url.username || url.password) {
    throw new Error('URL must not include credentials')
  }
  const host = url.hostname.toLowerCase()
  if (!host || host.length > 253) {
    throw new Error('Invalid hostname')
  }
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.local')) {
    throw new Error('This hostname is not allowed')
  }
  if (isIpv4Literal(host) && isPrivateOrReservedIpv4(host)) {
    throw new Error('Private and reserved IP addresses are not allowed')
  }
  if (isBlockedIpv6(host)) {
    throw new Error('Private and link-local IPv6 addresses are not allowed')
  }
  return url
}

async function readBodyWithCap(
  response: Response,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) {
    const buf = new Uint8Array(await response.arrayBuffer())
    return buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf
  }
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      const take = Math.min(value.byteLength, maxBytes - total)
      if (take <= 0) {
        await reader.cancel()
        break
      }
      chunks.push(take === value.byteLength ? value : value.slice(0, take))
      total += take
      if (total >= maxBytes) {
        await reader.cancel()
        break
      }
    }
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes)
}

const MAX_REDIRECTS = 5

export async function fetchUrlTextSafe(
  urlString: string,
  init?: { signal?: AbortSignal }
): Promise<string> {
  let current = assertSafeHttpsUrl(urlString).toString()
  const signal = init?.signal

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': 'ApartmentsListingExtract/1.0',
        Accept:
          'text/html,text/plain,application/xhtml+xml,application/json;q=0.9,*/*;q=0.1'
      }
    })

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc || hop === MAX_REDIRECTS) {
        throw new Error('Too many redirects or missing Location header')
      }
      const next = new URL(loc, current).toString()
      assertSafeHttpsUrl(next)
      current = next
      continue
    }

    if (!res.ok) {
      throw new Error(`URL returned HTTP ${res.status}`)
    }

    const bytes = await readBodyWithCap(res, MAX_URL_RESPONSE_BYTES)
    return decodeUtf8(bytes)
  }

  throw new Error('Redirect loop')
}
