import { resolveReturnUrl } from '@playground/auth-react'

const defaultReturnUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://da-mr.com'

export function readReturnUrl(searchParams: URLSearchParams): string {
  const candidate = searchParams.get('returnUrl')
  return resolveReturnUrl(candidate, defaultReturnUrl)
}
