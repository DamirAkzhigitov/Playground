# Week 1 Tasks — Decisions vs Coding

**Goal (Phase 0 + Phase 1 start):** lock strategy enough to start Week 2 Compare work; ship trust surfaces; stabilize central auth in production.

**How to use this doc**

- **Decision tasks** → product / founder / legal. Output is a written answer others can implement.
- **Coding tasks** → engineering. Output is merged code, deploy, or verified prod config.
- Each task has an ID (`D-` = decision, `C-` = coding). Assign `Owner` in your tracker.

**Week 1 exit criteria**

- [ ] All `D-*` tasks closed with answers recorded in [`DECISIONS.md`](DECISIONS.md) (create when first decision lands).
- [ ] Auth SSO works on prod: sign up on `auth.da-mr.com` → land back on compare/steps with session.
- [ ] Privacy Policy + Terms published and linked from main, auth, and resume.
- [ ] Main site copy no longer says "experiments"; product positioning is consistent.
- [ ] Compare public vs account-only matrix documented (feeds Week 2 routes).

---

## Dependency overview

```text
D-01 ──┬──► D-02, D-03, D-04
       └──► C-08 (paywall copy), Week 2 schema

D-05 ──► C-06 (legal pages billing section)

D-06, D-07 ──► Week 2 seed data + Steps content (not Week 1 code)

C-01 ──► C-02, C-03, C-04 (auth branch must land first)

C-05 ──► C-06 (pages need URLs)

D-08 ──► C-07 (main copy)

C-09, C-10 — parallel hygiene (no blockers)
```

---

## Decision tasks (assign to product / leadership / legal)

| ID | Task | Owner | Due | Blocks |
| --- | --- | --- | --- | --- |
| **D-01** | **Lock Compare positioning (1 paragraph)** — Confirm public message: "universal structured product comparison" and explicitly retire "apartment inspection tool" as the *customer-facing* story. | | Day 1 | Marketing, main copy, Week 2 |
| **D-02** | **Choose first paid boundary for Compare** — Pick **one** v1 gate: `export` \| `premium categories` \| `saved comparison history` \| `advanced filters`. | | Day 2 | Week 3 paywall, entitlements |
| **D-03** | **Set v1 pricing** — e.g. `$9/mo`, `$15/mo`, or `$49/yr`; single **Pro** plan only (no Founder tier in v1 unless intentional). | | Day 2 | Terms billing section, Week 3 Stripe |
| **D-04** | **Choose billing provider** — Stripe vs Lemon Squeezy vs Paddle (tax/VAT, EU, solo-dev ops). | | Day 2 | Week 3 integration |
| **D-05** | **Approve legal approach** — Option A: lawyer-drafted Privacy + Terms. Option B: template + founder review (acceptable for soft launch?). Name **legal entity** and **contact email** for policies. | | Day 1 | C-06 content |
| **D-06** | **Pick first 1–2 Compare seed categories** — e.g. GPUs + budget smartphones. List 5–10 product pairs to seed in Week 2. | | Day 3 | Week 2 data |
| **D-07** | **Pick first 3 Steps guides to publish** — Titles/slugs only; apartment-buying guide is OK as one of three if still relevant. | | Day 3 | Week 3–4 Steps SEO |
| **D-08** | **Approve main site copy** — Review hero + three product cards (Compare, Steps, About). Remove "experiments" language. | | Day 2 | C-07 |
| **D-09** | **Define Compare: public vs account-only** — Table of routes/features (see template below). Minimum: which pages are crawlable without login. | | Day 3 | Week 2 public routes |

### D-09 template (fill in and save to `DECISIONS.md`)

| Surface | Public (no login) | Account required | Pro only |
| --- | --- | --- | --- |
| Category browse | ? | | |
| Product comparison view | ? | | |
| Save comparison | | ? | |
| Export JSON/XLSX | | | ? |
| Custom questions / listings (legacy) | | ? | |
| Settings / profile | | ? | |

### Decision outputs (deliverables)

Create or update [`DECISIONS.md`](DECISIONS.md) with:

```markdown
## Week 1 — Locked YYYY-MM-DD

| Decision | Answer | Owner |
| --- | --- | --- |
| Compare positioning | … | … |
| First paid boundary | … | … |
| v1 pricing | … | … |
| Billing provider | … | … |
| Seed categories | … | … |
| Steps guides (3) | … | … |
| Legal approach | … | … |
```

---

## Coding tasks (assign to engineering)

### Track A — Central auth (priority)

| ID | Task | Owner | Est. | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| **C-01** | **Merge auth branch to `main`** — `apps/auth`, compare/steps auth redirect, shared `AUTH_DB`, delete local login pages. | | 2–4 h | — | PR merged; CI green (lint, test, build). |
| **C-02** | **Production auth secrets & bindings** — Per [`SSO.md`](../packages/auth-core/SSO.md): `BETTER_AUTH_SECRET` (same on auth, compare, steps), `BETTER_AUTH_URL`, `AUTH_DB`, `AUTH_COOKIE_DOMAIN=.da-mr.com`, trusted origins. | | 2 h | C-01 | Checklist in PR or runbook; manual `get-session` on each subdomain. |
| **C-03** | **Deploy auth + compare Workers** — Ensure `deploy.yml` runs after merge; verify `auth.da-mr.com` and `compare.da-mr.com`. | | 1 h | C-02 | GitHub deploy jobs succeed; `/api/health` OK on both. |
| **C-04** | **Auth E2E smoke (prod or dev)** — Run `./scripts/smoke-auth.sh` against dev; manual prod test: register → redirect to compare → `/api/listings` 200 → logout. | | 1–2 h | C-03 | Documented pass/fail in PR comment or `docs/runbooks/auth-smoke.md`. |

**C-04 manual prod script (minimal)**

1. Open `compare.da-mr.com` while logged out → redirect to `auth.da-mr.com/login?returnUrl=…`
2. Register → return to compare → app loads (not login loop)
3. DevTools: session cookie on `.da-mr.com`
4. Sign out on auth → compare API returns 401

---

### Track B — Trust & catalog (parallel after D-05, D-08)

| ID | Task | Owner | Est. | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| **C-05** | **Add legal pages (static)** — `Privacy Policy` + `Terms of Service` as static routes. Suggested hosts: `apps/resume` (new `/privacy`, `/terms`) or `apps/main` static HTML. | | 3–4 h | D-05 | Pages render on prod URL; linked from footer. |
| **C-06** | **Legal page content v1** — Implement text from D-05: data collected (auth cookies, D1, R2 photos, Cloudflare), subprocessors, account/billing rules placeholder, contact email. | | 2–4 h | D-05, C-05 | Founder can review in PR; billing section references D-03/D-04 when known. |
| **C-07** | **Rewrite `apps/main` copy** — Hero, meta description, product cards per D-01 and D-08; fix `id="apartments-project-link"` → `compare-project-link`. | | 1–2 h | D-08 | No "experiments" in user-facing copy; build passes with origin env vars. |
| **C-08** | **Cross-link legal + auth** — Footer links on main, resume, auth login/register pages ("Privacy", "Terms"). | | 1 h | C-05 | Links work on da-mr.com, auth.da-mr.com, resume.da-mr.com. |

---

### Track C — Hygiene & unblock Week 2 (parallel, lower priority)

| ID | Task | Owner | Est. | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| **C-09** | **Sync Steps docs** — Update [`PLAN.md`](../apps/steps/PLAN.md) Phase 3 checkboxes to match [`IMPLEMENTATION.md`](../apps/steps/IMPLEMENTATION.md) (or add "see IMPLEMENTATION.md" banner at top). | | 30 m | — | No contradictory phase status. |
| **C-10** | **Refresh README auth section** — Replace PBKDF2/per-compare auth description with central SSO + link to `SSO.md`. | | 30 m | — | README matches current architecture. |
| **C-11** | **Bump Hono to ≥4.12.21** — Fix audit findings in auth/compare/steps workers; run `pnpm security:audit`. | | 1 h | — | Audit count reduced; apps still build. |
| **C-12** | **Document Compare access matrix in repo** — Add `docs/compare-access-matrix.md` from completed D-09 (can stub until D-09 closes). | | 30 m | D-09 | File exists; linked from week-1 exit checklist. |

---

## Suggested assignments

| Role | Week 1 focus |
| --- | --- |
| **Founder / product** | D-01 – D-09; review C-06 legal text; approve C-07 copy PR |
| **Full-stack engineer** | C-01 – C-04 (auth track first) |
| **Frontend / content engineer** | C-05 – C-08 after D-05/D-08 land |
| **Anyone with spare cycle** | C-09 – C-12 |

---

## Day-by-day schedule (suggested)

| Day | Decisions | Coding |
| --- | --- | --- |
| **Mon** | D-01, D-05 (positioning + legal approach) | C-01 merge auth; start C-02 secrets |
| **Tue** | D-02, D-03, D-04, D-08 (paid boundary, price, billing, main copy approval) | C-03 deploy; C-04 smoke |
| **Wed** | D-06, D-07, D-09 (seed categories, steps guides, public/private matrix) | C-05 legal routes scaffold; C-07 main copy PR |
| **Thu** | Review C-06 legal draft | C-06 content; C-08 cross-links |
| **Fri** | Close any open D-*; sign off Week 1 exit criteria | C-09–C-12; buffer for auth hotfixes |

---

## Explicitly NOT Week 1 (avoid scope creep)

- Compare schema universalization (Week 2)
- Stripe/Lemon integration (Week 3)
- Steps production deploy (Week 2–3 unless auth track finishes early)
- Plausible / Sentry (Week 4)
- Contributor editor (Steps Phase 4)
- Renaming `apartments-db` / Worker in Cloudflare (schedule later; document only)

---

## Task import (copy to GitHub Issues / Linear)

### Decisions

- [ ] **D-01** Lock Compare positioning (1 paragraph)
- [ ] **D-02** Choose first paid boundary for Compare
- [ ] **D-03** Set v1 pricing (single Pro plan)
- [ ] **D-04** Choose billing provider
- [ ] **D-05** Approve legal approach + entity/contact email
- [ ] **D-06** Pick 1–2 Compare seed categories + example product pairs
- [ ] **D-07** Pick 3 Steps guides to publish (titles/slugs)
- [ ] **D-08** Approve main site copy
- [ ] **D-09** Define Compare public vs account-only matrix

### Coding

- [ ] **C-01** Merge auth branch to `main`
- [ ] **C-02** Production auth secrets & bindings
- [ ] **C-03** Deploy auth + compare Workers
- [ ] **C-04** Auth E2E smoke (dev script + manual prod)
- [ ] **C-05** Add legal pages (static routes)
- [ ] **C-06** Legal page content v1
- [ ] **C-07** Rewrite `apps/main` copy
- [ ] **C-08** Cross-link legal from main, resume, auth
- [ ] **C-09** Sync Steps PLAN vs IMPLEMENTATION
- [ ] **C-10** Refresh README auth section
- [ ] **C-11** Bump Hono ≥4.12.21
- [ ] **C-12** Document Compare access matrix file

---

## Related docs

- [`execution-roadmap.md`](execution-roadmap.md) — Week 1 backlog source
- [`release-readiness-audit.md`](release-readiness-audit.md) — gap analysis
- [`product-family.md`](product-family.md) — strategy context
- [`packages/auth-core/SSO.md`](../packages/auth-core/SSO.md) — auth prod checklist
