# E2E tests

Browser tests for Playground apps using [Playwright](https://playwright.dev/).

## compare-next

Runs `db:setup:local` (migrate + GPU seed), then starts or reuses
`@playground/compare-next` on port `3000` (override with `COMPARE_NEXT_PORT`).
When `pnpm dev` is already running locally, Playwright reuses that server
instead of starting a second Next.js dev process.

```bash
pnpm install
pnpm --filter @playground/e2e exec playwright install chromium
pnpm test:e2e
```

Run from the repo root. In CI, E2E runs in the official Playwright Docker image
(`mcr.microsoft.com/playwright:v1.61.1-noble`) with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
so browsers are not downloaded during the job.
