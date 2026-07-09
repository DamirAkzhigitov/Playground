# Playground

Monorepo for [da-mr.com](https://da-mr.com) and its subdomain tools.

## Setup

```bash
nvm use            # or ensure Node 22 is active
corepack enable    # makes pnpm available
pnpm install
pnpm --filter @playground/compare-next db:setup:local  # D1 migrate + seed (first run)
```

`db:setup:local` creates the local Cloudflare D1 database used by compare-next
during `pnpm dev`. Re-run it after schema changes or if pages fail with
`no such table` errors.

## Common commands

All commands run from the repo root; Turbo fans them out to each app.

| Task                 | Command                                          |
| -------------------- | ------------------------------------------------ |
| Start dev (all apps) | `pnpm dev`                                       |
| Stop stuck dev ports | `pnpm stop` (after Ctrl+C if ports stay in use)  |
| Start dev (one app)  | `pnpm --filter @playground/compare-next dev`     |
| Build all apps       | `pnpm build`                                     |
| Build one app        | `pnpm turbo run build --filter=@playground/compare-next` |
| D1 setup (local)     | `pnpm --filter @playground/compare-next db:setup:local` |
| Lint                 | `pnpm lint`                                      |
| Lint & fix           | `pnpm lint:fix`                                  |
| Format (write)       | `pnpm format`                                    |
| Format check         | `pnpm format:check`                              |
| Type check           | `pnpm type-check`                                |
| Tests                | `pnpm test`                                      |
| Tests with coverage  | `pnpm test:coverage`                             |
| Security audit       | `pnpm security:audit`                            |

Turbo caches results under `.turbo/`; re-runs are near-instant if nothing
changed.

## Project structure

```
.
├── apps/
│   ├── compare-next/              # compare.da-mr.com (@playground/compare-next)
├── packages/                 # shared code across apps
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

### Compare (`apps/compare-next`)

Production ships as **one Cloudflare Worker** via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare): the Next.js app
and API routes (`/api/health`, `/api/catalogue`) share the same origin. Attach
**`compare.da-mr.com`** to the `compare-next` Worker (Workers & Pages → Custom
domains). The catalogue API currently serves mock data; a real D1 backend will
replace it later.

```bash
pnpm --filter @playground/compare-next deploy
```

Dev PR previews deploy to **`dev-compare.da-mr.com`** via `deploy:dev` (Worker
`compare-next-dev`).

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
