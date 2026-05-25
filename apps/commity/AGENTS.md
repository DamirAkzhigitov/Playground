# AGENTS.md — Commity

Personal AI assistant at **https://commity.da-mr.com** (dev: **https://dev-commity.da-mr.com**).

Two workspaces in this directory:

| Package | Path | Role |
| ------- | ---- | ---- |
| `@playground/commity` | `.` | React 19 + Vite 8 SPA (port **3003**) |
| `@playground/commity-api` | `worker/` | Cloudflare Worker + Hono API (port **8788**) |

Deploy is a **single Worker** that serves `dist/` as static assets and `/api/*` on the same origin (same pattern as `apps/compare`). See repo-root [`AGENTS.md`](../../AGENTS.md) for monorepo-wide commands (`pnpm install`, lint, CI).

## Architecture

- **Chat history** lives in the browser (`localStorage`, key `commity:thread:{userId}`). D1 does **not** store messages.
- **Context per turn:** the client sends at most the **last 20 messages** on `POST /api/chat`.
- **Auth:** cookie sessions in D1 (`users`, `sessions`) — same pattern as compare.
- **LLM:** OpenAI `chat/completions` from the Worker (`OPENAI_API_KEY`, optional `OPENAI_MODEL`, default `gpt-4o-mini`).
- **Gmail (optional):** Google OAuth (`gmail.modify`) stores encrypted refresh tokens in D1. The model can call inbox tools (search/star/trash) in a server-side tool loop and `prepare_email` for outbound drafts; the user reviews before send.

```
Browser (localStorage) ──POST /api/chat (≤20 msgs)──► Worker ──► OpenAI
                              │                         │
                              └── cookies ─────────────► D1 (auth + Gmail tokens)
```

## Quick reference

Run from **repo root** unless noted.

| Task | Command |
| ---- | ------- |
| Install (whole monorepo) | `pnpm install` |
| Dev — client | `pnpm --filter @playground/commity dev` → http://localhost:3003 |
| Dev — API | `pnpm --filter @playground/commity-api dev` → http://localhost:8788 |
| D1 migrations (local) | `pnpm --filter @playground/commity-api run db:migrate:local` |
| D1 migrations (remote prod) | `pnpm --filter @playground/commity-api run db:migrate:remote` |
| D1 migrations (remote dev env) | `pnpm --filter @playground/commity-api run db:migrate:remote:dev` |
| Lint (client) | `pnpm --filter @playground/commity lint` |
| Type-check (both) | `pnpm --filter @playground/commity type-check` and `pnpm --filter @playground/commity-api type-check` |
| Test (client) | `pnpm --filter @playground/commity test` |
| Test (worker) | `pnpm --filter @playground/commity-api test` |
| Build client → `dist/` | `pnpm --filter @playground/commity build` |
| Deploy Worker (manual) | Build client, then `pnpm --filter @playground/commity-api deploy` (or `deploy:dev`) |

Local dev needs **two terminals**: API first (migrations + wrangler), then Vite. Vite proxies `/api` → `8788` and forwards `X-Forwarded-Host` / `X-Forwarded-Proto` for OAuth.

## Local setup

```bash
cp apps/commity/worker/.dev.vars.example apps/commity/worker/.dev.vars
# Edit: OPENAI_API_KEY; for Gmail also GOOGLE_CLIENT_*, TOKEN_ENCRYPTION_KEY, APP_PUBLIC_ORIGIN

pnpm --filter @playground/commity-api run db:migrate:local
pnpm --filter @playground/commity-api dev

pnpm --filter @playground/commity dev
```

**Never commit** `worker/.dev.vars` (secrets). `.dev.vars.example` is the template.

### Gmail OAuth (local)

1. Google Cloud: enable Gmail API; Web OAuth client with scopes `gmail.modify` and `userinfo.email`.
2. Redirect URI: **`http://localhost:3003/api/gmail/callback`** (matches Vite proxy). If hitting the Worker directly, use port **8788** instead — redirect URI must match the browser origin.
3. In `.dev.vars`: set `APP_PUBLIC_ORIGIN=http://localhost:3003` so `resolvePublicOrigin` builds the same redirect as Google Console.

Production redirect URIs: `https://commity.da-mr.com/api/gmail/callback` and `https://dev-commity.da-mr.com/api/gmail/callback`.

## Key paths

| Path | Role |
| ---- | ---- |
| `src/pages/ChatPage.tsx` | Main chat UI, composer, Gmail connect |
| `src/lib/chatHistory.ts` | Load/save thread, `sliceForApi(20)` |
| `src/lib/api.ts` | Fetch wrapper (`credentials: 'include'`) |
| `src/contexts/AuthContext.tsx` | Session state |
| `worker/src/index.ts` | Hono app, auth middleware, route mounting |
| `worker/src/routes/chat.ts` | `POST /api/chat` |
| `worker/src/openai.ts` | OpenAI client + `prepare_email` tool |
| `worker/src/gmail/` | OAuth, token crypto, send API |
| `worker/migrations/` | D1 schema (`0001_auth.sql`, `0002_gmail.sql`) |
| `worker/wrangler.toml` | Worker name, routes, D1, assets binding |
| `vite.config.ts` | Port 3003, `/api` proxy |
| `README.md` | Human-oriented setup and deploy |
| `PLAN.md` | Product decisions and implementation status |

## API surface (Worker)

| Route | Auth | Notes |
| ----- | ---- | ----- |
| `GET /api/health` | No | Liveness |
| `/api/auth/*` | Mixed | Register, login, logout, me |
| `POST /api/chat` | Yes | Body: `{ messages: [...] }`, 1–20 items |
| `/api/gmail/*` | Yes (except callback) | Connect, status, send; `GET /api/gmail/callback` is public |

## Environment & secrets

**Local** (`worker/.dev.vars`): `OPENAI_API_KEY`, `OPENAI_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (32 bytes base64: `openssl rand -base64 32`), `APP_PUBLIC_ORIGIN`, optional `LOCAL_LOGS=true` + `LOCAL_LOG_URL=http://127.0.0.1:8799/log` (API `pnpm dev` starts `scripts/localLogServer.mjs`; NDJSON in `worker/logs/` — inbound `/api/*` plus outbound OpenAI/Gmail/Google; secrets redacted).

**Production** (Wrangler secrets on `commity-api` / `commity-api-dev`): same keys; no `APP_PUBLIC_ORIGIN` needed when the request host is the real domain.

**Build** (client): `VITE_COMMITY_ORIGIN` is set in CI for links from `apps/main`; optional `VITE_API_BASE_URL` if API is not same-origin.

## Deploy (CI)

`.github/workflows/deploy.yml`:

- **Push to default branch** with `apps/commity/**` changes → build client, `wrangler deploy` → `commity.da-mr.com`.
- **PRs** → `deploy:dev` → `dev-commity.da-mr.com`.

Before first production deploy: create D1 databases `commity-db` / `commity-db-dev`, replace placeholder `database_id` values in `worker/wrangler.toml`, run remote migrations, set Worker secrets, attach custom domains.

## Conventions for agents

- **pnpm only**; Node **22+**; do not add npm/yarn lockfiles.
- Match compare-style patterns for auth (cookies, `requireAuth`, D1) and Worker+SPA layout.
- Keep chat state on the client unless explicitly changing product scope (see `PLAN.md`).
- Prefer extending `chatHistory.ts`, `openai.ts`, and existing Hono routes over new abstractions.
- UI: Tailwind 4, Radix/shadcn-style components under `src/components/ui/`, `@/` alias → `src/`.
- Tests: Vitest; client uses happy-dom; worker tests live next to sources (`*.test.ts`).
- When touching Gmail OAuth, test both **Vite-proxied** (`:3003`) and **direct Worker** (`:8788`) redirect behavior; `oauth.ts` uses `APP_PUBLIC_ORIGIN` and forwarded headers.

## Out of scope (unless asked)

- Server-side message history or multi-thread folders
- Streaming responses (today: full completion in one response)
- Cloud backup (`syncToCloud` in `chatBackup.ts` is still a stub)
- Import-from-backup UI (export exists)
