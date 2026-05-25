# 6. Chat history on this device — clear and backup

Commity treats **your browser** as the long-term home for conversation text. The server only receives a **slice** of recent messages when you ask for a reply. This page covers loading, saving, clearing, and exporting — and what is **not** built yet (import, cloud sync).

**Related:** [02-chat-screen.md](./02-chat-screen.md) (UI buttons), [01-account-login.md](./01-account-login.md) (per-user isolation).

---

## Plain-language model

| Data | Where it lives |
| ---- | -------------- |
| Full chat thread (all messages you’ve sent/received in this browser) | `localStorage` on your device |
| Last 20 messages per API call | Sent temporarily to the worker → OpenAI |
| Account password, session, Gmail tokens | Cloudflare D1 (server) |

If you clear site data, use another browser, or another computer, you **will not** see the same thread unless you restore from a backup file (import UI not implemented yet).

---

## Storage key and format

File: `src/lib/chatHistory.ts`

**Key pattern:** `commity:thread:{userId}`

```42:44:src/lib/chatHistory.ts
function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}
```

**Value:** JSON array of `ChatMessage` objects:

| Field | Purpose |
| ----- | ------- |
| `id` | Stable id for UI updates |
| `role` | `user` or `assistant` (and `system` if ever used) |
| `content` | Bubble text |
| `createdAt` | ISO timestamp |
| `emailDraft?` | Optional draft card data |
| `emailSent?` | `true` after successful send |

### Load / save / clear

```99:115:src/lib/chatHistory.ts
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
```

`parseMessages` is defensive — corrupt or partial JSON entries are skipped instead of crashing the app.

### What goes to the API

```136:141:src/lib/chatHistory.ts
export function sliceForApi(
  messages: ChatMessage[],
  max = MAX_API_MESSAGES
): ApiChatMessage[] {
  return messages.slice(-max).map(({ role, content }) => ({ role, content }))
}
```

`MAX_API_MESSAGES` is **20**. Older messages remain in `localStorage` but are invisible to the model on that request.

---

## When save happens

Every time `ChatPage` updates the list through `persistMessages`:

- New user message (optimistic)
- Assistant reply
- Edit email draft on a message
- Mark email sent / discard draft
- Clear conversation

There is **no** separate “Save” button — persistence is automatic.

---

## Clear conversation

**UI:** **Clear** button in chat toolbar (`ChatPage.tsx`).

```141:145:src/pages/ChatPage.tsx
  const handleClear = () => {
    clearThread(userId)
    setMessages([])
    toast.success('Conversation cleared')
  }
```

- Removes storage key for this `userId`.
- Does **not** delete your account or Gmail connection on the server.
- Cannot be undone unless you have an exported backup.

Button is disabled when `messages.length === 0`.

---

## Export backup (download JSON)

**UI:** **Export backup** in the same toolbar.

Implementation: `src/lib/chatBackup.ts`

### Payload shape

```7:18:src/lib/chatBackup.ts
export type ChatBackupPayload = {
  version: 1
  exportedAt: string
  messages: ChatMessage[]
}

export function exportThread(messages: ChatMessage[]): ChatBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    messages
  }
}
```

### Download

```21:31:src/lib/chatBackup.ts
export function downloadThreadBackup(messages: ChatMessage[]): void {
  const payload = exportThread(messages)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `commity-backup-${payload.exportedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
```

Filename example: `commity-backup-2026-05-23.json`.

Includes full messages (including `emailDraft` / `emailSent` if present). **Does not** include password or Gmail tokens.

---

## Import backup — not built

There is **no** UI to upload a JSON file and restore `messages` into `localStorage`.

`PLAN.md` lists “Import backup” as a v1 polish todo. To implement later you would likely:

1. Add file picker + validate `ChatBackupPayload` version.
2. `saveThread(userId, parsed.messages)` and refresh `ChatPage` state.
3. Warn before overwriting a non-empty thread.

---

## Cloud sync — stub only

```34:36:src/lib/chatBackup.ts
export async function syncToCloud(_messages: ChatMessage[]): Promise<void> {
  throw new Error('Cloud backup is not available yet')
}
```

Reserved extension point; no R2/D1 blob implementation yet.

---

## Tests and non-browser environments

Vitest uses an in-memory `Map` fallback when `localStorage` is unusable (`memoryStorage` in `chatHistory.ts`). Tests call `resetMemoryStorage()` between runs.

This is why unit tests can run in Node without a real browser storage API.

---

## Per-account isolation

`ChatPageRoute` passes `user.id` into `ChatPage` and uses `key={user.id}` so switching accounts on the same machine loads a **different** storage key. Logging out does not erase storage — signing back in restores that account’s thread.

---

## Privacy / support talking points

- “We don’t store your chat on our database” — accurate for message **content**.
- “Clear browser data = lose history unless you exported” — accurate.
- “Export is a manual JSON file” — no automatic cloud backup today.

---

## Quick reference table

| User action | Function | Storage effect |
| ----------- | -------- | -------------- |
| Open chat | `loadThread(userId)` | Read |
| Send / receive | `saveThread` | Write full array |
| Clear | `clearThread` | Delete key |
| Export | `downloadThreadBackup` | No storage change (download only) |
| (Future) Import | TBD | Would `saveThread` |

**Back to overview:** [SUMMARY.md](./SUMMARY.md)
