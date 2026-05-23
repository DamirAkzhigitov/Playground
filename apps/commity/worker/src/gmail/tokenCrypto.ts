const IV_LENGTH = 12

const toBase64 = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))

const fromBase64 = (str: string): Uint8Array =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

async function importKey(encryptionKey: string): Promise<CryptoKey> {
  const raw = fromBase64(encryptionKey.trim())
  if (raw.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)')
  }
  return crypto.subtle.importKey(
    'raw',
    raw.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptToken(
  plaintext: string,
  encryptionKey: string
): Promise<string> {
  const key = await importKey(encryptionKey)
  const iv = new Uint8Array(IV_LENGTH)
  crypto.getRandomValues(iv)
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoded.buffer as ArrayBuffer
  )
  return `${toBase64(iv.buffer as ArrayBuffer)}:${toBase64(ciphertext)}`
}

export async function decryptToken(
  stored: string,
  encryptionKey: string
): Promise<string> {
  const [ivB64, cipherB64] = stored.split(':')
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted token format')
  }
  const key = await importKey(encryptionKey)
  const iv = fromBase64(ivB64)
  const ciphertext = fromBase64(cipherB64)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )
  return new TextDecoder().decode(plain)
}
