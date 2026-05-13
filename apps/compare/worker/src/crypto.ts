const ITERATIONS = 100_000
const KEY_LENGTH = 32
const SALT_LENGTH = 16
const HASH_ALGO = 'SHA-256'

const toBase64 = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))

const fromBase64 = (str: string): Uint8Array =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoded = new TextEncoder().encode(password)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoded.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGO
    },
    keyMaterial,
    KEY_LENGTH * 8
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(salt)
  const derived = await deriveKey(password, salt)
  return `${toBase64(salt.buffer as ArrayBuffer)}:${toBase64(derived)}`
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':')
  if (!saltB64 || !hashB64) return false
  const salt = fromBase64(saltB64)
  const derived = await deriveKey(password, salt)
  const expected = fromBase64(hashB64)
  const actual = new Uint8Array(derived)
  if (expected.length !== actual.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected[i]! ^ actual[i]!
  return diff === 0
}
