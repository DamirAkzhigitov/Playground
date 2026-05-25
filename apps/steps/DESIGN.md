# Steps — Design & UX

Living document for UI conventions. Build order and phase exit criteria:
[`IMPLEMENTATION.md`](./IMPLEMENTATION.md). **Phase 0** uses minimal custom CSS;
when building UI (Phase 2+), align with `apps/compare/DESIGN.md` (Tailwind 4,
shadcn/ui, mobile-first, accessible forms).

---

## Design principles

1. **Clarity over density** — one primary task per screen (read a step, mark done, search).
2. **Resume-friendly** — always show where the user is (step N of M, % complete).
3. **Trust** — requirements and explanations visible before marking done; no dark patterns.
4. **Contributor safety** — drafts clearly labeled; preview before publish.
5. **Mobile-first** — many users will check steps on phone during appointments.

---

## Screen map (target)

| Route                           | Screen                         | Auth        | Primary actions                                                             |
|---------------------------------|--------------------------------|-------------|-----------------------------------------------------------------------------|
| `/`                             | Home                           | Public      | Search, browse popular actions, sign in                                     |
| `/actions`                      | Action catalog                 | Public      | Search, filter, sort, paginate, open action                                 |
| `/actions/:slug`                | Action page (overview + guide) | Public\*    | Read summary, start guide, work steps inline — **no separate runner route** |
| `/my`                           | My guides                      | User        | Continue → action page, completed, abandon enrollment                       |
| `/login`                        | Sign in                        | Public      | Email/password login                                                        |
| `/register`                     | Create account                 | Public      | Register; link to login                                                     |
| `/contributor`                  | Contributor hub                | Contributor | List drafts / published                                                     |
| `/contributor/actions/new`      | New action                     | Contributor | Create draft                                                                |
| `/contributor/actions/:id/edit` | Action editor                  | Contributor | Steps CRUD, preview, publish                                                |

\*Visitors can use the runner locally; **persisted** progress requires sign-in (prompt at start or on first save).

Global chrome: header with logo, **Browse actions** → `/actions`, **My guides** (signed in), **Sign in** / account menu. Mobile: bottom nav or compact header (TBD in Phase 2; match compare patterns).

---

## Pages (detailed)

### Home — `/`

**Purpose:** Fast entry — search and discover high-value actions without loading the full catalog.

**Layout**

- Page title + one-line value prop.
- **Search bar** (primary): placeholder e.g. “Find a guide…”. Submit or debounced typeahead navigates to `/actions?q=…` (preferred) or shows top matches inline with “See all results”.
- **Most popular** section: horizontal scroll or grid (6–12 cards) — actions ranked by enrollment count or editorial seed in MVP.
- **View all actions** link → `/actions`.
- Secondary: **Sign in** / **Create account** in header; no auth gate on this page.

**Empty / edge:** If search returns nothing from home, friendly copy + link to full catalog with filters cleared.

**Decisions:** Browse/search without auth (Q5, Q6). Home is not the full list — catalog lives on `/actions`.

---

### Action catalog — `/actions`

**Purpose:** Full published-action directory — search, filter, sort, and paginate. Primary discovery surface beyond home highlights.

**URL state (shareable, back-button friendly)**

| Param  | Example         | Behavior                                                   |
|--------|-----------------|------------------------------------------------------------|
| `q`    | `?q=mortgage`   | Search title + summary (MVP; tags in post-MVP if needed)   |
| `tag`  | `?tag=finance`  | Filter by tag (repeatable `tag=` for multi-tag AND in MVP) |
| `sort` | `?sort=popular` | `popular` (default), `newest`, `title`                     |
| `page` | `?page=2`       | 1-based page index                                         |

**Layout**

- `PageHeader`: “All actions” + result count when `q` or filters active.
- **Toolbar** (sticky on mobile optional):
  - Search input (synced to `q`, debounced 300ms).
  - **Tag filter**: combobox with suggestions from existing tags (free-text tags on actions; Q4).
  - **Sort** select: Popular / Newest / A–Z.
  - **Clear filters** when any param set.
- **Results**: `ActionSearchResults` cards — title, summary snippet (~2 lines), tag badges, optional step count / total estimated time (rollup from steps when available).
- **Pagination**: Previous / Next + page numbers; page size **20** (adjust in API). Show “Page X of Y” and total count.
- **Loading:** skeleton cards; **empty:** friendly message + example searches (Q37).

**Interactions**

- Card click → `/actions/:slug`.
- Changing search/filter resets `page` to 1.
- No sign-in required.

**API:** `GET /api/actions?q=&tag=&sort=&page=&limit=20` — returns `{ items, total, page, pageSize }`.

---

### Action page — `/actions/:slug` (overview + guide, one route)

**Purpose:** Single page for discovering an action, starting a guide, and working through every step. **No navigation to a separate runner URL** — the UI switches mode in place (Q9: bodies hidden until guide is active).

**URL state**

| Param        | Example            | Behavior                                                                                                 |
|--------------|--------------------|----------------------------------------------------------------------------------------------------------|
| `step`       | `?step=3`          | Active step (1-based order or step id — pick one in implementation). Omitted = browse/overview emphasis. |
| `enrollment` | `?enrollment=uuid` | When user has multiple enrollments for same action (Q11); default to latest in-progress if omitted.      |

Shareable links from **My guides** use `/actions/:slug?step=N` (and `enrollment` when needed).

**Two in-page modes** (same route, no full-page route change)

1. **Browse** — before or without an active enrollment:
   - Title, summary, author nickname (Q33), tags, optional **total estimated time**.
   - **Step list:** all steps visible with **titles only**; bodies collapsed/hidden (Q9).
   - Per-step **estimated effort** on the list when set (Q10).
   - CTAs: **Start guide**, **Continue** (resume in-place), **Start again** / **Drop progress** (Q12, Q23).
   - **Start guide** creates enrollment then switches to guide mode on this page; visitors get sign-in/register first (Q1).

2. **Guide** — after Start / Continue (enrollment exists):
   - Same page scroll/layout; **does not** push `/guide/…`.
   - **Desktop:** split view — step outline (left or top) stays visible with done/pending/skipped icons; **active step panel** (right or below) shows title, `MarkdownBody`, requirements, notes, actions.
   - **Mobile:** outline via **Sheet** (Q17) or compact step picker; active step content in main column; sticky **Mark done** / **Skip** / **Prev** / **Next**.
   - Header on page: action title + **Step N of M** + `StepProgressBar` (% = `done` only; Q19).
   - Active step: `RequirementList`, per-step **notes** (Q16), debounced `PATCH …/progress`.
   - **Mark as done**, **Skip** (Q14), **Previous** / **Next** — manual advance (Q13). Jump to any step from outline (Q18).
   - Tapping another step in the outline updates `?step=` (replaceState) without leaving the page.

**Transitions**

- Start / Continue → guide mode + scroll/focus first incomplete step; set `?step=`.
- “Back to overview” control (optional) collapses to browse layout but keeps enrollment/progress.
- Leaving the page and returning restores via `/my` → `/actions/:slug?step=…`.

**Completion:** Mixed step states allowed (Q2, Q20). Versioning banner → migration UI when newer action version exists (Q3).

**SEO:** `<title>` and meta description from action title/summary (Q36).

---

### My guides — `/my`

**Purpose:** Resume work; review finished guides. **Requires sign-in** (`ProtectedRoute`).

**Layout**

- Tabs or sections: **In progress** | **Completed** (same page; Q22).
- **In progress** list: action title, step progress (N/M + bar), last updated; sort by **started** date (Q21). Row actions: **Continue** → `/actions/:slug?step=…`, **Abandon** with confirm (Q23).
- **Completed** list: completed date, link to `/actions/:slug` (read-only browse or last step).

**Empty:** CTA to `/actions` with example searches.

---

### Sign in — `/login`

**Purpose:** Authenticate existing users. Match **compare** auth UX: centered `Card`, email + password, inline errors, link to register.

**Fields:** email, password, submit.

**After login:** `returnUrl` query param if present, else `/my`.

**Link:** “Create an account” → `/register?returnUrl=…`.

---

### Register — `/register`

**Purpose:** Create a user account to persist enrollments and notes (Q1, Q7). Separate route, compare-style (not a single combined tabbed auth screen).

**Fields:** email, password, confirm password (client-side match validation).

**After register:** auto sign-in, redirect to `returnUrl` or `/my`.

**Link:** “Already have an account?” → `/login?returnUrl=…`.

**Copy:** Short note that an account is required to save guide progress across devices.

**Contributor role:** not self-serve in MVP — all new users are `user` (Q30).

---

### Contributor hub — `/contributor`

**Purpose:** List contributor’s drafts and published actions. **Requires contributor role.**

**Layout:** Table or cards with title, status badge (Draft / Published), updated_at. Actions: **Edit**, **New action** → `/contributor/actions/new`.

Draft actions are **not** public on catalog (Q34 — confirm in `OPEN_QUESTIONS.md` if still open).

---

### Contributor editor — `/contributor/actions/:id/edit` (and `/new`)

**Purpose:** Author and publish actions. See [Contributor editor](#contributor-editor) below.

**Preview:** Toggle in editor (Q26), read-only as user would see overview + runner sample.

**Publish:** Minimal validation — title, unique slug (auto from title, editable; Q29), ≥1 step (Q27).

---

## Action page — guide mode (wireframe)

Same route as overview; guide mode shown below (desktop split; mobile stacks + Sheet outline).

```text
┌──────────────────────────────────────────────────────────┐
│ Apartment purchase with loan · Step 3 of 12 · ████░░ 25% │
├──────────────────┬───────────────────────────────────────┤
│ 1 ✓ Budget       │ Get mortgage pre-approval             │
│ 2 ✓ Research     │                                       │
│ 3 ● Pre-approval │ [Markdown explanation body…]          │
│ 4 ○ Viewings     │                                       │
│ 5 ○ Offer        │ Requirements                          │
│ …                │ ○ Bank statements (3 months)          │
│                  │ ○ Employment letter                   │
│                  │ Your notes                            │
│                  │ ┌─────────────────────────────────────┐ │
│                  │ │ Called bank, appointment Tue        │ │
│                  │ └─────────────────────────────────────┘ │
│                  │ [ Mark done ] [ Skip ]  [ ← ] [ → ]   │
└──────────────────┴───────────────────────────────────────┘
```

- **Outline** always on page (desktop) or **Sheet** (mobile): jump to any step; done/pending/skipped icons.
- **Previous** disabled on step 1.
- Enrollment snapshot at start (Q40).

---

## Contributor editor

- Split or stacked layout: step list (left) + editor (right) on desktop; tabs on mobile.
- Fields per step: title, markdown body, ordered requirements (label + kind).
- **Add step**, **Reorder**, **Delete** (confirm if published action has enrollments — soft-delete/archive later).
- Status badge: Draft / Published.

---

## Components (planned)

Reuse from compare where possible:

- `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Tabs`, `Sheet` (outline), `Sonner` toasts
- `PageHeader`, `LoadingState`, `ErrorState`, `ProtectedRoute`

App-specific (to build):

- `StepProgressBar` — N of M + percent
- `RequirementList` — read-only checklist
- `ActionSearchResults` — cards with title, summary snippet, tags
- `ActionCatalogToolbar` — search, tag filter, sort, clear
- `Pagination` — page controls wired to URL `page` param
- `MarkdownBody` — sanitized render
- `ActionGuideLayout` — browse vs guide mode on `/actions/:slug` (outline + active step panel)

---

## Accessibility

- Step changes announce via `aria-live` polite region.
- Mark done: real `button`, not div; keyboard Next/Previous.
- Focus management when moving between steps.
- Color is not the only indicator for done state (icon + text).

---

## Content guidelines (for contributors)

- One outcome per step (“Submit pre-approval application” not “Bank stuff”).
- Body: what, why, how long it often takes, common pitfalls.
- Requirements: concrete artifacts (“Passport copy”) not vague (“Documents”).

---

## Open questions

Unresolved product choices live in [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md). Page specs above reflect decisions already recorded there; update both files when answers change.
