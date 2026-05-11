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

- Bottom-tab nav (`AppLayout`) is the mobile primary navigation. It
  stays visible at all widths until we promote it to a side rail
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
  collapses into a `DropdownMenu` (`MoreVertical` trigger). This is the
  fix for the broken Categories row in the screenshot — input + 4 inline
  buttons on a 360px screen squeezes the input to 3 characters.
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

1. **Design at 360 px** in the browser before writing JSX.
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
