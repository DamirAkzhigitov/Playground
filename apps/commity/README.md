# Commity

Personal AI assistant — one continuous conversation per account.

- **UI:** React + Vite (`@playground/commity`)
- **API:** Cloudflare Worker + Hono (`@playground/commity-api`)
- **Auth:** Cookie sessions in D1 (same pattern as compare)
- **History:** `localStorage` on the device; only the last 20 messages are sent to the API per turn
- **Gmail:** optional Google OAuth (`gmail.modify` + `userinfo.email`). AI can search/star/trash inbox in chat and draft emails; you review and confirm before send.

## Local development

```bash
# From repo root
pnpm install

# Terminal 1 — API (port 8788)
cp apps/commity/worker/.dev.vars.example apps/commity/worker/.dev.vars
# Edit .dev.vars: OPENAI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY
pnpm --filter @playground/commity-api run db:migrate:local
pnpm --filter @playground/commity-api dev

# Terminal 2 — client (port 3003, proxies /api → 8788)
pnpm --filter @playground/commity dev
```

### Gmail OAuth (local)

1. In [Google Cloud Console](https://console.cloud.google.com/), enable Gmail API and create a Web OAuth client. On the OAuth consent screen, add scopes **`.../auth/gmail.modify`** and **`.../auth/userinfo.email`** (the latter is only used to display the connected address).
2. Add redirect URI **`http://localhost:3003/api/gmail/callback`** (Vite proxies to the Worker). If you hit the Worker directly, use `http://localhost:8788/api/gmail/callback` instead — it must match the origin you use in the browser.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`), and **`APP_PUBLIC_ORIGIN=http://localhost:3003`** in `worker/.dev.vars` (so OAuth redirect URIs match Google Console when Vite proxies `/api` to the Worker).
4. In the app, click **Connect Gmail**, complete consent, then ask the assistant to draft an email.

## Deploy

Production uses `wrangler deploy` from `apps/commity/worker` after building the client to `apps/commity/dist`. Worker secrets:

- `OPENAI_API_KEY` (and optional `OPENAI_MODEL`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`

Create D1 databases `commity-db` / `commity-db-dev`, run migrations (`0002_gmail.sql` for Gmail tables), and update `database_id` in `wrangler.toml` before the first remote deploy.

Google OAuth redirect URIs for production: `https://commity.da-mr.com/api/gmail/callback` and `https://dev-commity.da-mr.com/api/gmail/callback`.
