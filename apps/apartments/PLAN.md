# Apartments App — Implementation Plan

Mobile-first web app for apartment viewings: prepare checklists, answer
questions on-site, compare apartments, export data.

**Subdomain:** `apartments.da-mr.com`
**API:** `apartments-api.da-mr.com`
**Stack:** React 19 · TypeScript · Vite 8 · Tailwind 4 · shadcn/ui · TanStack Query · React Hook Form
**Backend:** Hono on Cloudflare Workers · D1 · R2

> **UI conventions:** every screen built in this app must follow
> [`DESIGN.md`](./DESIGN.md) — component map, breakpoints, forms recipe,
> accessibility rules, and anti-patterns. Don't invent primitives when
> shadcn/ui ships them.

---

## Phase 0 — Project Scaffold

> Get the app compiling and running inside the monorepo with zero features.

- [x] **0.1** Create `apps/apartments/package.json` (`@playground/apartments`)
      with scripts: `dev`, `build`, `lint`, `lint:fix`, `format`,
      `format:check`, `type-check`, `test`, `test:coverage`.
- [x] **0.2** Add `index.html`, `src/main.tsx`, `src/App.tsx` (blank shell).
- [x] **0.3** Configure Vite (`vite.config.ts`), TypeScript
      (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`),
      ESLint (`eslint.config.js`).
- [x] **0.4** Install and configure Tailwind 4 with a base CSS file.
- [x] **0.5** Install core dependencies: `react`, `react-dom`, `react-router`,
      `@tanstack/react-query`, `react-hook-form`.
- [x] **0.6** Run `pnpm install` from root, verify `pnpm --filter @playground/apartments dev` starts.
- [x] **0.7** Verify `pnpm build`, `pnpm lint`, `pnpm type-check` pass from root.

**Exit criteria:** blank page renders on `localhost`, all monorepo commands pass.

---

## Phase 1 — Backend (Cloudflare Workers + D1)

> Build the API first. Everything the frontend needs is a REST call away.

### 1A — Worker Project Setup

- [x] **1A.1** Create `apps/apartments/worker/` with `wrangler.toml`,
      `package.json`, `tsconfig.json`.
- [x] **1A.2** Install Hono (`hono`) as the routing framework.
- [x] **1A.3** Add D1 binding (`DB`) and R2 binding (`PHOTOS`) in `wrangler.toml`.
- [x] **1A.4** Basic health-check endpoint: `GET /api/health → { ok: true }`.
- [x] **1A.5** CORS middleware (allow `localhost:*` in dev,
      `apartments.da-mr.com` in prod).
- [x] **1A.6** Error handling middleware (catch-all, return JSON errors).

### 1B — D1 Schema & Migrations

- [x] **1B.1** D1 tables:
  - `categories` (`id` TEXT PK, `name` TEXT, `order` INT)
  - `questions` (`id` TEXT PK, `label` TEXT, `type` TEXT, `category_id` TEXT FK,
    `required` BOOL, `is_archived` BOOL DEFAULT false, `order` INT)
  - `question_options` (`id` TEXT PK, `question_id` TEXT FK, `label` TEXT,
    `value` TEXT, `order` INT)
  - `apartments` (`id` TEXT PK, `title` TEXT, `address` TEXT, `price` REAL,
    `notes` TEXT, `created_at` TEXT, `updated_at` TEXT)
  - `answers` (`id` TEXT PK, `apartment_id` TEXT FK, `question_id` TEXT FK,
    `value` TEXT, `note` TEXT, `updated_at` TEXT,
    UNIQUE(`apartment_id`, `question_id`))
  - `photos` (`id` TEXT PK, `apartment_id` TEXT FK, `question_id` TEXT FK,
    `r2_key` TEXT, `created_at` TEXT)
- [x] **1B.2** Write initial migration (`migrations/0001_init.sql`).
- [x] **1B.3** Seed script — default categories and ~25 questions
      (`migrations/0002_seed.sql`).

### 1C — REST API Endpoints

- [x] **1C.1** Input validation with Zod for all mutating endpoints.
- [x] **1C.2** Category endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | GET | `/api/categories` | List categories (ordered) |
      | POST | `/api/categories` | Create category |
      | PATCH | `/api/categories/:id` | Update name / order |
      | DELETE | `/api/categories/:id` | Delete (only if no questions attached) |
- [x] **1C.3** Question endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | GET | `/api/questions` | List active questions with options, grouped by category |
      | POST | `/api/questions` | Create question + options |
      | PATCH | `/api/questions/:id` | Update / archive question |
      | PATCH | `/api/questions/reorder` | Bulk update order values |
- [x] **1C.4** Apartment endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | GET | `/api/apartments` | List apartments with completion stats |
      | POST | `/api/apartments` | Create apartment |
      | PATCH | `/api/apartments/:id` | Update apartment |
      | GET | `/api/apartments/:id` | Detail + all answers |
      | DELETE | `/api/apartments/:id` | Delete apartment + cascade answers/photos |
- [x] **1C.5** Answer endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | POST | `/api/answers` | Upsert answer (single or bulk) |
- [x] **1C.6** Photo endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | POST | `/api/photos/upload` | Upload photo to R2 |
      | GET | `/api/photos/:key` | Serve photo from R2 |
      | DELETE | `/api/photos/:id` | Delete photo from R2 + DB |
- [x] **1C.7** Export endpoints:
      | Method | Path | Description |
      |--------|------|-------------|
      | GET | `/api/export/json` | Full JSON dump |
      | GET | `/api/export/xlsx` | Excel export |

### 1D — Local Dev Workflow

- [x] **1D.1** `wrangler dev` runs locally with local D1 (SQLite).
- [x] **1D.2** Vite dev server proxies `/api/*` to Wrangler.
- [x] **1D.3** Verify all endpoints work with curl / REST client.

**Exit criteria:** all API endpoints respond correctly against local D1.
Tested manually or with a simple script.

---

## Phase 2 — Frontend Shell & Data Layer

> Connect React to the API. All data flows through TanStack Query.

### 2A — API Client & Hooks

- [x] **2A.1** Create typed API client (`src/lib/api.ts`) — thin fetch wrapper
      with base URL from env var, JSON parsing, error handling.
- [x] **2A.2** Define TypeScript types in `src/types/` matching API responses:
  - `Category`, `Question`, `QuestionOption`, `Apartment`, `Answer`, `Photo`.
- [x] **2A.3** TanStack Query hooks (`src/hooks/`):
  - `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
  - `useQuestions`, `useCreateQuestion`, `useUpdateQuestion`, `useReorderQuestions`
  - `useApartments`, `useApartment`, `useCreateApartment`, `useUpdateApartment`, `useDeleteApartment`
  - `useUpsertAnswer`
  - `useUploadPhoto`, `useDeletePhoto`
- [x] **2A.4** Configure `QueryClient` with sensible defaults (stale time,
      retry, refetch on window focus).

### 2B — Routing & Layout

- [x] **2B.1** Set up `react-router` with routes:
      | Path | Page |
      |------|------|
      | `/` | Dashboard (redirects to `/apartments`) |
      | `/apartments` | Apartment List |
      | `/apartments/new` | Create Apartment |
      | `/apartments/:id` | Apartment Detail |
      | `/apartments/:id/inspect` | Inspection Screen |
      | `/questions` | Question Management |
      | `/compare` | Comparison Table |
      | `/export` | Export Page |
- [x] **2B.2** Mobile bottom tab bar: Apartments, Questions, Compare, Export.
- [x] **2B.3** Loading and error boundary components.

**Exit criteria:** routes render stubs, API hooks fetch data and display
loading/error states.

---

## Phase 3 — Core Features (MVP)

> The main functionality: manage questions, inspect apartments, view details.

### 3A — Question Management (`/questions`)

- [x] **3A.1** Question list page — grouped by category, shows type badge.
- [x] **3A.2** Create/edit question form (React Hook Form):
  - Fields: label, type, category, required, order.
  - Conditional fields: options list for `select`/`multi-select`, min/max
    for `rating`.
- [x] **3A.3** Archive toggle (soft delete) — archived questions greyed out,
      hidden by default with "Show archived" toggle.
- [x] **3A.4** Reorder questions within category (up/down buttons).
- [x] **3A.5** Category management — create, rename, reorder, delete (only
      if no questions attached).
- [x] **3A.6** Select option management — add/remove/reorder options inline
      on the question form.

### 3B — Apartment Management (`/apartments`)

- [ ] **3B.1** Apartment list — cards showing title, address, price,
      completion %, critical missing count.
- [ ] **3B.2** Create/edit apartment form — title, address, price, notes.
- [ ] **3B.3** Status badges: Needs Review / Completed / Missing Critical.
- [ ] **3B.4** Search/filter apartments by name.

### 3C — Inspection Screen (`/apartments/:id/inspect`)

The primary screen used during a viewing.

- [ ] **3C.1** One-question-at-a-time view: question label, input, progress
      indicator (`Question 4 / 25`).
- [ ] **3C.2** Input components per question type:
  - `text` → textarea
  - `number` → numeric input with +/- steppers
  - `boolean` → large Yes / No / Skip buttons
  - `select` → radio button list
  - `multi-select` → checkbox list
  - `rating` → 1–5 star/dot selector
- [ ] **3C.3** Navigation: Next / Previous buttons.
- [ ] **3C.4** Section jump — drawer listing categories with completion
      indicators (e.g. "Kitchen 3/5").
- [ ] **3C.5** "Extra note" expandable textarea under every answer.
- [ ] **3C.6** Autosave — upsert answer via API on every change (debounced).
- [ ] **3C.7** Summary screen at the end: missing answers count, list of
      unanswered required questions, "Go back to fix" links.

### 3D — Apartment Detail (`/apartments/:id`)

- [ ] **3D.1** Overview panel: completion %, missing critical list, quick stats.
- [ ] **3D.2** All answers listed by category — editable inline.
- [ ] **3D.3** "Start / Resume Inspection" button → navigates to 3C.

**Exit criteria:** full question CRUD, apartment CRUD, inspection flow works
end-to-end on a phone-sized screen with data persisted in D1.

---

## Phase 4 — Photos (R2)

- [ ] **4.1** Photo capture component — camera or file picker, uploads
      directly to R2 via the API.
- [ ] **4.2** Attach photos to a specific `(apartmentId, questionId)` pair.
- [ ] **4.3** Photo gallery per question in the inspection screen and
      apartment detail page.
- [ ] **4.4** Lightbox viewer for full-size photos.
- [ ] **4.5** Delete photos.

**Exit criteria:** photos captured during inspection appear linked to the
correct question and apartment, stored in R2.

---

## Phase 5 — Export & Comparison

### 5A — Export (`/export`)

- [ ] **5A.1** JSON export — calls `/api/export/json`, downloads file.
- [ ] **5A.2** JSON import — upload JSON, API restores data.
- [ ] **5A.3** Excel export — calls `/api/export/xlsx`, downloads
      `apartments_export_YYYY-MM-DD.xlsx`.
      One row per apartment, columns from active questions, grouped by category.

### 5B — Comparison Table (`/compare`)

- [ ] **5B.1** Select apartments to compare (checkbox list).
- [ ] **5B.2** Comparison table: rows = questions, columns = apartments.
- [ ] **5B.3** Color coding: green/red for boolean, gradient for ratings.
- [ ] **5B.4** Filter by category.
- [ ] **5B.5** Highlight differences — cells where values diverge.
- [ ] **5B.6** Responsive: horizontal scroll on mobile, sticky first column.

**Exit criteria:** export downloads correct files; comparison of 3+ apartments
renders correctly on mobile and desktop.

---

## Phase 6 — Deployment & CI/CD

- [ ] **6.1** Create Cloudflare Pages project `apartments` (disable Git
      auto-build).
- [ ] **6.2** Add deploy job to `.github/workflows/deploy.yml`:
  - Build frontend → deploy to Pages.
  - Deploy Worker → `wrangler deploy`.
  - Run D1 migrations.
- [ ] **6.3** Add custom domains: `apartments.da-mr.com` (Pages),
      `apartments-api.da-mr.com` (Worker).
- [ ] **6.4** Link from `apps/main/index.html` dashboard.

**Exit criteria:** push to `main` deploys both frontend and Worker API
automatically.

---

## Phase 7 — Polish & UX

- [ ] **7.1** Loading skeletons and optimistic UI updates.
- [ ] **7.2** Empty states with CTAs.
- [ ] **7.3** Toast notifications for save/export actions.
- [ ] **7.4** Dark mode toggle.
- [ ] **7.5** Keyboard shortcuts for desktop (arrow keys in inspection).

---

## Future Features (Post-MVP)

Tracked but not scheduled. Implement on demand.

- [ ] PWA manifest + service worker for offline support.
- [ ] Templates — different question sets for Apartment / House / New Build.
- [ ] Scoring — weighted evaluation producing a final score per apartment.
- [ ] Timeline tracking — Visited → Negotiating → Lawyer Review → Rejected / Purchased.
- [ ] PDF export — formatted report for sharing.
- [ ] Google Drive export.
- [ ] Authentication — email login, then Google auth / magic links.
- [ ] Multi-user / sharing — Cloudflare Durable Objects for real-time collaboration.
- [ ] Drag-and-drop reorder (replace up/down buttons with `@dnd-kit`).
- [ ] Swipe gestures between questions.

---

## Execution Order Summary

```text
Phase 0  Scaffold             ██░░░░░░░░  (done)
Phase 1  Backend (D1/Workers) ████░░░░░░  (do next)
Phase 2  Frontend Shell       ███░░░░░░░
Phase 3  Core Features (MVP)  ██████░░░░  (largest phase)
Phase 4  Photos (R2)          █░░░░░░░░░
Phase 5  Export & Comparison  ███░░░░░░░
  ─── MVP complete ───
Phase 6  Deploy & CI/CD       █░░░░░░░░░
Phase 7  Polish               █░░░░░░░░░
Future   On demand            ░░░░░░░░░░
```

Phases 0–5 deliver a fully functional backend-first MVP.
Phase 6+ handles production deployment and UX refinements.

---

## Key Architecture Decisions

1. **Backend-first, not local-first.** D1 is the single source of truth from
   day one. No Zustand data stores, no localStorage sync, no offline-first
   complexity. TanStack Query caches server state on the client.
2. **Questions are database-driven, not hardcoded.** The entire schema is
   dynamic — questions, options, and categories are all user-managed data.
3. **Completion is computed, never stored.** `answeredQuestions / totalActiveQuestions`
   recalculated in real-time so adding new questions doesn't break old data.
4. **Never delete, always archive.** Questions use `is_archived` flag to
   preserve referential integrity with historical answers.
5. **Answers are a separate flat table.** `(apartmentId, questionId) → value`
   decouples the inspection data from the schema.
6. **Hono for the API.** Lightweight, TypeScript-native, built for Workers.
   Avoids boilerplate of raw `fetch` handler while staying minimal.
7. **No state management library.** TanStack Query handles server state,
   React's own `useState`/context handles UI state. Keeps the dependency
   tree small.
