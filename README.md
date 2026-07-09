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

All commands run from the repo root; Turbo fans them out to each workspace.

| Task                 | Command                                          |
| -------------------- | ------------------------------------------------ |
| Start dev            | `pnpm dev`                                       |
| Stop stuck dev ports | `pnpm stop` (after Ctrl+C if ports stay in use)  |
| Start dev (one app)  | `pnpm --filter @playground/compare-next dev`     |
| Build                | `pnpm build`                                     |
| D1 setup (local)     | `pnpm --filter @playground/compare-next db:setup:local` |
| Lint                 | `pnpm lint`                                      |
| Lint & fix           | `pnpm lint:fix`                                  |
| Format (write)       | `pnpm format`                                    |
| Format check         | `pnpm format:check`                              |
| Type check           | `pnpm type-check`                                |
| Unit tests           | `pnpm test:unit`                                 |
| Tests with coverage  | `pnpm test:coverage`                             |
| E2E tests            | `pnpm test:e2e`                                  |
| Security audit       | `pnpm security:audit`                            |

Turbo caches results under `.turbo/`; re-runs are near-instant if nothing
changed.

## Project structure

```
.
├── apps/
│   └── compare-next/         # compare.da-mr.com (@playground/compare-next)
├── e2e/                      # Playwright browser tests
├── .agents/skills/           # Cursor agent skills (e.g. shadcn)
├── .github/workflows/
│   ├── ci.yml                # lint, format, type-check, coverage, build (e2e skipped for now)
│   ├── deploy.yml            # OpenNext Worker deploy on push / PR preview
│   └── security-audit.yml    # weekly pnpm audit
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Deployment (compare-next)

Production ships as **one Cloudflare Worker** via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare): Next.js pages
and `/api/*` routes share the same origin.

| Environment | URL | Command |
| ----------- | --- | ------- |
| Production | `compare.da-mr.com` | `pnpm --filter @playground/compare-next deploy` |
| PR preview | `dev-compare.da-mr.com` | `pnpm --filter @playground/compare-next deploy:dev` |

Deploys run from `.github/workflows/deploy.yml` when `apps/compare-next/**`
changes. Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

See [`apps/compare-next/ARCHITECTURE.md`](apps/compare-next/ARCHITECTURE.md) for
local preview, D1 migrations, and app layout.

## CI

- **`ci.yml`** — on every PR and push to `main`: lint, Prettier, type-check,
  unit tests with line-coverage thresholds, and build. Playwright E2E is
  temporarily disabled in CI (`e2e` job `if: false`).
- **`deploy.yml`** — production deploy on push to `main`; dev preview on PRs
  when compare-next changes.
- **`security-audit.yml`** — weekly `pnpm audit` (moderate+); also
  `workflow_dispatch`.

## Contributing

1. Branch off `main`.
2. Run `pnpm lint`, `pnpm type-check`, `pnpm test:unit`, and `pnpm build`
   locally before opening a PR.
3. The pre-commit hook runs Prettier and ESLint on staged files, then
   `pnpm lint`, `pnpm type-check`, and `pnpm test:unit`.
4. Open a PR. CI enforces format, types, coverage, and build.

Coding guidelines: [`AGENTS.md`](AGENTS.md).
