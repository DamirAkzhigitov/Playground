# AGENTS.md

## Cursor Cloud specific instructions

This is a **pnpm + Turborepo monorepo** hosting `da-mr.com` and its
subdomain tools. Apps live as siblings under `apps/*` (e.g. `main`, `resume`,
`compare`, `steps`). `apps/main` is a static Vite site (vanilla JS/CSS, no
React). React tools use Vite + TypeScript.

### Quick reference

All commands run from the repo root. Turbo fans them out to the right
workspace(s).

| Task              | Command                                          |
| ----------------- | ------------------------------------------------ |
| Install deps      | `pnpm install`                                   |
| Dev server (main)  | `pnpm --filter @playground/main dev` (port 3000)  |
| Dev server (auth)  | `pnpm --filter @playground/auth dev` (port 3004)  |
| Dev server (steps) | `pnpm --filter @playground/steps dev` (port 3003) |
| Auth Worker (local)| `pnpm --filter @playground/auth-api dev` (8789)   |
| Dev (all apps)     | `pnpm dev`                                        |
| Stop stuck dev ports | `pnpm stop` (if restart says port in use after Ctrl+C) |
| Lint              | `pnpm lint`                                      |
| Format check      | `pnpm format:check`                              |
| Type check        | `pnpm type-check`                                |
| Tests             | `pnpm test`                                      |
| Build (all)       | `pnpm build`                                     |
| Build (main only) | `pnpm turbo run build --filter=@playground/main` |
| Security audit    | `pnpm security:audit`                            |

See `README.md` for the full layout, how to add a new tool/subdomain, and
the Cloudflare deploy flow.

### Notes

- **Package manager: pnpm 10** (enforced via `packageManager` in
  `package.json` — corepack will pick this up automatically). Do NOT use
  npm or yarn; the lockfile is `pnpm-lock.yaml`.
- **Node.js 22** is required (`.nvmrc` + `engines.node >=22`).
- **Turborepo** caches results under `.turbo/`. Outputs for each task are
  declared in `turbo.json`.
- Pre-commit hook (`.husky/pre-commit`) runs `pnpm exec lint-staged` →
  Prettier on staged files.
- **Deploys** are driven by GitHub Actions (`.github/workflows/deploy.yml`)
  using `cloudflare/wrangler-action@v3` against the `playground` Cloudflare
  Pages project. Git auto-build on the Cloudflare side must stay
  **disabled** for this project so deploys don't double-fire.
- **`apps/compare`** is deployed as a **single Cloudflare Worker** (`wrangler
deploy` from `apps/compare/worker`) that serves the Vite `dist/` as static
  assets and Hono `/api/*` on the same origin — attach **`compare.da-mr.com`**
  to that Worker (Workers & Pages → `compare-api` → Custom domains). Remove
  or repoint the old **Pages** project for that hostname so only the Worker
  answers. Local dev still uses Vite proxy to `wrangler dev` on port 8787.
- `apps/main` calls the public TheMealDB API at runtime for random recipes;
  no API keys needed. No env vars or backend services for local dev.
- **`apps/steps`** — guided action catalog (search, per-user step progress,
  notes, contributor editor). Worker + D1 auth via `@playground/auth-core` /
  `@playground/auth-react` (same pattern as compare). Deploy not wired until
  Phase 6 in `apps/steps/PLAN.md`.
- **Central auth:** `auth.da-mr.com` ([`apps/auth`](apps/auth)) hosts login UI and
 `/api/auth/*`. Tools redirect via `VITE_AUTH_ORIGIN` and `buildAuthLoginUrl` from
 `@playground/auth-react`. Shared D1 `playground-auth-db`, cookie domain
 `.da-mr.com`. Migrate: `pnpm --filter @playground/auth-api db:migrate:auth:local`.
 See `packages/auth-core/SSO.md`.
- **Stuck ports after dev:** `wrangler` and `workerd` often survive Ctrl+C when
  using Turbo or background terminals. Run `pnpm stop` from the repo root before
  restarting (`scripts/stop-dev.sh` frees 3000–3004, 8787–8789, and inspector ports).
- **Local dev SSO:** Auth / compare / steps Workers use
 `--persist-to .wrangler/local-dev-persist` so the same local `playground-auth-db`
 backs every port. Without that, signing in on the auth Worker (`8789`) while compare
 Vite proxies `/api/auth` there leaves compare API (`8788`) with a different sqlite
 file → `useSession` succeeds but `/api/listings` returns 401 and the compare app
 redirects to login. Restart all three Workers after pulling this change.
- When adding a new tool app, follow the recipe in `README.md` →
 "Adding a new tool". Each tool = one Cloudflare Pages project + one
 deploy job + one subdomain.
