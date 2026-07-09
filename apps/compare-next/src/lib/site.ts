export const SITE_NAME = 'Compare'

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv

  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://compare.da-mr.com'
}
