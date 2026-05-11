# AGENTS.md

## Cursor Cloud specific instructions

This is a **pnpm + Turborepo monorepo** hosting `da-mr.com` and its
subdomain tools. Currently only one app exists: `apps/main` — a static
Vite-built site (vanilla JS/CSS, no React). Future tools live as sibling
apps under `apps/*`.

### Quick reference

All commands run from the repo root. Turbo fans them out to the right
workspace(s).

| Task              | Command                                          |
| ----------------- | ------------------------------------------------ |
| Install deps      | `pnpm install`                                   |
| Dev server (main) | `pnpm --filter @playground/main dev` (port 3000) |
| Dev (all apps)    | `pnpm dev`                                       |
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
- `apps/main` calls the public TheMealDB API at runtime for random recipes;
  no API keys needed. No env vars or backend services for local dev.
- When adding a new tool app, follow the recipe in `README.md` →
  "Adding a new tool". Each tool = one Cloudflare Pages project + one
  deploy job + one subdomain.
