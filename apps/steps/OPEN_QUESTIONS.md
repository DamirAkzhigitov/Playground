# Steps — (product & UX)

## Already in `DESIGN.md` — confirm or override

| ID | Question                                                                              | Your answer / decision                                                                                                                         |
|----|---------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Can **visitors** read published actions (list + detail/overview) **without login**?   | yes, they cane even mark as done, but to save progress they need to create or login to account                                                 |
| 2  | Allow **`skipped`** as a step status (alongside `pending` / `done`)?                  | we do not strict users in marking steps, they can mark first and last in any order                                                             |
| 3  | Can contributors **edit a published action** while users have **active enrollments**? | when we version is published, all older version will have a button to migrate to new version, there will be a screen with what going to change |
| 4  | **Tags**: free-text array vs controlled vocabulary (taxonomy)?                        | free-text, with suggestion by existed tags                                                                                                     |

---

## Discovery, auth, and home

| ID | Question                                                                                          | Your answer / decision                        |
|----|---------------------------------------------------------------------------------------------------|-----------------------------------------------|
| 5  | Must users **sign in before search**, or search/browse first and sign in only at **Start guide**? | users can navigate, search, read without auth |
| 6  | Home `/`: **search-only** vs also **browse-all** (no query)?                                      | home contain search, most popular actions     |
| 7  | **`/register`**: separate route (PLAN) vs combined login/register tabs (compare-style)?           | compare app style                             |
| 8  | **Visitor** role: same as **1**, or stricter (marketing only, no catalog)?                        | same                                          |

---

## Action overview (`/actions/:slug`)

| ID | Question                                                                             | Your answer / decision                                                                                  |
|----|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 9  | Before enroll: **step titles only** vs **full preview** (titles + body)?             | Titles only; bodies in runner                                                                           |
| 10 | Show **estimated effort** on overview in MVP?                                        | will be part of MVP, during creating of action there will be an option to add estimated time for a step |
| 11 | **Multiple enrollments** per user per action, or **one active** max?                 | multiple, no limitation                                                                                 |
| 12 | **Start guide** again with in-progress enrollment: **resume** vs **new enrollment**? | resume, option to drop progress                                                                         |

---

## Guide mode on action page (`/actions/:slug` — same route, no `/guide/…`)

| ID | Question                                                                                 | Your answer / decision                             |
|----|------------------------------------------------------------------------------------------|----------------------------------------------------|
| 13 | After **Mark as done**: stay, **auto-advance**, or user taps **Next**?                   | manual next                                        |
| 14 | Is **Skip** a visible action in MVP (if **2** = yes)?                                    | yes                                                |
| 15 | **Requirements checkboxes**: local-only UX, hide until upload, or **persist** on server? | not sure what this question means                  |
| 16 | **Notes**: per-step only, or **enrollment-level** note too?                              | per STEP                                           |
| 17 | **Outline**: Sheet/drawer vs inline list vs bottom sheet (mobile)?                       | Sheet (compare pattern)                            |
| 18 | **Jump to any step** before marking prior steps done?                                    | Yes                                                |
| 19 | **% complete**: count **`done` only**, or **`done` + `skipped`**?                        | Done only                                          |
| 20 | Guide **“completed”** on `/my`: all `done`, or allow some `skipped`?                     | User can mark as done without completing all steps |

---

## My guides (`/my`)

| ID | Question                                                              | Your answer / decision  |
|----|-----------------------------------------------------------------------|-------------------------|
| 21 | Sort **in-progress** by: **last updated**, **started**, or **title**? | started                 |
| 22 | **Completed** on same page (sections) vs separate tab/route?          | same page, separate tab |
| 23 | **Delete / abandon** in-progress enrollment in MVP?                   | Yes, with confirm       |

---

## Contributor editor

| ID | Question                                                                                     | Your answer / decision                                                            |
|----|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| 24 | **Delete step** on published action with enrollments: block, warn, or allow orphan progress? | new version created, currently used not affected until not migrated (user action) |
| 25 | **Reorder** published steps while users are mid-guide: allowed in MVP?                       | same as for delete                                                                |
| 26 | **Preview mode**: separate route/tab vs toggle in editor?                                    | toggle in editor                                                                  |
| 27 | **Publish** validation beyond minimal (≥1 step, title, unique slug)?                         | minimal                                                                           |
| 28 | **Requirement `kind`** (`document` \| `task` \| `link`) in UI from day one?                  | out of scope MVP                                                                  |
| 29 | **Slug**: auto from title (editable) vs manual only?                                         | auto from title                                                                   |
| 30 | **Contributor** role in MVP: admin assigns, self-serve on register, or seed only?            | Admin/seed only                                                                     |

---

## Content, locale, and trust

| ID | Question                                                            | Your answer / decision              |
|----|---------------------------------------------------------------------|-------------------------------------|
| 31 | **Locale** on actions: enforce **`en` only** in MVP, or hide field? | MVP en only,  we can later add more |
| 32 | **Markdown** allowed: links, images, headings, tables?              | markdown editor / preview           |
| 33 | **Contributor attribution** on public pages?                        | author nickname                     |
| 34 | **Draft** actions visible to non-contributors?                      |                                     |

---

## Visual system and polish (MVP)

| ID | Question                                                             | Your answer / decision               |
|----|----------------------------------------------------------------------|--------------------------------------|
| 35 | **Visual identity**: full compare tokens vs steps-specific branding? | steps-specific branding              |
| 36 | **SEO** (meta title/description) in MVP deploy or defer?             | Basic meta in MVP                    |
| 37 | **Empty states**: minimal vs friendly + example searches?            | Friendly + examples                  |
| 38 | **Autosave errors**: toast only vs toast + inline banner?            | Toast + inline on persistent failure |

---

## Cross-cutting (schema / API UX)

| ID | Question                                                                     | Suggested default      | Your answer / decision |
|----|------------------------------------------------------------------------------|------------------------|------------------------|
| 39 | **Search** MVP: title/summary only, or include **tags** and **step titles**? | Title + summary + tags | Title + summary        |
| 40 | **Action versioning**: no snapshot on enroll (MVP) vs snapshot at enroll?    | No snapshot MVP        | snapshot at enroll     |

---
