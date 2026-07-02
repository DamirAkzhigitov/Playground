---
name: compare-bulk-import
description: >-
  Converts plain or tabular source data into compare-app bulk-import CSV and D1
  SQL (items + answers). Use when bulk loading compare items, building import
  templates, mapping spreadsheets to spec types, wrangler d1 seed SQL, or
  preparing 100+ rows for apps/compare.
disable-model-invocation: true
---

# Compare Bulk Import (CSV → SQL)

## Canonical Doc

Read **[`apps/compare/IMPORT.md`](../../../apps/compare/IMPORT.md)** before generating files. It defines column names, spec value encodings, and the wrangler apply step.

## Quick Workflow

1. Resolve **item type** (`itemTypeId`) and **owner** (`userId`).
2. Fetch spec template: `GET /api/item-types/{id}/template` → `spec-template.json`.
3. Build **`import-manifest.json`** + wide **`items.csv`** (one row per item).
4. Map source fields → `title`, `notes`, `is_public`, `answer:<spec_id>`, optional `note:<spec_id>`.
5. Encode values per spec **type** (see table below).
6. Run converter:

```bash
node apps/compare/scripts/csv-to-sql.mjs --dir <bundle-dir> --dry-run
node apps/compare/scripts/csv-to-sql.mjs --dir <bundle-dir> --out /tmp/import.sql
```

7. Apply: `wrangler d1 execute apartments-db --local --persist-to ../../../.wrangler/local-dev-persist --file=/tmp/import.sql` from `apps/compare/worker`.

Example bundle: [`apps/compare/import-templates/gpu-example/`](../../../apps/compare/import-templates/gpu-example/).

## Value encoding (required)

| Type | CSV cell |
|------|----------|
| `text` | Plain text |
| `number` | Decimal string, no `,` or units |
| `date` | `YYYY-MM-DD` |
| `boolean` | `true` or `false` |
| `select` | `spec_options.value`, not display label |
| `multi-select` | JSON array string, e.g. `["a","b"]` |
| `rating` | Integer string within min..max |

Empty cell = no answer. Never put display labels in select/multi-select cells.

## CSV header rules

- Fixed: `title` (required), `notes`, `is_public` (`0`/`1`), `item_id` (optional UUID).
- Answers: `answer:<spec_id>` and optional `note:<spec_id>`.
- Use **spec ids** in headers, not human labels.

## When building from a new data source

1. List source columns and spec template side by side.
2. Write an explicit field map (source → CSV column + transform).
3. Handle option label → value mapping in the transform step.
4. Add 1–3 sample rows to the template folder; run `--dry-run` until zero errors.
5. Do not use per-item HTTP `POST /api/items` for large loads; use SQL.

## Agent checklist

- [ ] `itemTypeId` and `userId` set in manifest
- [ ] Every `answer:*` column matches a spec id in the template
- [ ] Select/multi-select values match `spec_options.value`
- [ ] Dates/booleans/numbers match IMPORT.md rules
- [ ] `csv-to-sql.mjs --dry-run` passes
- [ ] User told to verify on local D1 before `--remote`

## Pitfalls

- Curated compare groups cap at **100** items via API; use `selection_mode: all` or SQL for large catalogs.
- Re-import with new `item_id` duplicates items; reuse ids to upsert answers only.
- Photos are not imported via CSV (R2 keys separate).
