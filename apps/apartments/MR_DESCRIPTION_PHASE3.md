# Merge Request Description — Phase 3 (Core MVP)

**Scope:** Completes **Phase 3** from `PLAN.md`: apartment management (3B), inspection flow (3C), and apartment detail (3D), plus API and client plumbing to support completion/critical stats and debounced answer persistence.

**Stack context:** React 19 + TanStack Query + React Hook Form + Zod + shadcn/ui + Hono worker on D1.

---

## Summary (what & why)

| Area               | What                                                                                               | Why                                                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Worker**         | Reworked `GET /api/apartments` completion metrics                                                  | List cards need accurate **completion %** and **critical missing count**; old `COUNT(DISTINCT answer rows)` treated empty values as “answered” and did not surface required gaps.             |
| **Types / hooks**  | Extended `Apartment.completion`, fixed `useUpsertAnswer` invalidation + response typing            | UI and list stats stay in sync after saves; mutation response matches API (`{ ok, updated }`).                                                                                                |
| **New libs**       | `answerValue`, `apartmentStatus`, `questions`, `apartmentForm`                                     | Single place for “is this answer filled?”, status derivation, flattened question lists, and shared apartment form schema—avoids duplication between inspection, detail, and worker semantics. |
| **New UI**         | `AnswerField`, `ApartmentForm`, `ApartmentStatusBadge`                                             | Reusable inputs per question type and consistent badges/forms per `DESIGN.md`.                                                                                                                |
| **Debounced save** | `useDebouncedAnswerSave` + `useKeyedDebouncedAnswerSave`                                           | Phase 3C/3D require autosave without hammering D1; keyed variant supports many rows on the detail page.                                                                                       |
| **Pages**          | `ApartmentsPage`, `NewApartmentPage`, `EditApartmentPage`, `InspectionPage`, `ApartmentDetailPage` | Implements PLAN 3B–3D behaviors end-to-end.                                                                                                                                                   |
| **Router**         | `apartments/:id/edit`                                                                              | Edit flow needs a dedicated route before the generic `:id` route.                                                                                                                             |
| **Tests**          | `answerValue.test.ts`                                                                              | Locks in fill/empty rules for text, boolean, multi-select.                                                                                                                                    |
| **PLAN**           | Checkboxes + execution bar                                                                         | Marks Phase 3 exit criteria as done.                                                                                                                                                          |

---

## File-by-file

### `apps/apartments/worker/src/index.ts`

**What:** Replaced the `GET /api/apartments` SQL that joined all answers and used `COUNT(DISTINCT ans.question_id)` with a row-per-apartment query using **scalar subqueries**.

**How:**

- **`total_questions`:** `(SELECT COUNT(*) FROM questions q WHERE q.is_archived = 0)` (unchanged intent, now a subquery).
- **`answered_questions`:** Counts active questions that have an answer row whose `value` is **non-null**, **non-blank after `TRIM`**, and **not** exactly `'[]'` (empty JSON array for multi-select).
- **`critical_missing`:** Counts active **required** questions where there is **no** answer row, or the value is null/blank/`[]`.

**Why:** Aligns server metrics with product meaning: “answered” means the user supplied a meaningful value; “critical missing” drives the **Missing critical** badge and list UX without N+1 queries per apartment.

---

### `apps/apartments/src/types/api.ts`

**What:** Extended `Apartment['completion']` with **`criticalMissingCount: number`**.

**Why:** The apartments list API now returns this field; TypeScript consumers (`ApartmentsPage`, badges) need a typed contract.

**How:** Optional `completion` object (still optional for create responses) now includes the new numeric field alongside existing `answeredQuestions`, `totalQuestions`, `percent`.

---

### `apps/apartments/src/hooks/useAnswers.ts`

**What:**

- Mutation return type updated from fictional `Answer | Answer[]` to **`{ ok: boolean; updated: number }`** (matches worker `POST /api/answers`).
- **`onSuccess`** now invalidates **`queryKeys.apartments`** and **`queryKeys.apartment(id)`** for every apartment id present in the payload (single `answer` or bulk `answers`).

**Why:** After inspection or detail inline edits, the **detail** and **list** views must refetch so completion and answers stay correct.

**How:** Small helper `apartmentIdsFromPayload` dedupes ids; `Promise.all` runs invalidations in parallel.

---

### `apps/apartments/src/hooks/useDebouncedAnswerSave.ts` _(new)_

**What:** Two hooks:

1. **`useDebouncedAnswerSave`** — one pending upsert; debounce timer; **`flushSave()`** for navigation boundaries.
2. **`useKeyedDebouncedAnswerSave`** — one timer **per `questionId`**; **`flushSave()`** flushes all pending timers and sends all queued payloads.

**Why:** 3C needs debounced autosave for a single active question; 3D has many questions visible at once, so isolating debounce per question avoids one field overwriting another’s pending save.

**How:**

- Uses `window.setTimeout` / `window.clearTimeout` with **`TimerId` typed as `number`** and `as TimerId` casts to avoid **`number` vs `NodeJS.Timeout`** conflicts under `@types/node`.
- Cleanup on unmount for keyed hook snapshots `timersRef` for ESLint `react-hooks/exhaustive-deps` satisfaction.

---

### `apps/apartments/src/hooks/index.ts`

**What:** Added `export * from './useDebouncedAnswerSave'`.

**Why:** Keeps the existing barrel import pattern (`@/hooks`) available for pages without deep imports.

---

### `apps/apartments/src/lib/answerValue.ts` _(new)_

**What:** Pure helpers:

- **`isAnswerValueFilled(type, value)`** — empty for null/undefined/trim-empty/`[]`; for `multi-select`, parses JSON and requires a non-empty array.
- **`isQuestionAnswerFilled(question, value)`** — thin wrapper using `question.type`.
- **`parseMultiSelect` / `stringifyMultiSelect`** — JSON array string round-trip for UI.

**Why:** Worker list stats and UI badges must share the same definition of “filled” as the inspection/detail inputs.

**How:** No React imports; easy to unit test and import from any layer.

---

### `apps/apartments/src/lib/apartmentStatus.ts` _(new)_

**What:**

- **`deriveApartmentStatus(completion)`** → `'missing-critical' | 'completed' | 'needs-review'` using: critical count first, then 100% percent, else needs review.
- **`computeCompletionFromQuestions(questions, answers)`** — builds `{ answeredQuestions, totalQuestions, percent, criticalMissingCount }` from in-memory question metadata + answer values using **`isAnswerValueFilled`**.

**Why:** `ApartmentStatusBadge` and the detail **overview** need the same rules as the list when `completion` is not precomputed on the server (detail aggregates from questions + answers).

---

### `apps/apartments/src/lib/questions.ts` _(new)_

**What:**

- **`AnswerDraft`** type `{ value, note }`.
- **`buildAnswerDraftMap(groups, answerRows)`** — seeds every **non-archived** question with `{ null, null }`, then overlays existing DB answers.
- **`flattenActiveQuestions(groups)`** — ordered flat list: each category’s active questions sorted by `order`.
- **`questionIndexInFlatList` / `firstQuestionIndexForCategory`** — navigation helpers for inspection/summary/drawer.

**Why:** Inspection and detail both need a canonical ordering and a stable draft map shape; avoids duplicating flatten/seed logic across pages.

---

### `apps/apartments/src/lib/apartmentForm.ts` _(new)_

**What:**

- Zod **`apartmentFormSchema`** and exported **`ApartmentFormValues`**.
- **`parsePriceField`** — empty string → `null`; else `Number` with finite check.
- **`apartmentFormDefaults`** — maps API apartment fields into form default strings (price as string for controlled input).

**Why:** Moved out of `ApartmentForm.tsx` to satisfy **`react-refresh/only-export-components`** (form file exports only the form component) and to share types/defaults between **New** and **Edit** pages.

---

### `apps/apartments/src/lib/answerValue.test.ts` _(new)_

**What:** Vitest coverage for `isAnswerValueFilled` / `isQuestionAnswerFilled` (empty cases, boolean strings, multi-select JSON, invalid JSON).

**Why:** Prevents regressions in the definition of “filled,” which drives %, critical counts, and summary lists.

---

### `apps/apartments/src/components/AnswerField.tsx` _(new)_

**What:** Controlled field renderer for all **`QuestionType`** values:

- `text` — `Textarea`; `number` — native number input with **±** buttons (early return layout includes note block).
- `boolean` — large **Yes / No / Skip** (`Skip` → `null`).
- `select` — vertical **button list** (selected = `default` variant) as radiogroup semantics.
- `multi-select` — **Checkbox** list; stores JSON string via `stringifyMultiSelect`.
- `rating` — inclusive integer buttons from **`ratingMin`–`ratingMax`** (defaults 1–5).
- **Extra note** — collapsible header + `Textarea`; **`density`** `comfortable` vs `compact` for inspection vs detail.

**Why:** One implementation for 3C and 3D inline editing; keeps tap targets and shadcn primitives per `DESIGN.md`.

**How:** `useId` for accessible ids; `Label` sr-only for text; semantic `role="group"` / `role="radiogroup"` where appropriate.

---

### `apps/apartments/src/components/ApartmentForm.tsx` _(new)_

**What:** **`ApartmentForm`** — RHF + `zodResolver(apartmentFormSchema)`; fields title, address, price (string), notes; submit maps to API payload (trimmed strings, nullable price via `parsePriceField`).

**Why:** PLAN 3B.2 create/edit; sticky submit pattern avoided in favor of simple full-width submit on small screens per doc.

---

### `apps/apartments/src/components/ApartmentStatusBadge.tsx` _(new)_

**What:** Maps **`deriveApartmentStatus`** to shadcn **`Badge`** variants: destructive (missing critical), secondary (completed), outline (needs review).

**Why:** Consistent status labeling on list cards and detail header.

---

### `apps/apartments/src/pages/ApartmentsPage.tsx`

**What:**

- Local **`query`** state + **`useMemo`** filter on title/address (case-insensitive).
- Each card: **`ApartmentStatusBadge`**, completion **%** badge, optional **critical missing** line, price, link to detail.
- **New apartment** link uses **`aria-label`** + visible text on `sm+` for a11y.

**Why:** Implements 3B.1, 3B.3, 3B.4 and surfaces new API **`criticalMissingCount`**.

---

### `apps/apartments/src/pages/NewApartmentPage.tsx`

**What:** Replaced stub with **`ApartmentForm`** + **`useCreateApartment`**; success **toast** + navigate to **`/apartments/:id`**; empty defaults from **`ApartmentFormValues`**.

**Why:** PLAN 3B.2 create path.

---

### `apps/apartments/src/pages/EditApartmentPage.tsx` _(new)_

**What:** Loads **`useApartment(id)`**, builds defaults via **`apartmentFormDefaults`**, submits with **`useUpdateApartment`**, toast + navigate back to detail.

**Why:** PLAN 3B.2 edit path without overloading the detail page with a large embedded editor.

---

### `apps/apartments/src/pages/InspectionPage.tsx`

**What:**

- Loads **`useApartment`** + **`useQuestions(false)`**; **`flattenActiveQuestions`** for the walkthrough list.
- **State:** `phase` (`question` | `summary`), `index`, `answers` draft map, **`noteExpanded`**, drawer open flag; **`seededRef`** to hydrate drafts once from server answers.
- **Autosave:** **`useDebouncedAnswerSave(upsert.mutateAsync)`**; **`updateDraft`** merges patch and queues upsert; **`goNext` / `goPrev`** call **`flushSave`** before navigation; **`setNoteExpanded(false)`** on navigation and section jump.
- **UI:** progress badge, required badge, **`AnswerField`**, bottom **sheet** “Sections” with per-category **answered/total**, **Next/Previous/Finish**, **summary** with missing required links that jump back to a question index.
- **Persistence UX:** **`sessionStorage`** keys for saved **phase** and **index** (restored in **`useLayoutEffect`** with eslint block for `set-state-in-effect`—session restore is inherently effect-driven).
- **Empty state** when no active questions.

**Why:** Implements all of 3C.1–3C.7 including debounced autosave and summary “go back to fix.”

**How:** `EMPTY_GROUPS` constant avoids unstable `[]` in `useMemo` dependency warnings.

---

### `apps/apartments/src/pages/ApartmentDetailPage.tsx`

**What:**

- **`useApartment`** + **`useQuestions(false)`**; **`useKeyedDebouncedAnswerSave`** for per-question debounced upserts.
- **Overview card:** **`computeCompletionFromQuestions`**, missing required bullet list, **`ApartmentStatusBadge`**, **Start / resume** vs **Review inspection** copy from **`deriveApartmentStatus`**, links to inspect and list.
- **Per-category cards:** each active question rendered with compact **`AnswerField`** and per-row **`noteExpanded`** map.
- **Effects:** sync `answers` from server when query data changes (eslint-disable-next-line for intentional **`set-state-in-effect`**); **`flushSave` on unmount** to not lose pending debounced writes.
- **Header:** optional **€ price** concatenated into description when present; **Edit** pencil link to **`/apartments/:id/edit`**.

**Why:** Implements 3D.1–3D.3 with inline editing and consistent stats.

**How:** `EMPTY_GROUPS` same pattern as inspection.

---

### `apps/apartments/src/router.tsx`

**What:** Registered **`apartments/:id/edit`** → **`EditApartmentPage`** **before** **`apartments/:id`** so `edit` is not captured as an `:id`.

**Why:** React Router specificity; avoids treating `"edit"` as a UUID segment.

---

### `apps/apartments/PLAN.md`

**What:** Marked **3B.1–3B.4**, **3C.1–3C.7**, **3D.1–3D.3** as `[x]`; updated execution summary line for Phase 3 to “done.”

**Why:** PLAN is the checklist of record for the apartments app.

---

## Testing & quality gates run (during development)

- `pnpm --filter @playground/apartments type-check`
- `pnpm --filter @playground/apartments lint`
- `pnpm --filter @playground/apartments test`
- `pnpm turbo run build --filter=@playground/apartments`

---

## Notes for reviewers

1. **“Filled” definition** is shared conceptually between worker list SQL and `answerValue.ts`; if we add new question types, update **both**.
2. **Timer typing** in debounce hooks intentionally uses `number` + cast to stay compatible with DOM + Node typings.
3. **ESLint `react-hooks/set-state-in-effect`:** intentionally suppressed where session restore or query-driven draft reset is the clearest pattern (see inline comments in `InspectionPage` / `ApartmentDetailPage`).
4. **R2 / photos** are out of scope for Phase 3 (Phase 4).

---

## Suggested MR title

**feat(apartments): complete Phase 3 — apartments CRUD, inspection flow, detail inline answers**

## Suggested labels / areas

`feature`, `apartments`, `frontend`, `worker`, `phase-3`
