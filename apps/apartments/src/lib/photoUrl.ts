const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** Public URL for a photo stored in R2, served by `GET /api/photos/:key`. */
export function photoPublicUrl(r2Key: string): string {
  return `${API_BASE_URL}/api/photos/${encodeURIComponent(r2Key)}`
}
