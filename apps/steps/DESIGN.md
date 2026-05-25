# Steps — Design & UX

Living document for UI conventions. **Phase 0** uses minimal custom CSS; when
building UI (Phase 2+), align with `apps/compare/DESIGN.md` (Tailwind 4,
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

| Route | Screen | Primary actions |
| ----- | ------ | ----------------- |
| `/` | Home + search | Search actions, sign in |
| `/actions/:slug` | Action overview | Read summary, see outline, Start guide |
| `/guide/:enrollmentId` | Step runner | Read body, requirements, note, Done, Next |
| `/my` | My guides | Continue, view completed |
| `/login` | Auth | Email/password |
| `/contributor` | Contributor hub | List drafts / published |
| `/contributor/actions/:id/edit` | Editor | Steps CRUD, requirements, publish |

---

## Step runner (wireframe)

```text
┌─────────────────────────────────────┐
│ Apartment purchase with loan        │
│ Step 3 of 12 · ████░░░░░░ 25%       │
├─────────────────────────────────────┤
│ Get mortgage pre-approval             │
│                                     │
│ [Markdown explanation body…]        │
│                                     │
│ Requirements                        │
│ ○ Bank statements (last 3 months)   │
│ ○ Employment letter                 │
│                                     │
│ Your notes                          │
│ ┌─────────────────────────────────┐ │
│ │ Called bank, appointment Tue    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ Mark as done ]    [ Next → ]      │
└─────────────────────────────────────┘
```

- **Outline drawer** (mobile): jump to any step; show done/pending icons.
- **Previous** always available except on step 1.

---

## Action overview

- Title, summary, estimated effort (optional later), tags.
- Numbered step list (titles only); locked until user starts (or show full preview — product choice: **MVP shows titles**, bodies in runner only).
- Sticky **Start guide** / **Continue** if enrollment exists.

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
- `MarkdownBody` — sanitized render

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

| # | Question | Default for MVP |
| - | -------- | ----------------- |
| 1 | Can visitors read published actions without login? | Yes for overview; enroll requires login |
| 2 | Allow `skipped` on steps? | Yes, stored in `step_progress.status` |
| 3 | Edit published action with active enrollments? | Allow edit; no auto-migration of progress |
| 4 | Tags: free text vs controlled vocabulary? | Free-text tags JSON array |

Record decisions in this file as they are resolved.
