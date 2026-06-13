# Release Readiness Audit

**Date:** 2026-06-13  
**Scope:** Monorepo vs [`execution-roadmap.md`](execution-roadmap.md)  
**Perspective:** Production release and first-revenue readiness (~10k MAU scale)  
**Method:** Static codebase review + strategy doc cross-check (no live prod pentest)

---

## Executive summary

The roadmap correctly prioritizes **one paid product (Compare)**, **one lead magnet (Steps)**, and shared platform (Auth). Engineering has made solid progress on **central SSO**, **Steps user MVP**, and **Compare as a working apartment-comparison tool**. None of that yet forms a **sellable, discoverable, billable product**.

**Bottom line:** You are roughly at **late Phase 0 / early Phase 1** against the roadmap. Revenue blockers are product and business decisions first, then Compare universalization and billing. Steps can drive traffic only after deploy + curated public guides + SEO.

| Area | Status | Revenue impact |
| --- | --- | --- |
| Strategy decisions | **Not locked** | Blocks everything downstream |
| Central auth (SSO) | **In progress** (branch) | Medium — needed but not sufficient |
| Compare sellable MVP | **Not started** | **Critical** — no payment surface |
| Billing + entitlements | **Not started** | **Critical** |
| Public SEO / landing | **Not started** | **Critical** — no acquisition |
| Steps acquisition | **Partial** (app works locally) | High — not deployed, thin content |
| Analytics + observability | **Not started** | High — blind after launch |
| Legal / trust pages | **Missing** | **Blocker** for paid EU/global launch |
| Security baseline | **Mixed** | Medium — some fixes done, gaps remain |

**If the goal is first paying customer in 30 days:** stop net-new platform work except auth stabilization; lock pricing and paid boundary this week; start Compare data-model rework and Stripe/Lemon integration in parallel.

---

## Roadmap phase map

### Phase 0 — Lock strategy (3–5 days)

| Item | Roadmap | Actual state | Gap |
| --- | --- | --- | --- |
| Compare positioning | Universal product comparison | UI copy says universal; **code is apartment inspection** (`listings`, seed questions about kitchens/bathrooms) | **Product/code mismatch** |
| Monetization product | Compare | Entitlements types only — **no billing** | Not sellable |
| Lead magnet | Steps | User flow largely built; **not deployed** | No traffic channel |
| First paid boundary | Undecided | Open in roadmap + product-family + analytics docs | **Decision required** |
| v1 pricing | e.g. $9–19/mo | Undecided | **Decision required** |

**Outcome not met:** team can still debate weekly because five open decisions are repeated across three docs.

---

### Phase 1 — Platform and trust (1–2 weeks)

| Item | Roadmap | Actual state | Gap |
| --- | --- | --- | --- |
| Stabilize central auth | auth + compare + steps | `apps/auth` added; compare/steps redirect to central login; shared `AUTH_DB`; `smoke-auth.sh` | Finish merge/deploy; verify prod secrets checklist in [`SSO.md`](../packages/auth-core/SSO.md) |
| Remove duplicate login flows | Done when merged | Login/register pages **deleted** from compare/steps; `/login` → auth redirect | OK on branch |
| Login → return to product | Required | `buildAuthLoginUrl` + `validateReturnUrl` in `@playground/auth-react` | OK |
| Privacy / Terms / About | Required before paid | **No Privacy Policy or Terms** in repo or apps | **Legal blocker** |
| Main as product catalog | Clean directory | Copy improved but still says **"experiments"**; links work | Minor copy gap |

**Product definitions missing:**

- Compare: nothing documented as public vs account-only in code (today **everything requires login**).
- Steps: public guide browse works without login; saved progress requires auth — **aligned with roadmap intent**.

---

### Phase 2 — Compare to sellable MVP (2–4 weeks) — **main priority**

| Item | Roadmap | Actual state | Gap |
| --- | --- | --- | --- |
| Universal comparison model | categories / products / specs | **Per-user** `categories`, `questions`, `listings`, `answers` — apartment inspection schema | **Full rework** |
| Curated seed categories (GPU, phones…) | 1–2 internal | Seed is apartment inspection template (`0002_seed.sql`) | **Zero SEO/comparison content** |
| Public category + comparison pages | Required | Router wraps **entire app** in `ProtectedRoute`; no public routes | **No organic entry** |
| Saved comparisons (signed-in) | Paid-adjacent feature | User-scoped listings exist but are **private apartment evaluations**, not shareable product comparisons | Wrong abstraction |
| Paywall on 1–2 features | Required | Export (`/api/export/json`, `/api/export/xlsx`) is **free for any logged-in user** | No monetization boundary |
| Billing v1 | Stripe / Lemon / Paddle | **No integration**, no webhook handlers, no checkout UI | **Blocker** |
| `@playground/entitlements` | Enforce in API | Package exists with plans/keys; **not imported by any Worker or app** | Types only |
| Compare landing page | Required | None — title is generic `"Compare"` | **No conversion surface** |
| 5–10 SEO pages | Required | None | **No acquisition** |

**Compare today:** a capable **private apartment comparison workbook** with export, photos (R2), and side-by-side question matrix — not the universal comparison product described in strategy docs.

---

### Phase 3 — Steps as acquisition channel (2–3 weeks)

| Item | Roadmap | Actual state | Gap |
| --- | --- | --- | --- |
| Browse → start → mark done → resume | Required | **Done** per [`IMPLEMENTATION.md`](../apps/steps/IMPLEMENTATION.md) Phase 3 | OK locally |
| 3–5 public guides | Required | Seed has **one** sample ("buy apartment" theme) | **Content gap** |
| SEO meta on guide pages | Required | Static `index.html` description only; **no per-slug meta** | Not indexable at scale |
| Login only for saved progress | Required | `SignInPrompt` on action page — **aligned** | OK |
| Contributor marketplace | **Explicitly deferred** | Contributor routes exist but **hub/editor are stubs** (Phase 4) | OK to defer; don't invest pre-revenue |

**Deployment blocker:** Steps is **not in** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). `wrangler.toml` uses placeholder D1 id `00000000-…`, assets section commented out, no custom domain. **Main links to `steps.da-mr.com` but production app may not exist.**

**Doc drift:** [`PLAN.md`](../apps/steps/PLAN.md) still shows Phase 3 incomplete; [`IMPLEMENTATION.md`](../apps/steps/IMPLEMENTATION.md) marks Phase 3 complete. Creates planning confusion.

---

### Phase 4 — Analytics and launch (1 week)

| Item | Roadmap | Actual state | Gap |
| --- | --- | --- | --- |
| Plausible | Required | **Not integrated** in any app | No traffic truth |
| Sentry | Required | **Not integrated** | No error visibility |
| Key funnel events | Defined in docs | **No instrumentation** (`landing_viewed`, `paywall_viewed`, etc.) | Cannot measure drop-off |
| Weekly dashboard | Required | None | — |
| Cookie banner | If needed | N/A until ad/analytics cookies added | OK for Plausible-only start |

---

## Critical blockers (P0) — stopping first revenue

These must be resolved before taking payment or running acquisition at scale.

1. **Unconfirmed business decisions** (roadmap "Open Decisions"):
   - First paid boundary for Compare (export vs premium categories vs saved history vs filters)
   - v1 pricing ($9–19/mo vs $49/yr)
   - Billing provider (Stripe vs Lemon Squeezy vs Paddle)
   - First 1–2 Compare seed categories
   - First 3–5 Steps guides to publish

2. **Compare is the wrong product shape** for the stated GTM (SEO comparison queries, Reddit buying advice). Apartment-listing inspection does not rank for "RTX 4070 vs 4060 Ti".

3. **No billing stack** — no subscription table, webhooks, customer portal, or checkout flow.

4. **Entitlements not enforced** — `@playground/entitlements` is unused; export and all APIs are all-or-nothing behind login.

5. **No public Compare surface** — 100% behind authentication kills SEO and product-led growth ("try before signup").

6. **No legal minimum** — Privacy Policy and Terms of Service required before subscription launch (called out in roadmap Week 1 and analytics doc).

7. **Steps not deployed** — lead magnet cannot work if `steps.da-mr.com` is broken or missing.

---

## Security and abuse findings

### Fixed or improved since [`report.md`](../report.md) (2026-05-11)

The older red-team report targeted `apps/apartments`. Several findings appear **addressed** in current compare code:

| Original finding | Current state |
| --- | --- |
| Photo upload size/type unchecked | `MAX_PHOTO_BYTES`, magic-byte sniffing in `photoSecurity.ts` |
| Photo GET IDOR | Ownership join on `listings.user_id` before serve |
| Client-controlled Content-Type on serve | Sniffed type + `X-Content-Type-Options: nosniff` |
| Unbounded answer payloads | `.max()` on value/note; batch capped at 200 |
| XLSX formula injection | `neutralizeSpreadsheetCell` used in export |

**Action:** Update or archive `report.md` — it misleads auditors and overstates current risk.

### Remaining security gaps

| ID | Issue | Severity | Notes |
| --- | --- | --- | --- |
| S1 | **11 npm vulnerabilities** (3 high, 6 moderate) — includes Hono &lt;4.12.21 | Medium–High | `pnpm security:audit` fails; CI runs with `continue-on-error: true` |
| S2 | **No rate limiting** on auth or APIs | Medium | Brute force / abuse at app layer; rely on Cloudflare only |
| S3 | **No CAPTCHA / Turnstile** on sign-up | Low–Medium | Important at 10k MAU without rate limits |
| S4 | **OAuth providers optional** — Google/Facebook in `create-auth.ts` but likely unconfigured in prod | Low | Email/password only unless secrets set |
| S5 | **Secrets checklist not automatable** — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` must match across Workers | High (ops) | Documented in SSO.md; no CI verification |
| S6 | **Verbose 500 errors** — `onError` logs full errors; clients get generic message (OK) but logs may leak in shared dashboards | Low | Acceptable if log access restricted |
| S7 | **Compare export free** — data exfiltration path for compromised accounts (not a bug, but no entitlement gate) | Low | Becomes business risk when data has value |
| S8 | **Session cookie scope** `.da-mr.com` — correct for SSO; increases blast radius if XSS ever appears on any subdomain | Medium | Keep strict CSP; sanitize markdown in Steps Phase 5 |

### Trust and compliance gaps

| Item | Status |
| --- | --- |
| Privacy Policy | **Missing** |
| Terms of Service (billing, refunds, acceptable use) | **Missing** |
| Cookie notice | Not needed for Plausible-only per analytics doc |
| GDPR data export/delete flows | **Not documented or implemented** |
| Subprocessor list (Cloudflare, future Stripe, Sentry, Plausible) | **Missing** |

---

## Operations and release engineering

| Issue | Impact | Detail |
| --- | --- | --- |
| Steps not in deploy pipeline | **Lead magnet down** | `deploy.yml` has main, resume, auth, compare — no `deploy-steps` |
| Steps D1 placeholder ID | Deploy would fail | `database_id = "00000000-0000-0000-0000-000000000001"` |
| Legacy naming | Confusion, runbook errors | Worker `apartments-api`, DB `apartments-db`, R2 `apartments-photos` while product is Compare |
| README auth section outdated | Onboarding risk | Still describes per-compare PBKDF2 auth; reality is Better Auth + central SSO |
| CI quality gates soft | Regressions slip | `type-check` and `security:audit` are `continue-on-error: true` |
| Test coverage minimal | Regression risk | 7 test files; mostly utils/stubs; no E2E; no Worker integration tests in CI |
| No incident runbook | Slow recovery | No documented rollback, D1 restore, or secret rotation procedure |
| No backup/RPO/RTO | Data loss risk | D1/R2 backup strategy not documented |
| Auth branch not on `main` | Prod may lag | Large auth migration in flight on feature branch |
| Dev/prod parity | SSO bugs | Local dev requires `--persist-to` shared path; easy to misconfigure |

**What works well:**

- Path-filtered deploys for changed apps
- Dev preview deploys on PR (main, resume, auth, compare)
- `smoke-auth.sh` for cross-Worker session validation
- Turbo monorepo; type-check passes locally (11 packages)
- Compare Worker serves SPA + API same-origin (good for cookies and SEO when public pages exist)

---

## Information and documentation gaps

| Gap | Who it hurts | Recommendation |
| --- | --- | --- |
| Open decisions duplicated in 3 docs | Leadership | Single `DECISIONS.md` with owner + date |
| `PLAN.md` vs `IMPLEMENTATION.md` for Steps | Engineers | Mark PLAN.md deprecated or sync checkboxes |
| `report.md` references `apps/apartments` | Security reviews | Refresh against compare or archive |
| README Compare auth section | New contributors | Rewrite for central SSO |
| No "public vs private" matrix per app | Product + eng | One table in product-family or execution-roadmap |
| No pricing/marketing copy | GTM | Even placeholder pricing page copy unblocks UI |
| No webhook/billing architecture doc | Eng | Short ADR before Stripe integration |
| AGENTS.md says Steps deploy Phase 6 | Accurate | Align with deploy.yml when ready |
| Contributor editor scope vs roadmap "do not build marketplace" | Scope creep risk | Explicitly gate Phase 4 until post-revenue |

---

## Analytics and growth readiness

At 10k MAU you cannot afford flying blind.

| Capability | Required for | Status |
| --- | --- | --- |
| Page views + referrers | Channel mix | Missing |
| Signup → activation funnel | Product fit | Missing |
| Paywall → checkout → paid | Revenue | Missing (no paywall) |
| Error rates + stack traces | Support load | Missing |
| Server-side billing events | Revenue truth | Missing |

**Minimum before paid launch:** Plausible on main/compare/steps/auth + Sentry + manual event helper for the 6 roadmap events + Privacy Policy.

---

## Suggested priority queue (aligned to 30-day backlog)

### Week 1 — Unblock decisions and trust

1. Lock paid boundary + pricing + billing provider (CEO, 1 meeting).
2. Merge and deploy central auth to production; run `smoke-auth.sh` + manual returnUrl test on compare/steps.
3. Publish Privacy Policy + Terms (can start as static pages on resume or main).
4. Rewrite main hero copy (remove "experiments"); confirm outbound links work.

### Week 2 — Compare toward sellable

1. Design new schema: global `categories` → `products` → `attributes` (not per-user apartment templates).
2. Ship **one** curated public category page (unauthenticated read).
3. Public comparison view (2–4 products side by side).

### Week 3 — Money path

1. Stripe/Lemon checkout + webhook Worker route.
2. `subscriptions` table on `AUTH_DB` or dedicated D1; wire `hasEntitlement()` in compare export route first (smallest paywall).
3. Paywall UI component + `paywall_viewed` event.

### Week 4 — Ship acquisition loop

1. Compare landing + 5 programmatic SEO URLs.
2. Deploy Steps; publish 3 guides (not apartment-only).
3. Plausible + Sentry; first weekly KPI review.

---

## Risk register (condensed)

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Build Compare v2 while fixing auth | High | Schedule slip | Time-box auth; freeze scope |
| Launch without Terms/Privacy | Medium | Legal / payment processor rejection | Week 1 static pages |
| SEO pages behind login | Certain | Zero organic growth | Public read routes first |
| Steps link 404 in production | High if undeployed | Broken brand trust | Deploy or remove link from main |
| Dependency CVEs exploited | Low–Medium | API abuse | Bump Hono; make audit blocking |
| No metrics after launch | Certain | Cannot iterate pricing | Phase 4 minimum before ads |

---

## Appendix: evidence references

| Claim | Location |
| --- | --- |
| Compare requires login for all routes | `apps/compare/src/router.tsx` — `ProtectedRoute` on `/` |
| Apartment seed data | `apps/compare/worker/migrations/0002_seed.sql` |
| Export without entitlement check | `apps/compare/worker/src/routes/exports.ts` |
| Entitlements unused | Only `packages/entitlements/src/index.ts`; no imports in apps |
| Steps deploy missing | `.github/workflows/deploy.yml` — no steps filter/job |
| Steps placeholder D1 | `apps/steps/worker/wrangler.toml` |
| Auth redirect pattern | `packages/auth-react/src/auth-urls.ts` |
| Photo security improvements | `apps/compare/worker/src/photoSecurity.ts`, `routes/photos.ts` |
| Steps Phase 3 complete | `apps/steps/IMPLEMENTATION.md` § Phase 3 |
| Open roadmap decisions | `docs/execution-roadmap.md` § Open Decisions |

---

## Sign-off checklist (use before first charge)

- [ ] Paid boundary and price confirmed in writing
- [ ] Privacy Policy and Terms live and linked from auth + checkout
- [ ] Billing provider live mode + webhook signature verification tested
- [ ] At least one entitlement enforced server-side (not UI-only)
- [ ] Public Compare page loadable without account
- [ ] Plausible + Sentry receiving production traffic
- [ ] `paywall_viewed` and `subscription_started` events verified
- [ ] Auth SSO smoke test passed on production subdomains
- [ ] Steps deployed OR link removed from main until ready
- [ ] `pnpm security:audit` clean or accepted exceptions documented
- [ ] Rollback path documented (previous Worker version + D1 migration policy)
