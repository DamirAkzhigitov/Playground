import { describe, expect, it } from 'vitest'

import { decryptToken, encryptToken } from './tokenCrypto'

const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))

describe('tokenCrypto', () => {
  it('round-trips encrypt and decrypt', async () => {
    const plain = 'refresh-token-abc-123'
    const enc = await encryptToken(plain, TEST_KEY)
    expect(enc).not.toContain(plain)
    const dec = await decryptToken(enc, TEST_KEY)
    expect(dec).toBe(plain)
  })

  it('rejects invalid key length', async () => {
    await expect(encryptToken('x', btoa('short'))).rejects.toThrow(
      'TOKEN_ENCRYPTION_KEY'
    )
  })
})
