1. ~~Migration is half-finished — deploy and CI are still wired to the deleted app~~ **Resolved**

deploy.yml, path filters, and README now target `apps/compare-next` with OpenNext deploy. Mock API routes live at `/api/catalogue` and `/api/health`.


2. ~~Two conflicting Worker setups~~ **Resolved**

The nested `apps/compare-next/worker/` Hono package was removed. API is served via Next.js route handlers on the OpenNext Worker.

3. No real backend — entire product runs on mocks

Currently we dont want backend, we will create a simple worker with DB or mock data, just to simulate a request, but we will create a fully functional DB later

4. SEO bug: double title suffix on nested routes

Built HTML shows:

• / → Compare catalogue | Compare ✓
• /hot → Hot comparisons | Compare | Compare ✗

Root cause: layout.tsx sets title.template: '%s | Compare', while catalogueMetadata already appends | ${SITE_NAME}.

Fix: Either use short titles in catalogueMetadata (let the template add the suffix), or set title: { absolute: '...' } on child routes.

────────────────────────────────────────

High-priority issues (should fix soon)

5. No tests

We need to setup playwright for e2e test (UI) and vitest for code testing, create a simple tests

6. ~~Search fires on every keystroke~~ **Resolved**

`CataloguePage` debounces search input (350ms) before updating the React Query key and calling `/api/catalogue`.

7. i18n is half-built

locale.ts has readStoredLocale() but I18nContext hardcodes 'en':

apps/compare-next/src/contexts/I18nContext.tsx lines 21-22

export function I18nProvider({ children }: { children: ReactNode }) {
const locale = 'en' // TODO: read locale from user/stored value

That’s dead code plus an incomplete feature. Either wire it up or remove the unused helper until needed (YAGNI).

Resolve: currently we will support only en translation and no choice on website, later we will add a option

8. Tailwind is installed but unused

Resolve: tailwind need to be removed completly

9. ~~Missing type-check script~~ **Resolved**

`compare-next` now has `"type-check": "tsc --noEmit"` in package.json.

────────────────────────────────────────

Medium / polish

┌────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Issue                                                  │ Detail                                                                                             │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Nested ternaries in CataloguePage for heading/subtitle │ Duplicates the Record<> pattern already used in catalogueMetadata / catalogueJsonLd                │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ <img> vs next/image                                    │ ESLint warns; matters once real images land (LCP, Cloudflare Images binding exists in wrangler)    │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Duplicate / and /new                                   │ Same data, different canonical — intentional per ARCHITECTURE, but watch duplicate-content signals │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ useI18n error                                          │ throw new Error('useI18n') — weak message; prefer 'useI18n must be used within I18nProvider'       │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ turbo.json outputs                                     │ Only dist/**; compare-next outputs .next/** — caching may be wrong if added to turbo build             │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ External mock images                                   │ picsum.photos — fine for dev; not for prod CSP/performance                                         │
└────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────

AGENTS.md checklist (explicit)

┌───────────────────────────────────────────┬──────────────────────────────────────────────────┐
│ Check                                     │ Status                                           │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Clear naming                              │ ✓ Mostly                                        │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ No duplicated logic that should be shared │ ⚠ Metadata/heading maps duplicated              │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Errors handled                            │ ⚠ Mock-only; worker has generic onError         │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ No unnecessary any                        │ ✓                                               │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Tests for behavior changes                │ ✗ None                                          │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ No secrets / debug / commented code       │ ✗ Large commented blocks in worker              │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Docs updated                              │ ⚠ ARCHITECTURE good; README/AGENTS/deploy stale │
├───────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ lint / type-check / test pass             │ ⚠ lint OK; no test script; type-check not wired │
└───────────────────────────────────────────┴──────────────────────────────────────────────────┘

────────────────────────────────────────

Recommended next steps (priority order)

1. Fix repo integration — update deploy.yml path filters and jobs for OpenNext (pnpm deploy / wrangler.jsonc), remove or update stale compare references in README and AGENTS.md.
2. Resolve worker strategy — delete worker/ skeleton or restore API routes with migrations and auth; don’t keep commented stubs.
3. Fix metadata title bug — quick win, visible in production SEO.
4. Wire catalogue to real API — implement fetchCataloguePage against /api/compare-groups/public (or equivalent); keep mock behind a dev flag.
5. Add detail route — e.g. /compare/[slug] linking from cards.
6. Add tests for data/fetchCatalogue.ts and metadata helpers.
7. Debounced search before API hookup.
8. Clean up — remove Tailwind if unused, replace README boilerplate, add type-check script, connect or remove readStoredLocale.
