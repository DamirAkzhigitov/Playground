# E2E tests

Browser tests for Playground apps using [Playwright](https://playwright.dev/).

## compare-next

Starts `@playground/compare-next` on port `3010` (override with `COMPARE_NEXT_PORT`),
runs `db:setup:local` (migrate + GPU seed), then runs UI/API smoke tests.

```bash
pnpm install
pnpm --filter @playground/e2e exec playwright install chromium
pnpm test:e2e
```

Run from the repo root. In CI, Chromium is installed in the workflow before `pnpm test:e2e`.
