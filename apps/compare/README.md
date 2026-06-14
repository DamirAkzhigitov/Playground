# Compare

Universal structured product comparison: add items by type (GPU, camera, apartment, custom types), fill specs, and compare side-by-side in public or private groups.

## App tabs

| Tab | Route | Guest |
| --- | ----- | ----- |
| Browse | `/` | Public compare groups |
| Items | `/items` | Sign-in required |
| My compares | `/my-compares` | Sign-in required |
| Add item | `/add-item` | Sign-in required |
| Settings | `/settings` | Sign-in required |

Compare view: `/compare/:groupId` (public groups are guest-readable).

## Local development

From the repo root:

```bash
pnpm install
pnpm --filter @playground/compare dev
pnpm --filter @playground/compare-api db:migrate:local
```

Other scripts: `build`, `lint`, `type-check`, `test` (see `package.json`).

Reset local D1 after schema changes: delete `.wrangler/local-dev-persist` compare DB or re-run migrations.

## Authentication

Compare uses shared auth (`@playground/auth-core`, `@playground/auth-react`) with
central login at `auth.da-mr.com`. See
[`packages/auth-core/AUTHORIZATION.md`](../../packages/auth-core/AUTHORIZATION.md).

| Access | Today |
| ------ | ----- |
| **Guest** | Browse public compare groups; read public compare view |
| **Signed-in user** | Items, private compares, custom item types, CRUD on own data |

Local dev: set `VITE_AUTH_ORIGIN=http://localhost:3004`; Workers share auth D1 via
`--persist-to .wrangler/local-dev-persist` (see root `AGENTS.md`).

## Data model

- **item_types** — system templates (e.g. GPU) + user custom types
- **spec_sections** / **specs** — per-type comparison fields
- **items** — user-owned entries with answers and photos
- **compare_groups** — public or private; `all` items of type or curated subset
- **compare_group_items** — curated membership

Migration: [`worker/migrations/0010_universal_compare.sql`](worker/migrations/0010_universal_compare.sql)

## API (high level)

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/api/item-types` | Public |
| GET | `/api/compare-groups/public` | Public |
| GET | `/api/compare-groups/:id/view` | Public if group is public |
| GET | `/api/items/:id` | Public if item is public |
| CRUD | `/api/items`, `/api/compare-groups`, … | Signed-in |
