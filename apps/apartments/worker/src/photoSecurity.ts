/** Max photo upload size (bytes). Mobile photos are typically well under this. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export type AllowedImageMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'

/**
 * Detect image MIME from magic bytes only (do not trust client `File.type`).
 */
export function detectImageContentType(
  bytes: Uint8Array
): AllowedImageMime | null {
  if (bytes.length < 3) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x39 || bytes[4] === 0x37) &&
    bytes[5] === 0x61
  ) {
    return 'image/gif'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

/**
 * Single path segment safe suffix for R2 keys (no slashes or control chars).
 */
export function safePhotoFilename(original: string): string {
  const base = original.replace(/\\/g, '/').split('/').pop() ?? 'photo'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120)
  return cleaned.length > 0 ? cleaned : 'photo.bin'
}
