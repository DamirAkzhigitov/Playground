# Shadcn Migration Audit

Phase 1 (investigation only) of migrating `compare-next`'s UI to shadcn/ui.
No component, SCSS, or `components.json` changes were made in this phase —
this document is the audit output.

Repo-wide conventions: [`AGENTS.md`](../../AGENTS.md). App architecture:
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Scope

Only `apps/compare-next` is in scope — it's the only React/Next.js app in the
monorepo today (`apps/main` is vanilla JS/CSS; other apps referenced in
`AGENTS.md`, like `steps`/`auth`/`resume`, don't exist yet under `apps/`).

## Status summary

`components.json` is already configured (style `base-luma`, Tailwind v4,
`taupe` base color), and **14 shadcn/ui components are already installed** in
`src/components/ui/`:

`badge`, `button`, `card`, `empty`, `field`, `input-group`, `input`, `label`,
`separator`, `skeleton`, `spinner`, `textarea`, `toggle-group`, `toggle`.

### Already migrated — `components/catalogue/`

| File | shadcn components used |
| ---- | ----------------------- |
| `CatalogueCard.tsx` | `Card`, `CardContent`, `CardTitle`, `CardDescription`, `Badge` |
| `CatalogueSearch.tsx` | `Field`, `FieldLabel`, `InputGroup`, `InputGroupAddon`, `InputGroupInput` |
| `CatalogueFilters.tsx` | `ToggleGroup`, `ToggleGroupItem` |
| `CataloguePage.tsx` | `Empty`, `EmptyHeader`, `EmptyDescription`, `Skeleton`, `Spinner` |

### Not yet migrated — `components/comparison/` (9 files) + `components/layout/AppLayout.tsx`

These still use hand-rolled BEM classes from `src/styles/comparison.scss`
(635 lines — the bulk of remaining custom CSS), a native `<select>`, and raw
`<span className="badge">` — a legacy CSS class in `src/styles/card.scss`
that duplicates the already-installed `Badge` component.

## Component-by-component mapping

| File | Purpose | Custom markup today | shadcn mapping |
| ---- | ------- | -------------------- | -------------- |
| `ComparisonPicker.tsx` | Add/remove items from the current comparison | Chip list with `×` remove buttons + native `<select>` to add | `Select` (`@shadcn/select`, confirmed available in registry) for the "add item" dropdown; `Badge` composed with a small icon button for removable chips (no built-in "chip" component in shadcn) |
| `HubPicker.tsx` | Multi-select grid of items + "Compare" action bar | `<button>` grid with `aria-pressed`, plain `<button>` for compare | `ToggleGroup`/`ToggleGroupItem` (already installed, used in `CatalogueFilters`) in multi-select mode; `Button` (already installed) for the Compare action |
| `ComparisonTable.tsx` | Grouped spec comparison table, highlights winning values | Raw `<table>` with BEM classes | `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell` (`@shadcn/table`, confirmed available); keep a custom modifier/class for the "winner" cell highlight since that's domain-specific |
| `ItemSpecTable.tsx` | Single-item spec sheet | Raw `<table>` | Same `Table` primitives as above |
| `ComparisonVerdict.tsx` | Verdict summary, per-item pros/cons, FAQ | Plain `div`s (`cmp-verdict__card`), `dl`/`dt`/`dd` for FAQ | `Card` (already installed) for each per-item verdict block; FAQ can stay as `dl` or move to `Accordion` (optional, not required) |
| `ComparisonView.tsx` | Comparison page composition (breadcrumb, header, table, verdict, picker, related) | `<nav>` + `<Link>` + `/` separators; `<span className="badge">` | `Breadcrumb`/`BreadcrumbList`/`BreadcrumbItem`/`BreadcrumbSeparator` (`@shadcn/breadcrumb`, confirmed available); replace `<span className="badge">` with the existing `Badge` component |
| `ItemView.tsx` | Single-item page composition | Same breadcrumb + badge pattern | Same as `ComparisonView` |
| `KindHub.tsx` | Kind hub page (breadcrumb, header, popular list, `HubPicker`) | Same breadcrumb + badge pattern | Same as above |
| `RelatedComparisons.tsx` | "People also compare" link list with view counts | Plain `<ul>`/`<li>` | Low priority — can stay as a plain list, or optionally wrap items in `Card`/use `Badge` for view count |
| `AppLayout.tsx` | App shell wrapper (no header/nav yet) | Single `div` | No action needed now; flag for `Sidebar`/`NavigationMenu` if a header/nav is added later |

## Legacy CSS to flag for cleanup (later phase, not now)

- `src/styles/base.scss` defines custom design tokens (`--color-bg`,
  `--color-surface`, `--shadow-card`, `--radius-*`) that pre-date shadcn and
  now duplicate CSS variables already defined in `tailwind.css`.
- `src/styles/card.scss`'s `.badge` class duplicates the shadcn `Badge`
  component — dead once `comparison/` migrates.
- `src/styles/catalogue.scss` contains the masonry-style grid layout
  (`grid-template-columns`, spanning slots) — legitimate custom CSS with no
  shadcn equivalent, keep as-is.
- `src/styles/comparison.scss` (635 lines) is the main body of debt; expect
  it to shrink substantially but not disappear (table winner-highlighting,
  chip layout, hub-picker grid are domain-specific).

## Phase 2 candidates (suggested order)

1. `KindHub.tsx` / `ItemView.tsx` / `ComparisonView.tsx` — swap the
   hand-rolled breadcrumb `<nav>` and `<span className="badge">` for
   `Breadcrumb` and `Badge`. Lowest risk: no state, no interaction changes.
2. `HubPicker.tsx` — swap toggle buttons for `ToggleGroup`/`ToggleGroupItem`
   and the compare action for `Button`.
3. `ComparisonPicker.tsx` — swap the native `<select>` for `Select`; design a
   removable-chip pattern from `Badge`.
4. `ComparisonTable.tsx` / `ItemSpecTable.tsx` — swap raw `<table>` markup
   for `Table` primitives, preserving the winner-highlight modifier.
5. `ComparisonVerdict.tsx` — swap per-item verdict blocks for `Card`.
6. Remove dead CSS (`card.scss` `.badge`, unused tokens in `base.scss`) once
   the components above no longer reference them.

No component code, `components.json`, or SCSS files were modified in this
phase.
