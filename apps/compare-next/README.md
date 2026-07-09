# compare-next

Next.js app for [compare.da-mr.com](https://compare.da-mr.com) — product
comparison catalogue with SEO routes, D1-backed API, and Cloudflare Worker
deploy via OpenNext.

Architecture, folder layout, and data flow:
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Commands

Run from the repo root unless noted.

```bash
pnpm --filter @playground/compare-next dev              # local Next.js dev server
pnpm --filter @playground/compare-next db:setup:local   # D1 migrate + seed (first run)
pnpm --filter @playground/compare-next test             # unit tests (Vitest)
pnpm --filter @playground/compare-next test:coverage    # unit tests + coverage gate
pnpm --filter @playground/compare-next lint             # ESLint
pnpm --filter @playground/compare-next type-check       # tsc --noEmit
pnpm --filter @playground/compare-next build            # next build
pnpm --filter @playground/compare-next deploy           # prod → compare.da-mr.com
pnpm --filter @playground/compare-next deploy:dev       # dev → dev-compare.da-mr.com
```

Coverage thresholds and CI gates are enforced in
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).
