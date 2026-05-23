import type { ApiChatMessage, ChatMessage, ChatRole, EmailDraft } from '@/types'

const STORAGE_PREFIX = 'commity:thread:'
export const MAX_API_MESSAGES = 20

type ThreadStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const memoryStore = new Map<string, string>()

const memoryStorage: ThreadStorage = {
  getItem(key) {
    return memoryStore.get(key) ?? null
  },
  setItem(key, value) {
    memoryStore.set(key, value)
  },
  removeItem(key) {
    memoryStore.delete(key)
  }
}

function isUsableLocalStorage(value: unknown): value is ThreadStorage {
  if (typeof value !== 'object' || value === null) return false
  const ls = value as ThreadStorage
  return (
    typeof ls.getItem === 'function' &&
    typeof ls.setItem === 'function' &&
    typeof ls.removeItem === 'function'
  )
}

function getStorage(): ThreadStorage {
  if (
    typeof globalThis !== 'undefined' &&
    isUsableLocalStorage(globalThis.localStorage)
  ) {
    return globalThis.localStorage
  }
  return memoryStorage
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function isChatRole(value: unknown): value is ChatRole {
  return value === 'user' || value === 'assistant' || value === 'system'
}

function parseEmailDraft(value: unknown): EmailDraft | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const d = value as EmailDraft
  if (
    typeof d.to !== 'string' ||
    typeof d.subject !== 'string' ||
    typeof d.body !== 'string'
  ) {
    return undefined
  }
  const draft: EmailDraft = {
    to: d.to,
    subject: d.subject,
    body: d.body
  }
  if (typeof d.cc === 'string' && d.cc) draft.cc = d.cc
  if (typeof d.bcc === 'string' && d.bcc) draft.bcc = d.bcc
  return draft
}

function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  const out: ChatMessage[] = []
  for (const item of raw) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as ChatMessage).id !== 'string' ||
      !isChatRole((item as ChatMessage).role) ||
      typeof (item as ChatMessage).content !== 'string' ||
      typeof (item as ChatMessage).createdAt !== 'string'
    ) {
      continue
    }
    const msg = item as ChatMessage
    const parsed: ChatMessage = {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt
    }
    const emailDraft = parseEmailDraft(msg.emailDraft)
    if (emailDraft) parsed.emailDraft = emailDraft
    if (msg.emailSent === true) parsed.emailSent = true
    out.push(parsed)
  }
  return out
}

export function loadThread(userId: string): ChatMessage[] {
  try {
    const raw = getStorage().getItem(storageKey(userId))
    if (!raw) return []
    return parseMessages(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveThread(userId: string, messages: ChatMessage[]): void {
  getStorage().setItem(storageKey(userId), JSON.stringify(messages))
}

export function clearThread(userId: string): void {
  getStorage().removeItem(storageKey(userId))
}

/** Test helper: reset in-memory fallback between tests. */
export function resetMemoryStorage(): void {
  memoryStore.clear()
}

export function createMessage(
  role: ChatRole,
  content: string,
  extra?: Pick<ChatMessage, 'emailDraft' | 'emailSent'>
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra
  }
}

export function sliceForApi(
  messages: ChatMessage[],
  max = MAX_API_MESSAGES
): ApiChatMessage[] {
  return messages.slice(-max).map(({ role, content }) => ({ role, content }))
}
