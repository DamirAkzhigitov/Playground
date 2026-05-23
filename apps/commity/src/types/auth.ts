export type AuthUser = {
  id: string
  email: string
  createdAt: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type ChatRole = 'user' | 'assistant' | 'system'

export type EmailDraft = {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  emailDraft?: EmailDraft
  emailSent?: boolean
}

export type ApiChatMessage = {
  role: ChatRole
  content: string
}
