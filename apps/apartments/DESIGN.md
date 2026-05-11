# Apartments App — Design System

This is the source of truth for UI decisions in `apps/apartments`. Every
new screen, component, or refactor must follow this doc. If you're about
to invent a primitive, stop and check whether shadcn ships one.

`PLAN.md` covers _what_ we're building. `DESIGN.md` covers _how_ it
looks and behaves.

---

## Principles

1. **Mobile-first.** Every screen is designed at 360 px width first.
   Desktop is progressive enhancement, never the starting point. The
   primary user is on a phone walking through an apartment with one
   thumb free.
2. **One-thumb operation.** Tap targets ≥ 44 × 44 px. Primary actions
   reachable in the lower half of the screen. No hover-only affordances.
3. **Server state via TanStack Query, UI state local.** No Zustand,
   no Redux, no localStorage sync. `useState` / context for ephemeral
   UI state only.
4. **Never invent a primitive.** If shadcn/ui ships it, use it. If it
   doesn't, compose from Radix primitives before reaching for a new dep.
5. **Tokens over literals.** Colors come from semantic CSS variables
   (`bg-primary`, `text-muted-foreground`, `border-border`). Raw Tailwind
   palette utilities (`bg-blue-600`, `text-gray-700`) are banned in app
   code. The only exception is inside `src/components/ui/*` files (the
   shadcn vendor layer).
6. **Accessibility is non-negotiable.** Keyboard reachable, screen reader
   labeled, motion-reduced friendly. Don't ship a control you can't
   operate with `Tab` + `Enter`.

---

## Visual language (product reference)

The mood board at `apps/apartments/img.png` is the **visual north star** for
this app: soft UI, high corner radius, generous padding, and a **royal
indigo** brand family. Implementation still uses **semantic tokens** in
code (`bg-primary`, `text-muted-foreground`, etc.); tune `src/index.css`
until those variables match the reference. Do not sprinkle raw hex in
app components.

### Color

| Role                                                          | Reference (hex)              | Semantic token (use in JSX)                                                                            | Notes                                                                                  |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Brand / primary actions, key numbers (e.g. price), active nav | `#5D5FEF`                    | `primary` / `text-primary` / `bg-primary`                                                              | Vibrant royal blue–violet; primary buttons use **white** label (`primary-foreground`). |
| Accent / category or type tags (“House”, highlights)          | `#FF725E`                    | Map to `destructive` **or** a dedicated tag token once added to `index.css` — never hard-code in pages | Soft coral; use sparingly so it stays a signal, not wallpaper.                         |
| Dark surfaces (cards, chrome in dark comps)                   | `#242845`                    | `card` / `background` in `.dark`                                                                       | Deep blue-gray, not pure black.                                                        |
| Light canvas                                                  | Off-white behind white cards | `background`                                                                                           | Slight separation between page and `bg-card` panels.                                   |
| Range sliders, secondary interactive emphasis                 | Teal / cyan in ref           | `ring` / chart or a future `--slider-*` if we add sliders                                              | Keep slider thumbs and track clearly contrasted.                                       |
| Secondary text, icons, borders                                | Muted grays in ref           | `muted-foreground`, `border`, `input`                                                                  | Thin-line icons stay legible at small sizes.                                           |

Charts and trends (green / red deltas) can use existing `chart-*` tokens;
align saturation with the reference so dashboards feel consistent with
marketing cards.

### Typography

- **Family:** A clean geometric sans (e.g. **Inter** or **Poppins**). The
  app should load one primary UI family and use it everywhere; avoid
  mixing multiple display faces.
- **Hierarchy:** Bold for titles and names; **semibold** for prices when
  you need emphasis inside a card; regular for addresses, meta, and counts
  (beds / baths). Small caps or tracked labels only for true metadata
  lines — default to sentence case for product copy.
- **Price:** Prefer `text-primary` (or `font-semibold text-primary`) so
  money reads as part of the brand, not generic body text.

### Radius, elevation, and motion

- **Small controls** (buttons, inputs, chips): about **12px** effective
  radius — maps to `rounded-xl` / theme `--radius` once aligned.
- **Cards and sheets:** **16–24px** outer radius; hero property cards can
  go **larger on top corners** (e.g. image radius **24–32px**) to match
  the soft “poster” look in the reference.
- **Shadows:** Soft, diffuse elevation on floating bars and cards
  (`shadow-md` / custom token), not harsh offsets. Cards on `background`
  should lift slightly from the canvas.
- **Motion:** Short, ease-out transitions on press/hover; respect reduced
  motion per _Accessibility_.

### Spacing and padding

- **Page horizontal padding:** Keep `px-4` mobile / `sm:px-6` as in
  _Layout grid_; the reference reads “airy” because **inner** card and
  bar padding are generous too.
- **Cards:** Target **~20px** (`p-5`) internal padding for dense list
  cards; hero cards can use **20–24px** under the image for title + meta
  row.
- **Primary buttons:** About **12px vertical × 24px horizontal** minimum
  feel (shadcn `min-h-11` + horizontal padding already approximates this;
  do not shrink below 44px tap height on mobile).
- **Between sections:** `space-y-4` minimum; use `space-y-6` when the
  screen is mostly cards with images.

### Navigation shell (bottom)

The reference uses a **floating** bottom bar: rounded container, inset
from the screen edges, with a **raised center action** (circular brand
button, e.g. grid / hub icon) and four flanking destinations (e.g. home,
saved, messages, settings).

- **Structure:** Up to **five slots** — four `NavLink` items plus one
  **center FAB** when we need a global “create / hub” action. Until that
  exists, a flat four-tab bar is fine; **do not** add a fifth tab without
  design review.
- **Light bar:** `bg-card` or `bg-background` with **full rounding** on the
  bar (`rounded-2xl` or `rounded-3xl`), horizontal margin from viewport
  (`mx-3`–`mx-4`), **lifted** with shadow; optional subtle `border`.
- **Dark variant:** Same layout with `#242845`-aligned tokens — active
  item still reads clearly (icon + label in `primary` or high-contrast
  `foreground`).
- **Active state:** Brand color on icon + label; inactive uses
  `text-muted-foreground`.
- **Safe area:** Continue `env(safe-area-inset-bottom)` on the **nav
  container** so the floating bar clears the home indicator.

`PinnedActionBar` stays **above** this nav; when the bar is floating,
leave enough `pb-*` on `main` so the last card clears both the CTA strip
and the tab island (tune `calc(...)` in page shells as heights change).

### Search and filters

- **Search field:** **Pill** shape — `rounded-full` on the input shell,
  leading search icon (`text-muted-foreground`), placeholder in muted
  tone. Full width minus page padding on mobile.
- **Filter / icon actions:** Compact **square-ish** brand-tinted control
  next to the field is acceptable; keep **≤ 3** inline actions per row on
  mobile (see _Breakpoints & touch targets_).

### Property and list cards

- **Hero layout:** Large image on top (object-cover), rounded top corners
  aligned with card radius; below: title, **price** (`text-primary`), row
  with map pin + address, then icon row for beds / baths / kitchen (or
  equivalent meta) using `lucide-react` at consistent sizes.
- **Compact rows:** Thumbnail + title + price + condensed stats; same
  token rules as hero.
- **Dark cards:** Same information hierarchy with inverted surfaces; no
  washed-out gray body text — keep contrast AA.

### Tags and badges

- Small **rounded-rectangle** badges for type (“House”) using the accent
  role; text short and legible. Prefer shadcn `Badge` with a variant wired
  to tokens, not inline styles.

---

## Tech baseline

| Layer            | Choice                                        |
| ---------------- | --------------------------------------------- |
| Framework        | React 19                                      |
| Bundler          | Vite 8                                        |
| Styling          | Tailwind 4 (`@tailwindcss/vite`)              |
| Component system | [shadcn/ui](https://ui.shadcn.com) `new-york` |
| Primitives       | Radix UI (via the unified `radix-ui` package) |
| Icons            | `lucide-react`                                |
| Toasts           | `sonner`                                      |
| Mobile drawers   | `vaul` (via shadcn `Drawer`)                  |
| Forms            | `react-hook-form` + shadcn `<Form>` + `zod` 4 |
| Animations       | `tw-animate-css`                              |
| Server state     | `@tanstack/react-query`                       |
| Routing          | `react-router` 7                              |

shadcn components live at `src/components/ui/`. They are owned source —
edit them like any other file, don't treat them as `node_modules`.

---

## Layout grid

| Width      | Container                   | Notes                                 |
| ---------- | --------------------------- | ------------------------------------- |
| `< 640px`  | full-width, `px-4`          | single column, bottom tab bar         |
| `≥ 640px`  | `max-w-3xl mx-auto`, `px-4` | still single column                   |
| `≥ 768px`  | `max-w-3xl mx-auto`, `px-6` | room for inline form layouts          |
| `≥ 1024px` | `max-w-3xl mx-auto`, `px-6` | bottom tabs become side rail (future) |

- Bottom-tab nav (`AppLayout`) is the mobile primary navigation. Target
  the **floating island** pattern from _Visual language_ (rounded bar,
  side margins, soft shadow); full-bleed `border-t` is acceptable as an
  interim implementation until the shell is refactored.
- It stays visible at all widths until we promote it to a side rail
  (deferred).
- Pages add their own `space-y-{4|6}` rhythm between sections.
- Use `pb-[env(safe-area-inset-bottom)]` on the bottom nav so iOS
  home-indicator does not overlap.

---

## Pinned CTA bar (primary actions)

**All primary screen actions** (create, save, continue, submit, next step,
destructive confirm after `AlertDialog`, etc.) use the same **bottom-pinned**
pattern so the thumb zone matches inspection navigation.

1. **Shell.** Render actions inside `PinnedActionBar`
   (`src/components/layout/PinnedActionBar.tsx`). It is `fixed`,
   full-bleed, sits **above** the bottom tab bar (`bottom: calc(3.5rem +
env(safe-area-inset-bottom))`), `z-30`, `border-t`, blurred
   `bg-background/95`, horizontal padding `px-4 sm:px-6`, inner row
   `max-w-3xl mx-auto flex gap-2` (aligned with `AppLayout` `main`).

2. **Do not** park primary CTAs in `PageHeader` `actions` on mobile-first
   flows — that pushes targets into the top third. Secondary chrome
   (badges, edit, overflow menus) may stay in the header.

3. **Buttons** (shadcn `Button`):
   - **Secondary / back / cancel (left):** `variant="outline"` +
     `className="min-h-11 flex-1"`.
   - **Primary (right):** default variant +
     `className="min-h-11 inline-flex flex-1 items-center justify-center gap-1"`.
     Pair leading/trailing icons with `size-4 shrink-0` and keep labels
     visible (no `hidden sm:inline` on the only primary CTA).

4. **Single primary CTA** (e.g. “New apartment” on the list): one
   `Button` with the **primary** classes above and `flex-1` so it spans
   the row like “Next”. No dummy outline button for symmetry.

5. **Scroll clearance.** The page `<section>` (or scrollable column) that
   sits above the bar needs bottom padding so the last card is not
   hidden behind it, e.g.
   `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` (tune if the bar
   height changes).

Reference implementations: `ApartmentsPage`, `ApartmentDetailPage`
(inspect + list), `InspectionPage` (Previous / Next).

---

## Breakpoints & touch targets

- Tailwind defaults: `sm 640 / md 768 / lg 1024 / xl 1280`.
- **Minimum tap target: 44 × 44 px.** That maps to shadcn:
  - `Button` default size = `h-9` → text + horizontal padding gets us
    there. For icon-only buttons, use `size="icon"` (`size-9 = 36px`)
    **only** in dense desktop contexts. On mobile use `size="icon-lg"`
    (`size-10 = 40px`) inside a `min-h-11` wrapper, or wrap with
    `className="size-11"`.
- **Never put more than 3 inline actions on a mobile row.** The fourth
  collapses into a `DropdownMenu` (`MoreVertical` trigger). Dense filter
  rows (search + multiple icon buttons) quickly make the field unusable
  at 360px width.
- Forms stack labels above inputs on mobile, side-by-side only `≥ sm`.

---

## Component map

The canonical question is: "What shadcn primitive is this?"

| Need                                  | Use                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Page section / list row               | `Card` (`CardHeader` / `CardContent` / `CardFooter`)                    |
| Primary action                        | `Button` default — **pinned:** see _Pinned CTA bar_ + `PinnedActionBar` |
| Secondary action                      | `Button variant="outline"` — same bar when paired with primary          |
| Destructive action                    | `Button variant="destructive"` + `AlertDialog` confirmation             |
| Tertiary / dense action               | `Button variant="ghost"`                                                |
| Icon-only button                      | `Button variant="ghost" size="icon-lg"` + `<span className="sr-only">`  |
| Single-line text input                | `Input`                                                                 |
| Multi-line text input                 | `Textarea`                                                              |
| Field label                           | `Label` (auto-wired inside `<FormField>`)                               |
| Single choice (≤ 5 options)           | radio group via `Tabs` or shadcn radio (add when needed)                |
| Single choice (> 5 options)           | `Select`                                                                |
| Multi-choice                          | `Checkbox` stack                                                        |
| On/off toggle                         | `Switch`                                                                |
| Tag / type marker                     | `Badge`                                                                 |
| Section divider                       | `Separator`                                                             |
| Mobile-edge sliding panel             | `Sheet side="bottom"` on mobile, `Dialog` on `md+`                      |
| Native-feeling bottom sheet           | `Drawer` (vaul) — use when momentum scroll matters                      |
| Modal confirmation                    | `AlertDialog`                                                           |
| Overflow / collapsed actions          | `DropdownMenu`                                                          |
| Tab navigation within a page          | `Tabs`                                                                  |
| Scrollable list with custom scrollbar | `ScrollArea`                                                            |
| Loading placeholder                   | `Skeleton`                                                              |
| Success / error feedback after action | `sonner` toast                                                          |

If something isn't on this list and you can't compose it from these,
flag it in the PR rather than rolling your own.

---

## Forms

Always:

1. `useForm` from `react-hook-form` with a `zod` resolver.
2. Wrap in shadcn `<Form>` and render fields through `<FormField>` /
   `<FormItem>` / `<FormLabel>` / `<FormControl>` / `<FormMessage>`.
3. Inputs are full-width on mobile (`w-full`, never fixed widths).
4. Labels render above the input. Side-by-side rows are `sm:` and up.
5. Submit button stays in a sticky footer on mobile (`Sheet`/`Drawer`
   footer) or in `PinnedActionBar` on full-page flows (_Pinned CTA bar_);
   never only above the fold, out of easy thumb reach.
6. Validation runs on `onBlur` for text fields, `onChange` for toggles
   and selects.

A typical field:

```tsx
<FormField
  control={form.control}
  name="label"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Question label</FormLabel>
      <FormControl>
        <Input placeholder="Apartment title" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Theming

- Light + dark mode are both shipped via CSS variables in
  `src/index.css`. The toggle UI lands in Phase 7 (`PLAN.md` 7.4); the
  tokens are already in place.
- **Brand alignment:** `:root` and `.dark` should be adjusted so computed
  `primary` matches the **#5D5FEF** family in light mode (with accessible
  `primary-foreground`), and dark surfaces lean toward **#242845** for
  cards/backgrounds per _Visual language_. Prefer **oklch()** in CSS for
  smoother ramps; the hex table there is the design contract.
- **Radius:** Consider raising `--radius` toward **~0.75rem–1rem** so
  defaults match the soft UI reference; large cards can still use
  explicit `rounded-2xl` / `rounded-3xl` where needed.
- Use **semantic tokens**, never raw colors:
  - Surfaces: `bg-background` / `bg-card` / `bg-popover` / `bg-muted`.
  - Text: `text-foreground` / `text-muted-foreground` / `text-primary`.
  - Borders: `border-border` / `border-input`.
  - States: `bg-destructive` for danger, `bg-accent` for emphasis.
- If you find yourself reaching for `gray-*` or `blue-*`, you're holding
  it wrong — open this doc and find the token.

---

## Accessibility

- Every interactive element has a visible label or an `aria-label`.
- Icon-only buttons always include `<span className="sr-only">` text
  describing the action.
- All state-changing operations are reachable by keyboard. Don't use
  `onClick` on a `div`.
- Trap focus inside `Dialog` / `Sheet` / `Drawer` (Radix does this for
  you — don't fight it).
- Respect `prefers-reduced-motion`: `tw-animate-css` handles this; don't
  introduce custom animations that ignore it.
- Color is never the only signal for state. Pair red with an icon or
  text, not just `text-destructive`.

---

## Anti-patterns (PR blockers)

- Raw Tailwind palette colors in app code (`bg-blue-600`, `text-gray-700`).
- Fixed pixel widths on inputs / containers (use `w-full`, `max-w-*`).
- More than 3 inline action buttons on a row at mobile width.
- Hand-rolled modal / dropdown / select / form components when a shadcn
  one exists.
- `onClick` on non-interactive elements.
- Toasts implemented with custom state instead of `sonner`.
- Importing from `@radix-ui/react-*` directly — use shadcn wrappers from
  `@/components/ui/*`.
- Editing `src/components/ui/*` to add app-specific business logic.
  Those files are styled primitives; build composition in
  `src/components/` instead.

---

## Adding a new screen — checklist

1. **Design at 360 px** in the browser before writing JSX. Check contrast
   and spacing against _Visual language_ and `apps/apartments/img.png`.
2. **Pick the layout** — use `space-y-*` between sections, `Card` for
   anything that's a list row or self-contained block.
3. **Wire data** with the existing TanStack Query hooks from
   `src/hooks/`. UI state stays in `useState`.
4. **Primary CTAs** — `PinnedActionBar` + button classes from _Pinned CTA
   bar_; add bottom padding on the page so content clears the bar when
   scrolling.
5. **Compose only from `@/components/ui/*`** and `lucide-react`. If you
   need a new shadcn component, add it with
   `pnpm dlx shadcn@latest add <name>` and commit the generated file.
6. **Forms** — `react-hook-form` + `zod` + shadcn `<Form>`. Always.
7. **Feedback** — every mutation emits a `sonner` toast on success and
   on error. Destructive mutations go through `AlertDialog` first.
8. **Verify keyboard + screen reader** — `Tab` through the whole screen
   with VoiceOver / NVDA, confirm every control speaks its purpose.
9. **Verify breakpoints** — 360 / 414 / 768 / 1280 px. No truncation, no
   horizontal scroll, no overlapping controls.
10. **Add a render test** with Vitest + `@testing-library/react` for the
    page-level component when feasible.
11. **Update `PLAN.md`** to tick the relevant task and link any new
    DESIGN.md decisions back here.

---

## Reference: file layout

```
apps/apartments/src/
├── components/
│   ├── ui/                  # shadcn vendor — generated, edit only for theme tweaks
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── AppLayout.tsx    # bottom-tab shell, Toaster mount
│   │   └── PinnedActionBar.tsx  # fixed CTA strip above tabs (required pattern)
│   ├── PageHeader.tsx       # shared page heading
│   ├── ErrorState.tsx
│   └── LoadingState.tsx
├── hooks/                   # TanStack Query hooks (server state)
├── lib/
│   ├── api.ts
│   ├── queryClient.ts
│   └── utils.ts             # `cn()`
├── pages/                   # route components
├── types/                   # API response types
├── router.tsx
├── App.tsx
├── main.tsx
└── index.css                # Tailwind + shadcn theme tokens
```
