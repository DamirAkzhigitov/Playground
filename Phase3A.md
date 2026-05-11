# MR Description: Phase 3A - Question Management

## Overview

This MR implements **Phase 3A** of the apartments app plan for `/questions`, delivering:

- Question list grouped by category with type badges
- Create/edit question form using React Hook Form
- Archive/unarchive flow with hidden-by-default archived questions
- Reordering of questions within categories
- Category CRUD controls (create, rename, reorder, delete)
- Inline select/multi-select option management (add/remove/reorder)

It also introduces a small API enhancement to support showing archived questions in the management UI.

## Why this change

Phase 2 had routing and data hooks in place, but `/questions` was still a stub.  
Phase 3A requires a complete authoring workflow so question schema is fully data-driven (categories, questions, and options) and manageable from the app UI.

## File-by-file breakdown

### `apps/apartments/src/pages/QuestionsPage.tsx`

**Why this file changed**

- This page was previously a placeholder showing only a fetched count.
- Phase 3A required this page to become the main management UI.

**How it works**

- Fetches all question groups and categories via query hooks.
- Builds category sections and renders questions grouped by category.
- Adds `Show archived` toggle to switch between active-only and full list.
- Uses React Hook Form for create/edit:
  - core fields: `label`, `type`, `categoryId`, `required`, `order`
  - conditional options editor for `select` and `multi-select`
  - conditional rating fields (`ratingMin`, `ratingMax`) for `rating`
- Supports question reorder with up/down controls by sending reordered indices through `useReorderQuestions`.
- Supports archive/unarchive via `useUpdateQuestion` and `isArchived` mutation payload.
- Adds category controls:
  - create via `useCreateCategory`
  - rename via `useUpdateCategory`
  - reorder up/down by swapping order values
  - delete via `useDeleteCategory` (backend enforces "only if no attached questions")

**Where it is used**

- Route: `/questions`
- Entry point for all question and category administration in the apartments frontend.

---

### `apps/apartments/src/hooks/useQuestions.ts`

**Why this file changed**

- The UI needs to optionally include archived questions.
- Existing hook returned active-only data and a non-grouped type.

**How it works**

- `useQuestions(includeArchived = false)` now accepts a boolean flag.
- Query key includes `{ includeArchived }` to keep cache entries distinct.
- Requests `GET /api/questions?includeArchived=true|false`.
- Response is typed as `QuestionGroup[]` to match grouped API shape.

**Where it is used**

- Used by `QuestionsPage` with `includeArchived=true` so the page can toggle visibility without losing archived records.
- Can still be reused elsewhere with default `false` for active-only lists.

---

### `apps/apartments/src/types/api.ts`

**Why this file changed**

- A dedicated grouped type was needed to model `/api/questions` response accurately.

**How it works**

- Adds:
  - `QuestionGroup = Category & { questions: Question[] }`

**Where it is used**

- Imported by `useQuestions` for strict typing of grouped question payloads.

---

### `apps/apartments/worker/src/index.ts`

**Why this file changed**

- Frontend archive management needs access to archived rows.
- Existing endpoint filtered to `WHERE is_archived = 0` unconditionally.

**How it works**

- `GET /api/questions` now reads query param:
  - `includeArchived=true` -> no archive filter (returns all)
  - default -> keeps active-only behavior
- This preserves existing consumers while enabling admin view requirements.

**Where it is used**

- Consumed by `useQuestions` in the apartments frontend.
- Specifically required by `/questions` archive visibility and unarchive workflows.

---

### `apps/apartments/PLAN.md`

**Why this file changed**

- Tracks delivery progress for the implementation plan.

**How it works**

- Marks Phase 3A items (`3A.1` through `3A.6`) as complete.

**Where it is used**

- Project planning/source-of-truth document for implementation status.

## Behavioral notes

- Archived questions are still hidden by default in UI, matching plan requirements.
- API remains backward-compatible for active-only clients.
- Category delete behavior is safeguarded by backend rule (cannot delete category with attached questions).

## Validation

- `pnpm --filter @playground/apartments type-check` passed
- `pnpm --filter @playground/apartments lint` passed
