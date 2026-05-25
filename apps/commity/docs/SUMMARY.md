# Commity — what this app is (onboarding summary)

Welcome. This page explains **Commity** in everyday terms: what it does, how people use it, and how the pieces fit together. Short pointers to code are included so you can dig deeper when you are ready.

**Live site:** [commity.da-mr.com](https://commity.da-mr.com) (a separate dev copy exists for testing before release).

---

## The big idea

Commity is a **personal AI assistant** in the browser — like a chat window where you talk to an AI that can help with everyday tasks. Today the main “extra” ability beyond normal chat is **drafting emails** and, if you choose, **sending them through your Gmail account**.

Each person gets **one long-running conversation** (not separate chat folders). The app is meant for a single owner (you), not a team inbox or public forum.

Think of it as: **sign in → one chat thread → ask questions or ask it to write an email → you stay in control before anything is sent.**

---

## What a user actually does

Each step has a **detailed guide** in this folder (flows, diagrams, code references):

1. **[Create an account or log in](./01-account-login.md)** — `/register`, `/login`, sessions, cookies.
2. **[The chat screen](./02-chat-screen.md)** — `ChatPage`, typing, sending, local persistence.
3. **[The assistant’s reply](./03-ai-reply.md)** — OpenAI on the server (`worker/src/openai.ts`).
4. **[Connect Gmail (optional)](./04-connect-gmail.md)** — OAuth in `worker/src/gmail/`; nothing sent until you confirm.
5. **[Email draft review](./05-email-draft-review.md)** — `EmailDraftCard`, edit, send or discard.
6. **[History on this device](./06-chat-history-backup.md)** — clear chat, JSON export; import not built yet.

There is no “pick a different chat” screen: one account, one thread.

---

## How the app is split (two halves, one website)

Commity is really **two programs that behave as one site**:

| Half | Plain English | Where it lives |
| ---- | ------------- | -------------- |
| **The screen you see** | Buttons, chat bubbles, login forms | `src/` — React app built with Vite |
| **The brain on the internet** | Checks who you are, talks to OpenAI, handles Gmail | `worker/` — Cloudflare Worker (small server at the edge) |

In production, both are served from the **same address** (e.g. `commity.da-mr.com`). The browser loads the React pages; when you send a message, it calls `/api/...` on the same domain. Locally you run the UI on port **3003** and the API on **8788**, with the dev server forwarding `/api` to the worker (`vite.config.ts`).

You do **not** need to memorize Cloudflare or Hono on day one — just know: **browser = UI, worker = secrets + AI + database.**

---

## Your chat history: where it lives (important)

**Almost all messages stay on your computer**, in the browser’s **local storage** (like a small notebook tied to this browser and this account).

- Saved per user under a key like `commity:thread:{userId}` — see `src/lib/chatHistory.ts`.
- The **server does not store** your chat lines in the database. If you change browser or clear site data, that history is gone unless you exported a backup.

When you send a new message, the app only ships the **last 20 messages** to the server for context (`sliceForApi` in `chatHistory.ts`, enforced again in `worker/src/routes/chat.ts`). Older lines remain on your device but the AI does not see them on that request. That keeps cost and privacy lean; very long threads may eventually need “summarize older messages” (planned, not done — see `PLAN.md`).

**In short:** the cloud knows **who you are** and **Gmail tokens if connected**; your **words mostly stay on your machine.**

---

## Accounts and “am I logged in?”

Sign-up and login work like many small web apps:

- You register with email + password.
- The server stores a **hashed password** and a **session** in **D1** (Cloudflare’s SQLite database) — tables in `worker/migrations/0001_auth.sql`.
- The browser keeps a **session cookie**; `AuthContext.tsx` asks `/api/auth/me` on load to see if you are still signed in.

Protected pages (the chat) only render when that session is valid (`ProtectedRoute.tsx`).

Same general pattern as the team’s **compare** app — useful if you have seen that codebase before.

---

## How talking to the AI works

1. You type in the chat UI.
2. The UI adds your message to local history and POSTs to **`/api/chat`**.
3. The worker checks you are logged in, validates the message list (1–20 items), and calls **OpenAI** (`openai.ts`). Default model is configured via environment variable (often `gpt-4o-mini`).
4. The assistant’s text comes back in one response (no streaming yet).
5. The UI appends the reply and saves again to local storage.

The system prompt tells the model it is “Commity” and must **not** claim an email was sent — only the user can send after review.

---

## Gmail: optional, consent-based

Gmail is **not required** to use the chat.

**Connect flow (high level):**

1. User clicks connect → redirect to Google → user approves send + email identity scopes.
2. The worker stores an **encrypted refresh token** in D1 (`0002_gmail.sql`, crypto in `worker/src/gmail/tokenCrypto.ts`).
3. Status is shown in the UI (connected address, disconnect).

**Draft flow:**

1. User asks something like “email Bob about the meeting.”
2. The model may call an internal tool **`prepare_email`** (`openai.ts`) with To, subject, body.
3. The API returns normal reply text plus an **`emailDraft`** object when applicable.
4. The UI shows `EmailDraftCard` — edit, then **Send** calls `/api/gmail/send` using the stored token.
5. If the model drafted an email but Gmail is not connected, the UI can prompt you to connect (`gmailRequired` in the chat response).

Nothing is sent silently: **draft → you review → you click send.**

---

## What the database (D1) is used for

| Stored in D1 | Not stored in D1 |
| ------------ | ---------------- |
| User accounts (email, password hash) | Chat message text |
| Login sessions | Full conversation export (unless you add cloud backup later) |
| Gmail OAuth tokens (encrypted) | |

So D1 is for **identity and integrations**, not for being a chat archive.

---

## Main code map (when you open the repo)

```
apps/commity/
├── src/                    ← Everything the user sees
│   ├── pages/              Login, register, chat
│   ├── contexts/           Auth state
│   ├── lib/                Chat history, API helper, Gmail client
│   └── components/         Email draft card, layout, UI widgets
├── worker/                 ← API + database + OpenAI + Gmail
│   ├── src/
│   │   ├── index.ts        Wires routes together
│   │   ├── routes/chat.ts  POST /api/chat
│   │   ├── openai.ts       AI + email draft tool
│   │   └── gmail/          OAuth and send
│   └── migrations/         SQL for D1
├── docs/                   ← You are here
├── README.md               Setup, env vars, deploy steps
├── AGENTS.md               Dense notes for AI/tools and experienced devs
└── PLAN.md                 Product decisions and todo checklist
```

**Routes in the UI** (`router.tsx`): `/login`, `/register`, `/` (chat, behind login).

**API surface (worker):** health check, `/api/auth/*`, `POST /api/chat`, `/api/gmail/*` — detailed table in `AGENTS.md`.

---

## Deploy and environments (light touch)

- **Production:** changes on the main branch can deploy to `commity.da-mr.com` via GitHub Actions (monorepo workflow).
- **Dev / PR preview:** `dev-commity.da-mr.com` for trying changes safely.
- Secrets (OpenAI key, Google OAuth, encryption key for tokens) live in **Wrangler secrets**, not in git. Local copy uses `worker/.dev.vars` from `.dev.vars.example`.

First-time production setup (real D1 database IDs, Google redirect URLs, etc.) is still partly checklist work in `PLAN.md`.

---

## What is intentionally *not* in v1

Knowing these avoids “why doesn’t it…?” moments:

- **No server-side chat archive** — by design.
- **No multiple chat threads / folders**.
- **No streaming** — you wait for the full reply.
- **No cloud sync** — `syncToCloud` in `chatBackup.ts` is a stub; export-to-file works, import UI does not.
- **Gmail:** no dedicated inbox page — search/star/trash via chat tools; send still needs draft confirmation.
- **No team features** — personal tool.

Future ideas live in `PLAN.md` (summarization, streaming, import backup, etc.).

---

## Glossary (quick)

| Term | Meaning here |
| ---- | ------------ |
| **Thread** | Your whole conversation with the assistant for one account |
| **Worker** | Small serverless program on Cloudflare that runs the API |
| **D1** | Cloudflare’s SQL database used for users, sessions, Gmail tokens |
| **localStorage** | Browser storage where chat messages are kept |
| **OAuth** | “Log in with Google” style flow so Commity can send mail on your behalf, with permission |
| **Tool calling** | How the AI returns structured data (email fields) instead of only plain text |

---

## Documentation index

| Doc | Topic |
| --- | ----- |
| [SUMMARY.md](./SUMMARY.md) | This page — product overview |
| [01-account-login.md](./01-account-login.md) | Register, login, sessions |
| [02-chat-screen.md](./02-chat-screen.md) | Chat UI and sending |
| [03-ai-reply.md](./03-ai-reply.md) | OpenAI / `POST /api/chat` |
| [04-connect-gmail.md](./04-connect-gmail.md) | Gmail OAuth |
| [05-email-draft-review.md](./05-email-draft-review.md) | Draft card and send |
| [06-chat-history-backup.md](./06-chat-history-backup.md) | localStorage, clear, export |
| [07-gmail-inbox-ai.md](./07-gmail-inbox-ai.md) | Inbox search/star/trash via chat |

## Where to go next as a developer

1. Run it locally — steps in [`README.md`](../README.md) (two terminals: API, then UI).
2. Click through: register → send a message → (optional) connect Gmail → ask for an email draft.
3. Read the numbered guides above for the path you are working on.
4. Read [`AGENTS.md`](../AGENTS.md) for commands, env vars, and conventions.
5. Read [`PLAN.md`](../PLAN.md) for what is done vs. still open.

If something in this summary and the code disagree, **trust the code** and consider updating this doc — the product is still evolving.
