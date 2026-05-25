# Steps

**Subdomain (planned):** [steps.da-mr.com](https://steps.da-mr.com)

A catalog of **actions** — complex processes many people go through (buying an
apartment with a loan, registering a business, moving abroad, etc.). Each action
is broken into **small, well-explained steps**. Signed-in users search for an
action, open a guide, mark steps done, leave notes, and **resume later** where
they left off.

Contributors maintain the catalog: add actions, edit step sequences, and define
**requirements** per step (documents, prerequisites, links — document upload is
**out of scope for MVP**).

---

## Problem

Life admin tasks are fragmented across blogs, forums, and one-off checklists.
People lose track of what they already did, what is next, and what they need
before the next step. Steps centralizes **curated guides** with **personal
progress**.

---

## Users & roles

| Role | Capabilities |
| ---- | ------------ |
| **Visitor** | Browse public catalog (optional; TBD), read marketing/home |
| **User** | Register / login, search actions, start a guide, mark steps, notes, resume progress |
| **Contributor** | Create/edit actions and steps, requirements, publish workflow (draft → published) |
| **Admin** | Moderate content, manage contributors (later) |

---

## Core concepts

| Term | Meaning |
| ---- | ------- |
| **Action** | A top-level guide topic (e.g. “Apartment purchase with loan”) — title, slug, summary, tags, locale |
| **Step** | One ordered item in an action — title, body (markdown), optional requirements list |
| **Requirement** | What the user needs for a step (ID document, bank pre-approval letter, appointment booked) — text + type; file attachments post-MVP |
| **Enrollment** | A user’s instance of working through an action (started at, last visited) |
| **Step progress** | Per enrollment: `pending` / `done` / `skipped`, optional note, `completed_at` |

Progress is stored per user per enrollment, not globally on the action template.

---

## Primary flows (target product)

### Discover & start

1. User signs in.
2. Search or browse actions (full-text on title + tags + summary).
3. Open action page (`/actions/:slug`) → overview + step list (titles).
4. **Start guide** → creates enrollment, switches to guide mode on the **same page** (first incomplete step).

### Work through steps

1. On `/actions/:slug` (guide mode): active step body, requirements checklist, mark done, add note.
2. Next / previous / jump from outline; URL `?step=` for deep links — no separate runner route.
3. Autosave progress (debounced API).
4. Dashboard: “Continue” for in-progress enrollments.

### Contribute

1. Contributor opens editor (separate area, role-gated).
2. Create action (draft), add/reorder steps, edit markdown bodies, attach requirements.
3. Preview as end-user would see it.
4. Publish when ready (versioning TBD — see `PLAN.md`).

---

## MVP scope

### In scope (first releases)

- Email/password auth (same pattern as `apps/compare` — cookie session, D1)
- Action catalog: list, search, detail
- Step list with rich text bodies (markdown rendered safely)
- User enrollment + per-step progress + notes
- Contributor CRUD for actions/steps (no document upload)
- Deploy: Cloudflare Worker (API + static assets) or Pages + Worker — see `PLAN.md`

### Out of scope (MVP)

- Document / file uploads per step
- Payments, third-party integrations (banks, government APIs)
- Comments, ratings, community forums
- Multi-language content editor (may serve `en` first; i18n hooks later)
- Real-time collaboration on editing

---

## Stack (planned)

Aligned with other React tools in this monorepo (`apps/compare`):

| Layer | Choice |
| ----- | ------ |
| Frontend | React 19, TypeScript, Vite 8 |
| UI | Tailwind 4 + shadcn/ui (Phase 0 uses minimal CSS only) |
| Data | TanStack Query |
| API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 |
| Hosting | `steps.da-mr.com` — Worker with `[assets]` + `/api/*` (compare pattern) |

---

## Repository layout

```text
apps/steps/
├── README.md          # this file — product + dev overview
├── IMPLEMENTATION.md  # phased build plan (links to DESIGN per phase)
├── PLAN.md            # detailed checklists, API/schema notes
├── DESIGN.md          # UX/UI spec — screens, components, a11y
├── index.html
├── package.json       # @playground/steps
├── src/               # React app (growing)
├── tests/
└── worker/            # (Phase 1) Hono API + D1 — not created yet
```

---

## Local development

From the repo root:

```bash
pnpm install
pnpm --filter @playground/steps dev
```

Opens [http://localhost:3003](http://localhost:3003) by default.

| Task | Command |
| ---- | ------- |
| Build | `pnpm turbo run build --filter=@playground/steps` |
| Lint | `pnpm --filter @playground/steps lint` |
| Type-check | `pnpm --filter @playground/steps type-check` |
| Test | `pnpm --filter @playground/steps test` |

When the Worker exists, Vite will proxy `/api/*` to `wrangler dev` (port TBD),
same as compare.

---

## Deployment (not wired yet)

Follow the monorepo recipe in root `README.md` → “Adding a new tool”:

1. Cloudflare project + custom domain `steps.da-mr.com`
2. Job in `.github/workflows/deploy.yml`
3. Card on `apps/main` dashboard

Tracked in `PLAN.md` Phase 6.

---

## Related docs

- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — **phased development** (what ships each phase; links to DESIGN)
- [`DESIGN.md`](./DESIGN.md) — screen map, page specs, components, accessibility
- [`PLAN.md`](./PLAN.md) — task checkboxes, API tables, schema
- [`../compare/README.md`](../compare/README.md) — reference Worker + auth pattern
