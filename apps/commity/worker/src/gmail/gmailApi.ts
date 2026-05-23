export type SendEmailInput = {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}

function encodeHeaderValue(value: string): string {
  return value.replace(/\r?\n/g, ' ')
}

function parseAddressList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function formatAddressList(addresses: string[]): string {
  return addresses.join(', ')
}

export function buildMimeMessage(input: SendEmailInput): string {
  const to = parseAddressList(input.to)
  if (to.length === 0) {
    throw new Error('At least one recipient is required')
  }

  const lines: string[] = [
    `To: ${formatAddressList(to)}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    ''
  ]

  const cc = parseAddressList(input.cc)
  if (cc.length > 0) {
    lines.splice(1, 0, `Cc: ${formatAddressList(cc)}`)
  }

  const bcc = parseAddressList(input.bcc)
  if (bcc.length > 0) {
    lines.splice(cc.length > 0 ? 2 : 1, 0, `Bcc: ${formatAddressList(bcc)}`)
  }

  lines.push(input.body.replace(/\r\n/g, '\n'))
  return lines.join('\r\n')
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendGmailMessage(
  accessToken: string,
  input: SendEmailInput
): Promise<{ id: string }> {
  const mime = buildMimeMessage(input)
  const raw = toBase64Url(new TextEncoder().encode(mime))

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    }
  )

  const body = (await response.json()) as {
    id?: string
    error?: { message?: string }
  }

  if (!response.ok || !body.id) {
    throw new Error(body.error?.message ?? 'Failed to send email')
  }

  return { id: body.id }
}
