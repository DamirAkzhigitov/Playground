# Auth integration E2E

Browser tests that verify **shared auth is wired correctly** in Steps and Compare
(SPA + Vite proxy + Workers + central login), not just the auth libraries.

## What is covered

| App | Scenario |
| --- | --- |
| **Steps** | Guest browses `/actions`; sign-in prompt on action page; `/my` → central login; login → My guides |
| **Compare** | Guest `/listings` → central login; login → listings UI |

API-level checks remain in [`scripts/smoke-auth.sh`](../scripts/smoke-auth.sh).

## Prerequisites

- Node 22, pnpm 10 (same as monorepo)
- Chromium: `pnpm --filter @playground/e2e install:browsers`

## Run locally

From repo root (frees ports if a dev stack is running):

```bash
pnpm stop
pnpm install
pnpm test:e2e
```

This starts auth/steps/compare Workers (8789/8787/8788) and Vite UIs
(3004/3003/3002) with an isolated D1 persist dir (`.wrangler/e2e-persist`).

Seed user: `seed+user@local.test` / `SeedPass123!`

## Pre-merge / deploy checklist

1. **Unit tests:** `pnpm test`
2. **API smoke:** `./scripts/smoke-auth.sh`
3. **Browser E2E:** `pnpm test:e2e`
4. **Build:** `pnpm build` (at least `@playground/auth`, `@playground/compare`, `@playground/steps`)
5. **Production secrets** on auth + tool Workers: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_DB`, `AUTH_COOKIE_DOMAIN=.da-mr.com` — see [`packages/auth-core/SSO.md`](../packages/auth-core/SSO.md)
6. **Deploy order:** auth Worker → compare/steps Workers → attach custom domains
7. **Post-deploy smoke:** sign in on `auth.da-mr.com`, open `steps.da-mr.com/actions` as guest, open `compare.da-mr.com` and confirm login redirect

## CI

GitHub Actions job `e2e-auth` in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Troubleshooting

- **Port in use:** run `pnpm stop` from repo root.
- **Stale local D1:** delete `.wrangler/e2e-persist` and re-run.
- **Cookie issues:** tests use `127.0.0.1` only (not `localhost`) so session cookies align across ports.

See also [`packages/auth-core/AUTHORIZATION.md`](../packages/auth-core/AUTHORIZATION.md).
