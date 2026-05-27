# Cross-subdomain SSO (`*.da-mr.com`)

## Architecture (enabled)

| Resource | Name | Binding |
| -------- | ---- | ------- |
| Shared auth D1 (prod) | `playground-auth-db` | `AUTH_DB` on compare + steps Workers |
| Shared auth D1 (dev) | `playground-auth-db-dev` | `AUTH_DB` on compare `--env dev` |
| App data | `apartments-db`, `steps-db`, … | `DB` (per tool) |

Migrations for auth tables: [`migrations/`](./migrations/). Apply with:

```bash
pnpm --filter @playground/compare-api db:migrate:auth:local   # or remote
pnpm --filter @playground/steps-api db:migrate:auth:local
```

(Only one apply needed per environment — both Workers point at the same D1.)

Production database IDs (Cloudflare):

- `playground-auth-db`: `19af03aa-ae46-4c24-9729-fca5941d73bb`
- `playground-auth-db-dev`: `62c9747d-6d66-420f-93ff-d66fcecf29d1`

## Production checklist

1. **Same secrets on every tool Worker**

   ```bash
   wrangler secret put BETTER_AUTH_SECRET   # identical value on compare + steps
   wrangler secret put BETTER_AUTH_URL      # per tool: https://compare.da-mr.com / https://steps.da-mr.com
   ```

2. **`AUTH_DB` binding** — already in `apps/compare/worker/wrangler.toml` and
   `apps/steps/worker/wrangler.toml`.

3. **Cookie domain** — set in wrangler `[vars]` as `AUTH_COOKIE_DOMAIN = ".da-mr.com"` (not a
   secret).

4. **Trusted origins** — `BETTER_AUTH_TRUSTED_ORIGINS` lists every tool origin (in wrangler
   `[vars]` for prod; extend for dev Vite URLs in `[env.dev.vars]`).

5. **Migrate shared auth DB**

   ```bash
   pnpm --filter @playground/compare-api db:migrate:auth:remote
   ```

6. **Migrate app DBs** separately (`apartments-db`, `steps-db`). Steps runs
   `0003_shared_auth_db.sql` to drop local auth tables. Compare keeps a **mirror** `users`
   row in `apartments-db` for legacy `user_id` FKs (`mirror-app-user.ts` on register).

## Migrating existing compare users

If compare already had users in `apartments-db` before SSO, copy auth rows into
`playground-auth-db` once (export/import or SQL). New sign-ups go to `AUTH_DB` automatically.
Legacy `users` rows in `apartments-db` are unused by Better Auth after this change.

## Local dev

- `AUTH_COOKIE_DOMAIN` is **not** set in `.dev.vars` (host-only cookies per port).
- Auth seeds: `packages/auth-core/migrations/0002_seed.sql` (`SeedPass123!`).
- Run `pnpm db:migrate:auth:local` before `scripts/smoke-auth.sh`.

## Code

- `getAuthDatabase(env)` — `AUTH_DB ?? DB` ([`src/database.ts`](./src/database.ts))
- `createPlaygroundAuth()` — applies `crossSubDomainCookies` when `AUTH_COOKIE_DOMAIN` is set

## Option B — Central `auth.da-mr.com`

Not implemented. Use a dedicated login Worker only if you want a single login UI; Option A
(shared D1 + cookie) is sufficient for compare + steps.

## Option C — Hosted IdP

Clerk / Auth0 — same publishable key on all subdomains; users outside D1 unless synced.
