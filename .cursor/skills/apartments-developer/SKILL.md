---
name: apartments-developer
description: Implements and maintains the Apartments tool in apps/apartments following its design system and Cloudflare Worker API. Use when editing apps/apartments, apartments UI, inspection flows, the Hono worker, D1, wrangler for apartments, or when the user attaches or names this skill for apartments work.
disable-model-invocation: true
---

# Apartments app developer

## Scope

Work lives under `apps/apartments/` (Vite + React package `@playground/apartments`). Treat this skill as the default mindset for that app: match existing patterns in the tree before introducing new libraries or conventions.

## UI and product references

- **Visual and interaction rules** — Read and follow [DESIGN.md](../../../apps/apartments/DESIGN.md) for every UI change (layout, components, tokens, forms, motion, accessibility). It is the source of truth; do not contradict it without an explicit decision to update the doc first.
- **What we are building** — Use [PLAN.md](../../../apps/apartments/PLAN.md) for product scope and priorities when choosing what to implement.

Before inventing a new primitive or pattern, check `DESIGN.md` and existing `src/components/` (including shadcn-owned `src/components/ui/`).

## Monorepo commands

Run from the repo root with pnpm (see root `AGENTS.md` and `README.md`):

- Dev (frontend): `pnpm --filter @playground/apartments dev`
- Build app: `pnpm turbo run build --filter=@playground/apartments`
- Lint / type-check / test: use the same `--filter @playground/apartments` pattern or repo-wide `pnpm lint` / `pnpm type-check` as appropriate for the change.

## Backend (Worker API)

Production is **one Cloudflare Worker** (`apps/apartments/worker`, package `@playground/apartments-api`): static assets from `apps/apartments/dist` plus **Hono** routes under `/api/*`. The browser uses **relative `/api` URLs** (no `VITE_API_BASE_URL` in CI). Details and deploy commands are in the root `README.md` section **Apartments (`apps/apartments`)**.

When changing the API or persistence:

- Work in `apps/apartments/worker/` and align with existing Hono handlers, Zod usage, and `wrangler.toml` (including D1 bindings and migrations if present).
- Keep API contracts compatible with the React app’s fetch/query usage unless you coordinate a coordinated front-and-back change.
- Use worker scripts from that package (for example `pnpm --filter @playground/apartments-api exec wrangler deploy` per README) rather than guessing deploy targets.

If something is ambiguous (routing, env, D1), read `apps/apartments/wrangler.toml`, `apps/apartments/worker/`, and `README.md` before assuming a generic Cloudflare or Vite pattern.

## Checklist

- [ ] UI matches `DESIGN.md` (mobile-first, tokens, shadcn/Radix, pinned CTAs if applicable).
- [ ] Scope aligns with `PLAN.md` when adding user-visible behavior.
- [ ] API or deploy changes respect the Worker + `/api` layout and monorepo pnpm filters.
