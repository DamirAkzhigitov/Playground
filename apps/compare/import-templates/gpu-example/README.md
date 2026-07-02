# GPU import example

Copy this folder when starting a new source-specific template.

1. Set `userId` in `import-manifest.json` (auth user UUID).
2. Edit `items.csv` or replace columns to match your item type's spec ids.
3. Validate and generate SQL:

```bash
node apps/compare/scripts/csv-to-sql.mjs --dir apps/compare/import-templates/gpu-example --dry-run
node apps/compare/scripts/csv-to-sql.mjs --dir apps/compare/import-templates/gpu-example --out /tmp/gpu-import.sql
```

See [`../../IMPORT.md`](../../IMPORT.md) for encoding rules.
