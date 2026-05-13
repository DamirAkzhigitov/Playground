const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const withBaseUrl = (path: string): string => `${API_BASE_URL}${path}`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const headers = new Headers(options.headers)
  let body: BodyInit | undefined

  if (options.body !== undefined) {
    if (options.body instanceof FormData || typeof options.body === 'string') {
      body = options.body
    } else {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.body)
    }
  }

  const response = await fetch(withBaseUrl(path), {
    ...options,
    headers,
    body
  })

  const parsedBody = await parseResponseBody(response)

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.location.href = '/login'
      return undefined as never
    }
    const fallbackMessage = `Request failed with status ${response.status}`
    const message =
      isRecord(parsedBody) && typeof parsedBody.error === 'string'
        ? parsedBody.error
        : fallbackMessage
    throw new ApiError(message, response.status, parsedBody)
  }

  if (
    path.startsWith('/api') &&
    response.status !== 204 &&
    parsedBody !== null
  ) {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      throw new ApiError(
        `API returned non-JSON (${contentType || 'no Content-Type'}). Expected same-origin /api from the compare app build, or set VITE_API_BASE_URL to your API origin.`,
        response.status,
        parsedBody
      )
    }
  }

  return parsedBody as T
}
