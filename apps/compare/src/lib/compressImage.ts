/**
 * Client-side downscale + JPEG re-encode before upload to reduce R2 usage
 * and load times. Falls back to the original file when decoding fails.
 */

const OUTPUT_TYPE = 'image/jpeg'
const OUTPUT_QUALITY = 0.82
const MAX_EDGE_PX = 1920
/** Skip re-encoding tiny JPEGs that are unlikely to be camera originals. */
const SKIP_IF_UNDER_BYTES = 120_000

function stripExtension(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }
  if (file.type === 'image/svg+xml') {
    return file
  }
  if (
    file.type === 'image/jpeg' &&
    file.size > 0 &&
    file.size < SKIP_IF_UNDER_BYTES
  ) {
    return file
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  try {
    const { width, height } = bitmap
    if (!width || !height) {
      return file
    }

    const largest = Math.max(width, height)
    const scale = largest > MAX_EDGE_PX ? MAX_EDGE_PX / largest : 1
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    if (scale === 1 && file.type === 'image/jpeg' && file.size < 350_000) {
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return file
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetW, targetH)
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), OUTPUT_TYPE, OUTPUT_QUALITY)
    })
    if (!blob || blob.size === 0) {
      return file
    }

    const base = stripExtension(file.name) || 'photo'
    return new File([blob], `${base}.jpg`, {
      type: OUTPUT_TYPE,
      lastModified: Date.now()
    })
  } finally {
    bitmap.close()
  }
}
