# Playground

Monorepo for [da-mr.com](https://da-mr.com) and its subdomain tools.

**Documentation index:** [`DOCS.md`](DOCS.md) — links to all product, auth, and
app docs in one place.

Product strategy, MVP scoring, subscription assumptions, and launch notes live in
[`docs/product-family.md`](docs/product-family.md). Analytics tooling and cookie
consent guidance is in [`docs/analytics-and-cookies.md`](docs/analytics-and-cookies.md).
Execution priorities and task order are in
[`docs/execution-roadmap.md`](docs/execution-roadmap.md).

- **`apps/main`** — `da-mr.com`. Simple directory with a list of apps.
  Plain static site (Vite + vanilla JS/CSS). No React, no framework.
- **`apps/resume`** — `resume.da-mr.com`. Static about/resume page.
  Plain static site (Vite + vanilla JS/CSS). No React, no framework.
- **`apps/auth`** — `auth.da-mr.com`. Central sign-in for all tools (Better Auth
  UI + `/api/auth/*` on one Worker).
- **`apps/steps`** — `steps.da-mr.com` (planned). Guided catalog of life
  actions with per-user progress; see [`apps/steps/README.md`](apps/steps/README.md).
- **`apps/<tool>`** — `<tool>.da-mr.com`. Each tool is an independent app
  deployed to its own Cloudflare Pages project under its own subdomain.
  React apps go here.
- **`packages/*`** — shared code across apps (added when needed; see
  [packages/README.md](packages/README.md)).
- **`docs/*`** — product strategy and operating documents (index:
  [`DOCS.md`](DOCS.md)).

## Stack

- **Node.js** 22 (`.nvmrc`, `engines.node >=22`)
- **pnpm** 10 — package manager, workspaces
- **Turborepo** 2 — task orchestration with caching
- **Vite** 8 — bundler (per app)
- **Vitest** 4 — tests
- **ESLint** 9 (flat config) + **Prettier** 3 — code quality
- **Husky** + **lint-staged** — pre-commit hook
- **Cloudflare Pages** — hosting, one project per app

## Setup

```bash
nvm use            # or ensure Node 22 is active
corepack enable    # makes pnpm available
pnpm install
```

## Common commands

All commands run from the repo root; Turbo fans them out to each app.

| Task                 | Command                                          |
| -------------------- | ------------------------------------------------ |
| Start dev (all apps) | `pnpm dev`                                       |
| Stop stuck dev ports | `pnpm stop` (after Ctrl+C if ports stay in use)  |
| Start dev (one app)  | `pnpm --filter @playground/main dev`             |
| Build all apps       | `pnpm build`                                     |
| Build one app        | `pnpm turbo run build --filter=@playground/main` |
| Lint                 | `pnpm lint`                                      |
| Lint & fix           | `pnpm lint:fix`                                  |
| Format (write)       | `pnpm format`                                    |
| Format check         | `pnpm format:check`                              |
| Type check           | `pnpm type-check`                                |
| Tests                | `pnpm test`                                      |
| Auth E2E (browser)   | `pnpm test:e2e`                                  |
| Auth API smoke       | `./scripts/smoke-auth.sh`                        |
| Tests with coverage  | `pnpm test:coverage`                             |
| Security audit       | `pnpm security:audit`                            |

Turbo caches results under `.turbo/`; re-runs are near-instant if nothing
changed.

## Project structure

```
.
├── apps/
│   ├── main/                 # da-mr.com (tools directory)
│   │   └── ...               # @playground/main
│   ├── resume/               # resume.da-mr.com (resume app)
│   │   └── ...               # @playground/resume
│   ├── compare/              # compare.da-mr.com
│   │   └── ...               # @playground/compare
│   └── steps/                # steps.da-mr.com (scaffold + docs)
│       └── ...               # @playground/steps
├── packages/                 # shared code across apps
├── docs/                     # product and launch strategy
├── .github/workflows/
│   ├── ci.yml                # lint/test/build on PR and push
│   ├── pr-checks.yml         # PR validation with coverage
│   └── deploy.yml            # deploy to Cloudflare Pages on push to main
├── pnpm-workspace.yaml
├── turbo.json
└── package.json              # workspace root
```

## Deployment (Cloudflare Pages)

Deploys are driven by GitHub Actions via direct upload — **not** by
Cloudflare's Git auto-build. This keeps the monorepo deploy logic in code
and makes adding new tools trivial.

### One-time setup (before the first deploy from this repo layout)

> [!IMPORTANT]
> Before merging the first deploy from the monorepo layout, **turn off Git
> auto-deploys** on the existing `playground` Cloudflare Pages project
> (Dashboard → Workers & Pages → playground → Settings → Builds &
> deployments → Build configuration → Disable builds). Otherwise Cloudflare
> will keep trying to build from the old root layout and fail, while the
> GitHub Actions deploy succeeds in parallel — leading to confusing state.
>
> The Pages project itself is kept; only its Git auto-build is disabled.
> The GitHub Action becomes the single source of deploys.

Required GitHub secrets (already configured for the existing project, reused
as-is):

- `CLOUDFLARE_API_TOKEN` — token with **Pages : Edit** permission for the
  account.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.

### How a push to `main` deploys

1. `.github/workflows/deploy.yml` checks out, sets up pnpm + Node 22.
2. `pnpm install --frozen-lockfile`.
3. `pnpm turbo run build --filter=@playground/main` → `apps/main/dist/`.
4. `cloudflare/wrangler-action@v3` runs `wrangler pages deploy
apps/main/dist --project-name=playground --branch=main`.

### Manual / local deploy

```bash
pnpm turbo run build --filter=@playground/main
pnpm dlx wrangler pages deploy apps/main/dist --project-name=playground --branch=preview
```

### Compare (`apps/compare`)

Production ships as **one Worker** (`apps/compare/worker`): static files from
`apps/compare/dist` plus the Hono API under `/api/*` (see `wrangler.toml`
`[assets]` and `run_worker_first`). The browser uses relative `/api` URLs (no
`VITE_API_BASE_URL` in CI).

After deploy, attach **`compare.da-mr.com`** to that Worker and turn off or
unlink the hostname from a separate **Pages** project so traffic is not split.

```bash
pnpm turbo run build --filter=@playground/compare
pnpm --filter @playground/compare-api exec wrangler deploy
```

#### Authentication

Compare uses the **shared auth stack** (Better Auth + central login at
`auth.da-mr.com`, cookie session, shared D1 `playground-auth-db`). See
[`packages/auth-core/SSO.md`](packages/auth-core/SSO.md) and
[`packages/auth-core/AUTHORIZATION.md`](packages/auth-core/AUTHORIZATION.md).

- Session validation runs on every `/api/*` request via `createSessionMiddleware`.
- **Today the app is account-only:** the SPA wraps all routes in `ProtectedRoute`,
  and every data API (except `/api/health` and `/api/auth/*`) returns **401**
  without a session.
- On first authenticated request, `ensureCompareAppUser` mirrors the auth user
  into compare D1 and seeds default categories/questions.
- All listing/question/answer data is scoped by `user_id`.

**Auth routes** (Better Auth on the Worker, proxied to central auth in local dev):

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/api/auth/sign-up/email` | Create account |
| POST | `/api/auth/sign-in/email` | Sign in |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/get-session` | Current session |

Public/guest Compare pages (SEO category views) are planned but not implemented —
see decision **D-09** in [`docs/DECISIONS.md`](docs/DECISIONS.md).

**D1 migrations** live in `apps/compare/worker/migrations/`. Run locally:

```bash
pnpm --filter @playground/compare-api run db:migrate:local
```

## Adding a new tool (subdomain)

Each tool gets its own subdomain (`<tool>.da-mr.com`), its own Cloudflare
Pages project, and its own app folder. End-to-end recipe:

1. **Scaffold the app folder** (React 19 + Vite 8 + TS recommended):

   ```bash
   mkdir -p apps/<tool>
   # add index.html, src/, package.json (name: "@playground/<tool>"),
   # vite.config.ts, tsconfig.json, eslint.config.js
   ```

   Set `"name": "@playground/<tool>"` and the standard scripts (`dev`,
   `build`, `lint`, `test`, `type-check`). Run `pnpm install` from the repo
   root — pnpm workspaces will pick it up automatically.

2. **Create the Cloudflare Pages project** in the Cloudflare dashboard:

   - Name: `<tool>` (matches `--project-name`).
   - Production branch: `main`.
   - **Disable** Git auto-build (deploys come from GitHub Actions).
   - Add custom domain `<tool>.da-mr.com` in the project settings.

3. **Add a deploy job** to `.github/workflows/deploy.yml`:

   ```yaml
   deploy-<tool>:
     name: Deploy apps/<tool> to Cloudflare Pages
     runs-on: ubuntu-latest
     environment:
       name: production
       url: https://<tool>.da-mr.com
     steps:
       # ... same setup steps as deploy-main ...
       - run: pnpm turbo run build --filter=@playground/<tool>
       - uses: cloudflare/wrangler-action@v3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
           accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
           command: pages deploy apps/<tool>/dist --project-name=<tool> --branch=main
   ```

4. **Link from the dashboard.** Add a card to the tool grid in
   `apps/main/index.html` pointing to `https://<tool>.da-mr.com`.

## CI

- `ci.yml` — runs lint / format / type-check / test / build on every PR
  and every push to `main`.
- `pr-checks.yml` — additionally runs test coverage on PRs.
- `deploy.yml` — runs only on push to `main` (or `workflow_dispatch`).

Type-check and `security:audit` are non-blocking (`continue-on-error: true`)
to match the previous setup.

## Contributing

1. Branch off `main`.
2. Make changes; run `pnpm lint test type-check build` locally.
3. `pnpm format` before committing (the pre-commit hook auto-runs Prettier
   on staged files via lint-staged).
4. Open a PR. CI will validate everything.
