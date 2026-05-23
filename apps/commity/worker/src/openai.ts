const OPENAI_BASE = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessageInput = {
  role: ChatRole
  content: string
}

export type EmailDraft = {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}

export type ChatCompletionResult = {
  content: string
  emailDraft?: EmailDraft
}

const SYSTEM_PROMPT = `You are Commity, a helpful personal assistant.
When the user wants to write or send an email, call the prepare_email tool with a complete draft.
Never claim an email was sent — the user must review and confirm sending separately.
If the request is not about email, respond normally without using tools.`

const PREPARE_EMAIL_TOOL = {
  type: 'function' as const,
  function: {
    name: 'prepare_email',
    description:
      'Prepare an email draft for the user to review before sending. Use when the user asks to write, compose, or send an email.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description:
            'Recipient email address(es), comma-separated if multiple'
        },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Plain-text email body' },
        cc: {
          type: 'string',
          description: 'Optional CC addresses, comma-separated'
        },
        bcc: {
          type: 'string',
          description: 'Optional BCC addresses, comma-separated'
        }
      },
      required: ['to', 'subject', 'body'],
      additionalProperties: false
    }
  }
}

type OpenAIToolCall = {
  id?: string
  type?: string
  function?: { name?: string; arguments?: string }
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      role?: string
      content?: string | null
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason?: string
  }>
  error?: { message?: string }
}

export function parsePrepareEmailArgs(raw: string): EmailDraft | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof parsed.to !== 'string' ||
      !parsed.to.trim() ||
      typeof parsed.subject !== 'string' ||
      !parsed.subject.trim() ||
      typeof parsed.body !== 'string' ||
      !parsed.body.trim()
    ) {
      return null
    }
    const draft: EmailDraft = {
      to: parsed.to.trim(),
      subject: parsed.subject.trim(),
      body: parsed.body.trim()
    }
    if (typeof parsed.cc === 'string' && parsed.cc.trim()) {
      draft.cc = parsed.cc.trim()
    }
    if (typeof parsed.bcc === 'string' && parsed.bcc.trim()) {
      draft.bcc = parsed.bcc.trim()
    }
    return draft
  } catch {
    return null
  }
}

function extractEmailDraft(
  toolCalls: OpenAIToolCall[] | undefined
): EmailDraft | undefined {
  if (!toolCalls?.length) return undefined
  for (const call of toolCalls) {
    if (call.function?.name !== 'prepare_email') continue
    const args = call.function.arguments
    if (typeof args !== 'string') continue
    const draft = parsePrepareEmailArgs(args)
    if (draft) return draft
  }
  return undefined
}

export async function completeChat(
  apiKey: string,
  model: string | undefined,
  messages: ChatMessageInput[]
): Promise<ChatCompletionResult> {
  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model?.trim() || DEFAULT_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      tools: [PREPARE_EMAIL_TOOL],
      tool_choice: 'auto'
    })
  })

  const body = (await response.json()) as OpenAIChatResponse

  if (!response.ok) {
    const detail =
      body.error?.message ?? `OpenAI request failed (${response.status})`
    throw new Error(detail)
  }

  const message = body.choices?.[0]?.message
  const emailDraft = extractEmailDraft(message?.tool_calls)

  const content =
    typeof message?.content === 'string' && message.content.trim()
      ? message.content.trim()
      : emailDraft
        ? "I've prepared an email draft for you to review below."
        : ''

  if (!content && !emailDraft) {
    throw new Error('OpenAI returned an empty response')
  }

  return {
    content: content || "I've prepared an email draft for you to review below.",
    emailDraft
  }
}
