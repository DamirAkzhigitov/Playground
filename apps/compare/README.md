# Apartments

Mobile-first web app for apartment viewings: reusable checklists, quick answers during visits, local save, and exports for comparing places later.

## Goals

- Prepare a reusable checklist and questions beforehand
- Answer questions quickly during the visit
- Switch between sections fast
- Save everything locally
- Export to JSON / Excel / Google Drive (planned)
- Compare multiple apartments later (Phase 2)

## Local development

From the repo root:

```bash
pnpm install
pnpm --filter @playground/compare dev
```

Other scripts: `build`, `lint`, `type-check`, `test` (see `package.json`).

---

## Product flow

### One question at a time

```text
[ Question 4 / 25 ]

Does apartment have solar panels?

[ Yes ]  [ No ]  [ Skip ]
```

**Navigation:** swipe or buttons — Next, Previous, jump to section.

### Question types

| Type         | Example             |
| ------------ | ------------------- |
| text         | Notes               |
| number       | Apartment size      |
| boolean      | Solar panels        |
| select       | Heating type        |
| multi-select | Included appliances |
| rating       | Noise 1–5           |
| photos       | Bathroom photos     |

### Notes per question

| Field      | Example                         |
| ---------- | ------------------------------- |
| Question   | Condition of kitchen?           |
| Answer     | Good                            |
| Extra note | Cabinets old but appliances new |

### Summary before leaving

Example copy:

- **Missing answers:** 3
- Elevator condition, common expenses, parking ownership

---

## Phase 2 — Comparison

Highest long-term value: a comparison table across apartments (price, m², solar, parking, condition, etc.). Especially useful after many viewings.

---

## UX principles

- **Mobile-first** — used while walking; large, thumb-friendly controls
- **Autosave** and offline-friendly behavior where possible
- **Photos** attached to questions (cracks, boiler, panel, parking); store locally first

---

## Recommended stack

### Frontend

- React, TypeScript, Vite
- TanStack Query, React Hook Form
- Tailwind CSS

_(This repo’s app may differ slightly from the original sketch; see `package.json`.)_

### Backend (recommended)

**Cloudflare Workers + D1 + R2**

| Piece       | Role                                                  |
| ----------- | ----------------------------------------------------- |
| **D1**      | questions, templates, apartments, answers, categories |
| **R2**      | apartment photos, exports, PDFs later                 |
| **Workers** | API layer — cheap and simple                          |

**Optional later:** Durable Objects only if you need real-time collaboration, live editing, or multi-user sync — not required initially.

### High-level architecture

```text
React App
    ↓
Cloudflare Workers API
    ↓
D1 Database
    ↓
R2 Storage
```

---

## Core data model

### 1. Questions

```ts
type Question = {
  id: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select'
  categoryId: string
  required: boolean
  options?: QuestionOption[]
  archived?: boolean
  order: number
}
```

### 2. Question options (for selects)

```ts
type QuestionOption = {
  id: string
  questionId: string
  label: string
  value: string
  order: number
}
```

Example labels:

```text
Heating Type:
- Central
- Split Units
- Underfloor
```

### 3. Apartments

```ts
type Apartment = {
  id: string
  title: string
  address?: string
  price?: number
  createdAt: string
}
```

### 4. Answers

Answers reference questions by **ID** (supports a changing question set over time):

```ts
type Answer = {
  apartmentId: string
  questionId: string
  value: unknown
  note?: string
}
```

**Why this helps:** if you add a question after ten inspections, every apartment shows the new question with a missing answer — no destructive migration.

**Select options:** adding “Underfloor” to heating applies everywhere; old answers stay valid.

### Completion is dynamic

Do **not** persist a single `completed: true` flag. Derive completion from:

```text
answeredQuestions / totalQuestions
```

…in real time, because the question set can change.

---

## Pages (conceptual)

| Area                | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| Dashboard           | Apartments, templates, questions, export, settings |
| Apartment list      | Filters: needs review, completed, missing critical |
| Inspection screen   | Main workflow during a visit                       |
| Question management | Admin-style CRUD for the checklist                 |

### Question management

| Action         | Behavior                                                  |
| -------------- | --------------------------------------------------------- |
| Create         | label, type, category, required, critical, order, default |
| Edit           | Updates apply globally                                    |
| Archive        | Prefer `archived: true` over hard delete                  |
| Reorder        | Drag and drop                                             |
| Select options | e.g. Heating: Central, AC, Underfloor                     |

**Critical:** never physically delete questions that old answers reference — use `isArchived: true` (or equivalent).

---

## Suggested database tables

| Table              | Key columns (idea)               |
| ------------------ | -------------------------------- |
| `questions`        | id, label, type, category_id     |
| `question_options` | id, question_id, value           |
| `apartments`       | id, title, price                 |
| `answers`          | apartment_id, question_id, value |
| `categories`       | id, name, order                  |

---

## UX details

### Apartment overview

Show completion % and **missing critical** items (e.g. title deeds, common expenses).

### Fast navigation

Sidebar by section (General, Kitchen, Bathroom, Building, Financial, Problems) with per-section progress, e.g. `8/10 answered`.

### Comparison

Normalized answers make a comparison grid straightforward (Solar, Parking, Cracks, Noise, …).

---

## Export strategy

| Format | Notes                                         |
| ------ | --------------------------------------------- |
| JSON   | Full backup                                   |
| Excel  | One row per apartment; columns from questions |
| PDF    | Later — useful with family / realtor          |

---

## Cloudflare deployment (sketch)

| Layer    | Service            |
| -------- | ------------------ |
| Frontend | Cloudflare Pages   |
| API      | Cloudflare Workers |
| Database | Cloudflare D1      |
| Files    | Cloudflare R2      |

**Auth:** start with no auth or simple email; later Google / magic links if needed.

### Suggested API shape

```http
GET    /questions
POST   /questions
PATCH  /questions/:id

GET    /apartments
POST   /apartments
GET    /apartments/:id
POST   /answers

GET    /export/xlsx
```

---

## MVP scope

### Must have

- **Questions:** create / edit / archive, options, categories, ordering
- **Apartments:** create / edit, dynamic completion, notes, critical missing indicators
- **Exports:** JSON, Excel
- **Photos:** optional for MVP but high value

### Future ideas

- **Templates** — e.g. apartment vs house vs new build question sets
- **Scoring** — weighted evaluation
- **Timeline** — Visited → Negotiating → Lawyer review → Rejected / Purchased

---

## Architectural takeaway

Treat questions as a **database-driven schema**, not hardcoded form fields. That single decision unlocks flexible checklists, safe evolution, and comparison/export without constant migrations.
