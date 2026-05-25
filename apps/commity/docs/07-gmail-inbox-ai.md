# 7. Gmail inbox management in chat

With Gmail connected using the **`gmail.modify`** scope, the assistant can manage your mailbox during chat — no separate inbox page.

**Related:** [04-connect-gmail.md](./04-connect-gmail.md), [03-ai-reply.md](./03-ai-reply.md)

---

## What you can ask

| Intent | Example | Tool (server) |
| ------ | ------- | ------------- |
| Search | “Find unread mail from Alice this week” | `search_emails` |
| Read one | “Show me message abc123” | `get_email` |
| Favorite | “Star the latest from Bob” | `star_email` |
| Remove | “Trash that message” | `trash_email` |
| Undo trash | “Restore message abc123” | `untrash_email` |
| Permanent delete | “Permanently delete message abc123” | `delete_email_permanently` |
| Compose | “Email Carol about Friday” | `prepare_email` → draft card |

**Default for “delete” or “remove”:** move to **Trash** (recoverable in Gmail). Permanent delete only when you clearly ask for it.

**Send:** still uses the draft review card — the assistant never sends without you clicking **Send email**.

---

## How it works

1. `POST /api/chat` loads your Gmail account and a fresh access token when connected and not `needsReconnect`.
2. [`worker/src/openai.ts`](../worker/src/openai.ts) runs up to **5** OpenAI rounds: model may call inbox tools; the worker executes them via [`worker/src/gmail/inboxTools.ts`](../worker/src/gmail/inboxTools.ts) and [`gmailApi.ts`](../worker/src/gmail/gmailApi.ts).
3. Tool results (subjects, snippets, `messageId`) go back to the model so it can summarize or act on the next round.
4. The final assistant text appears in the chat bubble.

Message snippets flow through **OpenAI** (same as draft text today). Keep that in mind for sensitive mail.

---

## Gmail search syntax

The `search_emails` tool passes your query as Gmail’s `q` parameter. Examples:

- `from:alice@example.com`
- `is:unread newer_than:7d`
- `subject:invoice label:inbox`

---

## Reconnect after scope upgrade

Accounts linked with the old **`gmail.send`** scope cannot use inbox tools until you **Reconnect Gmail** (header button when `needsReconnect` is true).

---

## Safety notes

- List results are capped (15 messages per search server-side).
- Metadata + snippet only — not full HTML bodies.
- OAuth errors (401/403) return `needsReconnect` so the UI can prompt reconnect.
