# Bulk import: plain data → CSV → D1 SQL

Guide for turning arbitrary source data into compare-app rows (`items` + `answers`) ready for `wrangler d1 execute`.

**Related:** [`worker/migrations/0010_universal_compare.sql`](worker/migrations/0010_universal_compare.sql) (schema), [`scripts/csv-to-sql.mjs`](scripts/csv-to-sql.mjs) (converter), [`import-templates/`](import-templates/) (examples).

## Overview

```
Source data (sheet, API, scrape, …)
        ↓ map fields + encode spec values
items.csv  +  import-manifest.json  (+ optional spec-template.json)
        ↓ node scripts/csv-to-sql.mjs
items-import.sql
        ↓ wrangler d1 execute
compare D1 (items + answers)
```

Import targets **items** and **answers** only. Photos (R2) and compare groups are out of scope for CSV import unless you add separate SQL.

## Prerequisites

1. **Item type exists** — system type (e.g. `type-gpu`) or your custom type in `item_types`.
2. **Spec template exists** — `spec_sections` + `specs` (+ `spec_options` for select types).
3. **Owner user id** — auth user UUID (`user_id` on every `items` row). After first sign-in to compare locally, read it from compare D1 `users` or auth D1 `user` table.
4. **Spec ids** — stable column keys; fetch once:

```bash
curl -b cookies.txt http://localhost:3002/api/item-types/type-gpu/template
```

Save as `spec-template.json` (sections → specs array) for the manifest.

## File bundle

| File | Purpose |
|------|---------|
| `import-manifest.json` | `itemTypeId`, `userId`, spec metadata for validation |
| `items.csv` | One row per item; wide answer columns |
| `spec-template.json` | Optional; copied from API if manifest omits `specs` |

### `import-manifest.json`

```json
{
  "itemTypeId": "type-gpu",
  "userId": "00000000-0000-0000-0000-000000000001",
  "specs": [
    {
      "id": "spec-gpu-vram",
      "label": "VRAM (GB)",
      "type": "number",
      "required": true,
      "options": []
    },
    {
      "id": "spec-gpu-vendor",
      "label": "Manufacturer",
      "type": "select",
      "required": true,
      "options": [
        { "label": "NVIDIA", "value": "nvidia" },
        { "label": "AMD", "value": "amd" }
      ]
    }
  ]
}
```

If `specs` is omitted, the converter loads `spec-template.json` from the same directory and flattens `sections[].specs`.

### `items.csv` column rules

**Item columns** (fixed names, case-sensitive):

| Column | Required | DB | Notes |
|--------|----------|-----|-------|
| `title` | yes | `items.title` | 1–200 chars |
| `notes` | no | `items.notes` | max 5000 chars; empty → NULL |
| `is_public` | no | `items.is_public` | `0` or `1`; default `0` |
| `item_id` | no | `items.id` | UUID; empty → generated |

**Answer columns** — prefix + spec id:

| Pattern | Maps to |
|---------|---------|
| `answer:<spec_id>` | `answers.value` |
| `note:<spec_id>` | `answers.note` (optional) |

Example header:

```csv
title,notes,is_public,answer:spec-gpu-model,answer:spec-gpu-vendor,answer:spec-gpu-vram,answer:spec-gpu-rt
```

Use **spec ids**, not labels, in headers so renames in the UI do not break imports.

## Spec value encoding (`answers.value`)

All values are stored as **TEXT** in SQLite. The app validates by spec `type` (see `apps/compare/src/lib/answerValue.ts`).

| Spec type | CSV cell | Stored value | Invalid examples |
|-----------|----------|--------------|------------------|
| `text` | Plain text | As-is (trimmed) | — |
| `number` | Decimal numeral | String, e.g. `"24"`, `"1299.99"` | `1,299`, `24 GB`, empty if required |
| `date` | `YYYY-MM-DD` | ISO date string | `06/15/2024`, `2024-02-30` |
| `boolean` | `true` or `false` | Lowercase string | `yes`, `1`, `Y` |
| `select` | Option **value** | Must match `spec_options.value` | Display label `NVIDIA` when value is `nvidia` |
| `multi-select` | JSON array of option values | `["wifi","parking"]` | Comma-separated list without JSON |
| `rating` | Integer in range | String integer, e.g. `"4"` | Out of `rating_min`..`rating_max` |

**Empty cells:** omit the answer (no row) or leave NULL — both are “unanswered”. Do not use `NULL`, `N/A`, or `-` unless you intend literal text (text type only).

**Multi-select in CSV:** quote the cell so commas are safe:

```csv
title,answer:spec-amenities
Unit A,"[""wifi"",""parking""]"
```

**Boolean:** only `true` and `false` count as filled; anything else is treated as invalid/empty for required specs.

**Select / multi-select:** always map source labels → `spec_options.value` in your ETL step, not at SQL time.

## Converting source data (workflow)

1. **Inventory source fields** — list columns/properties in the raw data.
2. **Load spec template** — for each spec, note `id`, `type`, `required`, and option values.
3. **Write a field map** (spreadsheet or code):

   | Source field | CSV column | Transform |
   |--------------|------------|-----------|
   | `product_name` | `title` | trim |
   | `brand` | `answer:spec-gpu-vendor` | map `NVIDIA`→`nvidia` |
   | `memory_gb` | `answer:spec-gpu-vram` | strip units, parse float |
   | `ray_tracing` | `answer:spec-gpu-rt` | `Y`/`N` → `true`/`false` |

4. **Normalize types** before writing CSV (do not rely on SQL to cast).
5. **Validate row count** and spot-check 3–5 rows against the spec template.
6. **Run converter** (dry-run first):

```bash
node apps/compare/scripts/csv-to-sql.mjs \
  --dir apps/compare/import-templates/gpu-example \
  --dry-run

node apps/compare/scripts/csv-to-sql.mjs \
  --dir apps/compare/import-templates/gpu-example \
  --out /tmp/gpu-import.sql
```

7. **Apply locally:**

```bash
cd apps/compare/worker
pnpm exec wrangler d1 execute apartments-db --local \
  --persist-to ../../../.wrangler/local-dev-persist \
  --file=/tmp/gpu-import.sql
```

8. **Verify** in the app (`/items`) or:

```bash
pnpm exec wrangler d1 execute apartments-db --local \
  --persist-to ../../../.wrangler/local-dev-persist \
  --command "SELECT COUNT(*) FROM items WHERE item_type_id = 'type-gpu'"
```

Remote: use `apartments-db` / `apartments-db-dev` with `--remote` (and `--env dev` for dev). Test on local D1 first.

## SQL shape (what the script emits)

```sql
BEGIN TRANSACTION;

INSERT INTO items (id, item_type_id, user_id, title, notes, is_public, created_at, updated_at)
VALUES (...);

INSERT INTO answers (id, item_id, spec_id, value, note, updated_at)
VALUES (...)
ON CONFLICT(item_id, spec_id) DO UPDATE SET
  value = excluded.value,
  note = excluded.note,
  updated_at = excluded.updated_at;

COMMIT;
```

Timestamps are UTC ISO (`YYYY-MM-DDTHH:mm:ss.sssZ`). Re-running the same `item_id` upserts answers; item rows use plain `INSERT` (duplicate ids will fail).

## Custom item types

For a new type not in migrations:

1. Create the type in the UI (or SQL into `item_types` + `spec_sections` + `specs` + `spec_options`).
2. Export template from API → `spec-template.json`.
3. Build CSV with that type’s `answer:<spec_id>` columns.

Seed SQL for types/specs can live in a **separate** migration executed before `items-import.sql`.

## Compare groups after import

- **`selection_mode: "all"`** — group shows every item of that type (no per-item linking).
- **`selection_mode: "curated"`** — max **100** items via API; for larger sets use `all` or insert `compare_group_items` in SQL.

## Pitfalls

| Mistake | Symptom |
|---------|---------|
| Label in `select` cell instead of option value | Value shows blank / not filled |
| Thousands separators in numbers | Compare math breaks |
| Wrong `itemTypeId` | FK error or items invisible in type filter |
| Wrong `userId` | Items not listed as yours |
| `multi-select` not JSON | Required spec stays incomplete |
| Importing >1000 rows via HTTP API | Slow; use this SQL path instead |
| Duplicate `title` only, new `item_id` each run | Duplicate items |

## Creating templates for new sources

Copy [`import-templates/gpu-example/`](import-templates/gpu-example/) to `import-templates/<your-source>/`:

1. Replace `import-manifest.json` (`itemTypeId`, `userId`, `specs`).
2. Replace `items.csv` header with your `answer:<spec_id>` columns.
3. Keep one example row with valid encodings per type.
4. Document source-specific transforms in a local `README.md` in that folder (optional).

## Export round-trip

`GET /api/export/json` returns `items`, `answers`, `item_types` in DB column shape. You can transform export JSON → this CSV format to clone or edit offline; column names in CSV still use `answer:<spec_id>` for clarity.
