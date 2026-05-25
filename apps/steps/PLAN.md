# Steps App — Implementation Plan

Guided catalog of life **actions** with per-user **progress**, **notes**, and a
**contributor editor**.

**Subdomain:** `steps.da-mr.com`  
**Stack (target):** React 19 · TypeScript · Vite 8 · Tailwind 4 · shadcn/ui · TanStack Query · Hono · D1  
**Reference:** `apps/compare` (Worker + cookie auth + D1)

> **Phases & design links:** [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)  
> **UI spec:** [`DESIGN.md`](./DESIGN.md) — reuse compare patterns where sensible.

---

## Phase 0 — Project scaffold & documentation

> Base app in monorepo; no backend; docs define product and architecture.

- [x] **0.1** Create `apps/steps` with `@playground/steps` and standard scripts.
- [x] **0.2** Placeholder UI shell (`index.html`, `src/main.tsx`, `src/App.tsx`).
- [x] **0.3** Vite, TypeScript project references, ESLint, Vitest stub.
- [x] **0.4** `README.md`, `PLAN.md`, `DESIGN.md`.
- [x] **0.5** Document monorepo integration in root `README.md` and `AGENTS.md`.
- [x] **0.6** `pnpm install` + verify `dev` / `build` / `lint` / `type-check` / `test` from root.

**Exit criteria:** blank page on port 3003; docs readable; CI build includes the app.

---

## Phase 1 — Backend (Worker + D1)

> API and schema before feature UI.

### 1A — Worker setup

- [x] **1A.1** `apps/steps/worker/` — `wrangler.toml`, `package.json`, Hono entry.
- [x] **1A.2** D1 binding `DB`; migrations folder.
- [x] **1A.3** `GET /api/health`, JSON error middleware (CORS not needed; same-origin Worker pattern).
- [x] **1A.4** Vite proxy `/api` → `wrangler dev` in `vite.config.ts`.

### 1B — Schema (initial)

| Table | Purpose |
| ----- | ------- |
| `users` | id, email, password_hash, role (`user` \| `contributor` \| `admin`), created_at |
| `sessions` | id, user_id, expires_at (compare pattern) |
| `actions` | id, slug, title, summary, tags_json, status (`draft` \| `published`), locale, author_id, timestamps |
| `steps` | id, action_id, order, title, body_md, estimated_minutes (added per Q10), created_at, updated_at |
| `step_requirements` | id, step_id, label, kind (`document` \| `task` \| `link`), details, order |
| `enrollments` | id, user_id, action_id, started_at, last_step_id, updated_at |
| `step_progress` | enrollment_id, step_id, status, note, completed_at — UNIQUE(enrollment_id, step_id) |

Indexes: `actions.slug`, `actions.status`, `steps(action_id, order)`, LIKE search on title/summary/tags (MVP). 0001_init.sql + 0002_seed.sql (sample "buy apartment" action + seeded contributor/user accounts for local smoke tests).

### 1C — Auth API

Implemented (role surfaced in /me + login/register; contributor via seed only per Q30; mirrors compare cookie auth):

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/api/auth/register` | User account (+ optional contributor flag later) |
| POST | `/api/auth/login` | Session cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user + role |

### 1D — Catalog & progress API (MVP)

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/api/actions` | public | ✅ (q, tag, sort, page, limit; published only) |
| GET | `/api/actions/:slug` | optional | Action + steps + requirements |
| POST | `/api/enrollments` | user | Start guide (`action_id`) |
| GET | `/api/enrollments` | user | My in-progress / completed |
| GET | `/api/enrollments/:id` | user | Detail + all step_progress |
| PATCH | `/api/enrollments/:id/progress` | user | Upsert step status + note |
| POST | `/api/contributor/actions` | contributor | Create draft action |
| PATCH | `/api/contributor/actions/:id` | contributor | Update metadata |
| PUT | `/api/contributor/actions/:id/steps` | contributor | Replace/reorder steps + requirements |
| POST | `/api/contributor/actions/:id/publish` | contributor | draft → published |

Validation: Zod on all mutating routes.

**Exit criteria met.** Full implementation in Phase 1 (see IMPLEMENTATION.md for API table + smoke notes). Migrations committed; local D1 works; wrangler boots cleanly.

---

## Phase 2 — Frontend shell

- [ ] **2.1** Tailwind 4 + shadcn/ui baseline (copy compare setup).
- [ ] **2.2** `react-router` routes (stubs):
  - `/` — home (search + popular actions)
  - `/actions` — full catalog (search, filters, pagination)
  - `/actions/:slug` — action page (overview + in-page guide; `?step=`, `?enrollment=`)
  - `/my` — my guides
  - `/login`, `/register` — compare-style auth pages
  - `/contributor` — editor layout
  - `/contributor/actions/new`, `/contributor/actions/:id/edit`
- [ ] **2.3** Auth context + protected routes (user vs contributor).
- [ ] **2.4** Typed API client + TanStack Query hooks.

**Exit criteria:** routes render; auth gate works against local API.

---

## Phase 3 — User features (MVP)

- [ ] **3.1** Action catalog (`/actions`) — debounced search, tag filter, sort, pagination, result cards.
- [ ] **3.2** Action page (`/actions/:slug`) — browse mode (outline, Start/Continue), guide mode on same route (`?step=`), split layout + Sheet outline.
- [ ] **3.3** Guide interactions — requirements, mark done / skip, notes, prev/next, autosave progress (no separate runner route).
- [ ] **3.4** My guides — continue / completed lists.
- [ ] **3.5** Autosave progress (debounced PATCH).

**Exit criteria:** end-to-end: register → search → start → complete steps → reload → state restored.

---

## Phase 4 — Contributor editor

- [ ] **4.1** Action list (drafts + published) for contributor.
- [ ] **4.2** Step editor — reorder (up/down MVP), markdown body, requirements CRUD.
- [ ] **4.3** Preview mode (read-only as user would see).
- [ ] **4.4** Publish flow with validation (at least one step, title, slug unique).

**Exit criteria:** contributor can create “Apartment purchase with loan” with 5+ steps and publish; user can consume it.

---

## Phase 5 — Polish

- [ ] **5.1** Empty states, loading skeletons, toasts.
- [ ] **5.2** Markdown rendering (sanitized) + typography for step bodies.
- [ ] **5.3** Mobile-first layout; sticky step nav on small screens.
- [ ] **5.4** Basic SEO for public action pages (meta title/description).

---

## Phase 6 — Deployment & dashboard link

- [ ] **6.1** Cloudflare Worker project + `steps.da-mr.com` custom domain.
- [ ] **6.2** `deploy.yml` job: build `@playground/steps`, `wrangler deploy`, D1 migrate.
- [ ] **6.3** `turbo.json` env `VITE_STEPS_ORIGIN`; main dashboard card + `VITE_STEPS_ORIGIN` in main vite.
- [ ] **6.4** Seed one sample published action for smoke testing.

**Exit criteria:** push to `main` deploys; link from da-mr.com works.

---

## Future (post-MVP)

- Document uploads (R2) linked to requirements
- Action versioning / changelog when steps update mid-enrollment
- Full-text search (D1 FTS or external index)
- i18n for actions and UI
- Admin moderation queue, contributor applications
- Export progress (PDF / JSON)
- PWA offline read of cached step content

---

## Architecture decisions

1. **Templates vs progress:** Action/step content is global; `enrollments` +
   `step_progress` are per-user. Editing a published action does not rewrite
   historical progress rows (future: snapshot action version on enroll).
2. **Contributor ≠ admin:** Role on `users.role`; MVP gates `/contributor/*` routes.
3. **Requirements are informational in MVP:** Checkboxes are local UX only until
   document upload exists; server may still store “acknowledged” later.
4. **Same deploy pattern as compare:** One Worker serves `dist/` and `/api/*`.
5. **No local-only mode:** D1 is source of truth; Query caches on client.

---

## Execution order

```text
Phase 0  Scaffold + docs     ████████░░  (current)
Phase 1  Backend              ░░░░░░░░░░
Phase 2  Frontend shell       ░░░░░░░░░░
Phase 3  User MVP             ░░░░░░░░░░
Phase 4  Contributor editor   ░░░░░░░░░░
Phase 5  Polish                 ░░░░░░░░░░
Phase 6  Deploy                 ░░░░░░░░░░
```
