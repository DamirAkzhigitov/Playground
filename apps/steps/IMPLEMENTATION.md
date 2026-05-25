# Steps — Implementation phases

Phased build plan for **@playground/steps**. Product behavior, routes, layouts, and
components are defined in **[`DESIGN.md`](./DESIGN.md)** — treat that document as
the UX spec; this file maps **when** each part is built and **what** must ship per
phase.

**Also see:** [`PLAN.md`](./PLAN.md) (task checklists, API tables, schema),
[`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) (unresolved product choices),
[`README.md`](./README.md) (product overview).

| Document | Role |
| -------- | ---- |
| [`DESIGN.md`](./DESIGN.md) | **What** to build — screens, modes, components, a11y |
| **This file** | **When** — phases, dependencies, exit criteria, design links |
| [`PLAN.md`](./PLAN.md) | **How (detail)** — checkboxes, Worker/API/schema notes |

**Stack:** React 19 · TypeScript · Vite · Tailwind 4 · shadcn/ui · TanStack Query · Hono · D1 · Cloudflare Worker (compare pattern).  
**Subdomain (target):** `steps.da-mr.com`

---

## Design reference index

Use these anchors when implementing UI in Phases 2–5.

| Topic | Design section |
| ----- | -------------- |
| Principles | [Design principles](./DESIGN.md#design-principles) |
| All routes | [Screen map](./DESIGN.md#screen-map-target) |
| Home `/` | [Home](./DESIGN.md#home--) |
| Catalog `/actions` | [Action catalog](./DESIGN.md#action-catalog-actions) |
| Action page `/actions/:slug` | [Action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route) |
| Guide layout / wireframe | [Guide mode wireframe](./DESIGN.md#action-page--guide-mode-wireframe) |
| My guides `/my` | [My guides](./DESIGN.md#my-guides-my) |
| Auth | [Sign in](./DESIGN.md#sign-in-login), [Register](./DESIGN.md#register-register) |
| Contributor | [Contributor hub](./DESIGN.md#contributor-hub-contributor), [Editor](./DESIGN.md#contributor-editor) |
| Components | [Components (planned)](./DESIGN.md#components-planned) |
| Accessibility | [Accessibility](./DESIGN.md#accessibility) |
| Contributor content rules | [Content guidelines](./DESIGN.md#content-guidelines-for-contributors) |

---

## Phase overview

```text
Phase 0  Scaffold + docs          ████████░░  done
Phase 1  Backend (Worker + D1)   ░░░░░░░░░░
Phase 2  Frontend shell          ████████░░  done (stubs)
Phase 3  User MVP (public + user)████████░░  done
Phase 4  Contributor editor      ░░░░░░░░░░
Phase 5  Polish                  ░░░░░░░░░░
Phase 6  Deploy + dashboard      ░░░░░░░░░░
```

| Phase | Builds | Design pages touched |
| ----- | ------ | -------------------- |
| 0 | Monorepo app, docs | — (placeholder UI only) |
| 1 | API + D1 | (data model supports all pages) |
| 2 | Router, auth shell, layout | [Screen map](./DESIGN.md#screen-map-target), global chrome note |
| 3 | Home, catalog, action page, my guides, auth | Home, catalog, action page, my guides, login, register |
| 4 | Contributor hub + editor | Contributor hub, editor, preview |
| 5 | A11y, SEO, empty/loading, markdown | Accessibility, SEO notes in action page |
| 6 | Production deploy | — |

---

## Phase 0 — Scaffold & documentation

**Status:** Complete.

**Goal:** App exists in the monorepo; product and UX are documented before backend work.

**Deliverables**

- [x] `apps/steps` package (`@playground/steps`), Vite dev on port 3003
- [x] [`README.md`](./README.md), [`PLAN.md`](./PLAN.md), [`DESIGN.md`](./DESIGN.md), this file
- [x] Root `README.md` / `AGENTS.md` mention steps
- [x] CI: lint, type-check, build include steps

**Design:** Not applicable (minimal placeholder shell). UI work starts Phase 2 per
[DESIGN.md intro](./DESIGN.md) (align with `apps/compare/DESIGN.md` when adding Tailwind/shadcn).

**Exit criteria:** `pnpm --filter @playground/steps dev` serves a page; docs readable.

---

## Phase 1 — Backend (Worker + D1)

**Goal:** API and schema support every route in the [screen map](./DESIGN.md#screen-map-target) before feature UI.

**Depends on:** Phase 0.

### 1A — Worker setup

- [x] `apps/steps/worker/` — `wrangler.toml`, Hono entry, D1 binding `DB`
- [x] Migrations folder; `GET /api/health`, JSON errors (CORS n/a — same-origin)
- [x] Vite proxy `/api` → `wrangler dev` (see `apps/compare`)

### 1B — Schema

Tables and indexes per [`PLAN.md` §1B](./PLAN.md#1b--schema-initial) + 0002_seed.sql (sample published action "buy-apartment-mortgage" + seeded contributor/user for local tests).

- [x] `steps.estimated_minutes` added (optional)
- Snapshot fields deferred (even though Q40 answer was "snapshot at enroll", versioning itself is post-MVP per docs)

### 1C — Auth API

All ✅ (roles, sessions, cookie auth).

| Method | Path | Design |
| ------ | ---- | ------ |
| POST | `/api/auth/register` | [Register](./DESIGN.md#register-register) |
| POST | `/api/auth/login` | [Sign in](./DESIGN.md#sign-in-login) |
| POST | `/api/auth/logout` | Global chrome |
| GET | `/api/auth/me` | Protected routes, contributor gate |

### 1D — Catalog & progress API

All implemented ✅ (public catalog + full user enroll/progress + contributor CRUD with role gate). Zod validation. Published-only for public; drafts via contributor paths only.

| Method | Path | Serves design |
| ------ | ---- | ------------- |
| GET | `/api/actions` | [Catalog](./DESIGN.md#action-catalog-actions) — `q`, `tag`, `sort`, `page`, `limit` |
| GET | `/api/actions/:slug` | [Action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route) browse mode |
| POST | `/api/enrollments` | Start guide (same page, no `/guide` route) |
| GET | `/api/enrollments` | [My guides](./DESIGN.md#my-guides-my) |
| GET | `/api/enrollments/:id` | Guide mode + `?step=` / `?enrollment=` |
| PATCH | `/api/enrollments/:id/progress` | Mark done / skip / notes |
| Contributor CRUD | `/api/contributor/actions/*` | [Contributor](./DESIGN.md#contributor-hub-contributor) |

**Exit criteria met.** Local D1 + migrations (0001+0002 with seed data) committed. Wrangler dev boots; API smoke tests via curl possible (see below). No React pages yet (Phase 2+).

#### Local smoke (after `pnpm install` + migrations)

```bash
# Terminal 1 (from repo root)
pnpm --filter @playground/steps-api dev   # serves on :8787

# Terminal 2
curl http://localhost:8787/api/health
# Login with seeded contributor (pw: SeedPass123!)
curl -X POST http://localhost:8787/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"seed+contributor@local.test","password":"SeedPass123!"}' \
  -c /tmp/cj
curl -b /tmp/cj http://localhost:8787/api/auth/me
# Public catalog
curl 'http://localhost:8787/api/actions?limit=2'
curl http://localhost:8787/api/actions/buy-apartment-mortgage
# (More flows: enroll, progress, contributor create etc. work once logged in as contributor)
```

See `apps/steps/worker/migrations/0002_seed.sql` for test accounts.

---

## Phase 2 — Frontend shell

**Goal:** All routes exist as stubs; auth and layout match compare; API client wired.

**Depends on:** Phase 1 (or parallel with mocked API).

**Design:** [Screen map](./DESIGN.md#screen-map-target), global chrome (header: Browse actions, My guides, Sign in).

### Tasks

- [x] **2.1** Tailwind 4 + shadcn/ui (copy `apps/compare` setup)
- [x] **2.2** `react-router` routes:

  | Route | Stub label | Design |
  | ----- | ---------- | ------ |
  | `/` | Home | [Home](./DESIGN.md#home--) |
  | `/actions` | Catalog | [Catalog](./DESIGN.md#action-catalog-actions) |
  | `/actions/:slug` | Action page | [Action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route) |
  | `/my` | My guides | [My guides](./DESIGN.md#my-guides-my) |
  | `/login`, `/register` | Auth | [Login](./DESIGN.md#sign-in-login), [Register](./DESIGN.md#register-register) |
  | `/contributor` | Hub | [Hub](./DESIGN.md#contributor-hub-contributor) |
  | `/contributor/actions/new` | New action | [Editor](./DESIGN.md#contributor-editor) |
  | `/contributor/actions/:id/edit` | Edit | [Editor](./DESIGN.md#contributor-editor) |

  **Do not** add `/guide/:id` — guide mode stays on `/actions/:slug` per design.

- [x] **2.3** `AuthContext`, `ProtectedRoute` (user + contributor roles)
- [x] **2.4** Typed API client + TanStack Query provider

**Shared components (from design):** `PageHeader`, `LoadingState`, `ErrorState`, layout shell — see [Components](./DESIGN.md#components-planned).

**Status (Phase 2 complete):** All routes render as functional stubs. Auth flows (login/register/logout using real seeded accounts) work against local Worker. Protected routes gate correctly by role and redirect unauthed users. Global chrome header + mobile nav matches design spec. Full feature content deferred to Phases 3–4.

**Exit criteria met.** `pnpm --filter @playground/steps build` succeeds; type-check + lint + format clean. See Phase 3 for real catalog/guide/my-guides content.

---

## Phase 3 — User MVP (discovery + guide)

**Goal:** End-to-end user journey without contributor editor: browse → register → start guide on action page → progress persists.

**Depends on:** Phases 1–2.

**Design sections:** Home, catalog, action page (browse + guide modes), my guides, auth.

### 3.1 — Home (`/`)

**Spec:** [Home — `/`](./DESIGN.md#home--)

- [x] Value prop + primary search → `/actions?q=…`
- [x] Popular actions (API: sort=popular or seed)
- [x] Link “View all actions” → `/actions`

### 3.2 — Action catalog (`/actions`)

**Spec:** [Action catalog](./DESIGN.md#action-catalog-actions)

- [x] URL-synced `q`, `tag`, `sort`, `page` (reset page on filter change)
- [x] `ActionCatalogToolbar`, `ActionSearchResults`, `Pagination` (page size 20)
- [x] Skeleton + empty state with example searches

### 3.3 — Action page (`/actions/:slug`)

**Spec:** [Action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route), [wireframe](./DESIGN.md#action-page--guide-mode-wireframe)

- [x] **Browse mode:** summary, tags, author, titles-only step list, Start / Continue / drop progress
- [x] **Guide mode:** same route; `?step=`, optional `?enrollment=`; `ActionGuideLayout` split + mobile Sheet
- [x] `StepProgressBar`, `RequirementList`, `MarkdownBody`, mark done / skip, prev/next
- [x] Notes per step; debounced `PATCH …/progress`
- [x] Sign-in prompt for visitors before persisted enroll (Q1)

### 3.4 — My guides (`/my`)

**Spec:** [My guides](./DESIGN.md#my-guides-my)

- [x] In progress \| Completed tabs; sort in-progress by started
- [x] Continue → `/actions/:slug?step=…`; abandon with confirm

### 3.5 — Auth (`/login`, `/register`)

**Spec:** [Sign in](./DESIGN.md#sign-in-login), [Register](./DESIGN.md#register-register)

- [x] Compare-style cards; `returnUrl`; cross-links between login/register

**Exit criteria met.** Register → search catalog → open action → Start guide → mark steps → reload → state on action page and `/my` restored (requires local Worker + D1; see Phase 1 smoke).

---

## Phase 4 — Contributor editor

**Goal:** Contributor can create, edit, preview, and publish actions users consume in Phase 3.

**Depends on:** Phase 3 (read path stable).

**Design:** [Contributor hub](./DESIGN.md#contributor-hub-contributor), [Contributor editor](./DESIGN.md#contributor-editor), [Content guidelines](./DESIGN.md#content-guidelines-for-contributors).

### Tasks

- [ ] **4.1** Hub — drafts + published list, badges, links to edit/new
- [ ] **4.2** Editor — metadata (title, slug auto from title, summary, tags with suggestions), steps CRUD, reorder, requirements (label; kind UI post-MVP per Q28)
- [ ] **4.3** Preview toggle — mirrors [action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route) browse/guide preview
- [ ] **4.4** Publish — minimal validation (Q27); drafts never on public catalog

**Exit criteria:** Seed contributor creates 5+ step action, publishes; appears on `/actions` and works through guide mode.

---

## Phase 5 — Polish

**Goal:** Production-quality UX per design system and accessibility section.

**Depends on:** Phases 3–4.

**Design:** [Accessibility](./DESIGN.md#accessibility), empty/loading notes in catalog and home (Q37), SEO on action page (Q36).

### Tasks

- [ ] **5.1** Empty states, loading skeletons, Sonner toasts; autosave errors toast + inline banner (Q38)
- [ ] **5.2** Sanitized markdown typography for step bodies
- [ ] **5.3** Mobile-first pass — sticky actions, Sheet outline, focus on step change
- [ ] **5.4** `aria-live` on step change; keyboard prev/next; done state not color-only
- [ ] **5.5** Basic meta title/description on `/actions/:slug`

**Exit criteria:** Pass manual a11y smoke on action page; Lighthouse-friendly public pages; no regressions on Phase 3 flows.

---

## Phase 6 — Deployment & dashboard

**Goal:** `steps.da-mr.com` live; linked from main dashboard; CI deploys on `main`.

**Depends on:** Phases 1–5 (MVP stable).

### Tasks

- [ ] **6.1** Worker deploy + custom domain (assets + `/api/*`, compare pattern)
- [ ] **6.2** `.github/workflows/deploy.yml` job; D1 migrate on deploy
- [ ] **6.3** `turbo.json` / `VITE_STEPS_ORIGIN`; card on `apps/main`
- [ ] **6.4** Seed one published sample action for smoke test

**Exit criteria:** Push to `main` deploys; public URL works end-to-end.

---

## Post-MVP (not phased here)

Tracked in [`PLAN.md` §Future](./PLAN.md#future-post-mvp) and [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md):

- Action versioning + migration screen (Q3)
- Document uploads (R2)
- Full-text search, i18n, admin moderation, PWA offline

Update this file when a post-MVP initiative becomes a numbered phase.

---

## Route → phase matrix

| Route | Phase first shipped | Design |
| ----- | ------------------- | ------ |
| `/` | 3.1 | [Home](./DESIGN.md#home--) |
| `/actions` | 3.2 | [Catalog](./DESIGN.md#action-catalog-actions) |
| `/actions/:slug` | 3.3 | [Action page](./DESIGN.md#action-page-actionsslug-overview--guide-one-route) |
| `/my` | 3.4 | [My guides](./DESIGN.md#my-guides-my) |
| `/login`, `/register` | 3.5 | [Auth](./DESIGN.md#sign-in-login) |
| `/contributor` | 4.1 | [Hub](./DESIGN.md#contributor-hub-contributor) |
| `/contributor/actions/new`, `…/edit` | 4.2 | [Editor](./DESIGN.md#contributor-editor) |

---

## Component → phase matrix

From [Components (planned)](./DESIGN.md#components-planned):

| Component | Phase |
| --------- | ----- |
| `PageHeader`, `LoadingState`, `ErrorState`, `ProtectedRoute` | 2 |
| `ActionCatalogToolbar`, `ActionSearchResults`, `Pagination` | 3.2 |
| `ActionGuideLayout`, `StepProgressBar`, `RequirementList`, `MarkdownBody` | 3.3 |
| Contributor editor UI (step list, markdown fields) | 4 |
| Sheet outline (mobile) | 3.3 (required), refined in 5.3 |

---

## Architecture (implementation constraints)

These affect all phases; details in [`PLAN.md` §Architecture](./PLAN.md#architecture-decisions).

1. **Single action URL** — Guide mode on `/actions/:slug` only; no `/guide/*` route ([design](./DESIGN.md#action-page-actionsslug-overview--guide-one-route)).
2. **Templates vs progress** — `enrollments` + `step_progress` per user; snapshot at enroll when versioning lands (Q40).
3. **One Worker** — Static `dist/` + `/api/*` (compare).
4. **D1 source of truth** — TanStack Query cache on client; no offline-only MVP.

---

## How to update docs

1. **UX change** → edit [`DESIGN.md`](./DESIGN.md) first, then adjust phase tasks here and checkboxes in [`PLAN.md`](./PLAN.md).
2. **New phase or reorder** → edit this file + execution diagram in `PLAN.md`.
3. **Open product question** → [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md); once resolved, reflect in `DESIGN.md` and linked phase above.
