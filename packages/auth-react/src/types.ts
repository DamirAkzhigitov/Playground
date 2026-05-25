export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput

export type ApiRequestInit = {
  method?: string
  body?: Record<string, unknown> | BodyInit
}

export type ApiRequestFn = <T>(
  path: string,
  init?: ApiRequestInit
) => Promise<T>

export type UserRole = 'user' | 'contributor' | 'admin'
