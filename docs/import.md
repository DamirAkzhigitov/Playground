Plus import-manifest.json with itemTypeId, userId, and spec metadata.

Usage

# 1. Copy template for a new source
cp -r apps/compare/import-templates/gpu-example apps/compare/import-templates/my-source
# 2. Edit manifest (userId) + items.csv
# 3. Validate
node apps/compare/scripts/csv-to-sql.mjs \
--dir apps/compare/import-templates/my-source --dry-run
# 4. Generate SQL
node apps/compare/scripts/csv-to-sql.mjs \
--dir apps/compare/import-templates/my-source --out /tmp/import.sql
# 5. Load into local D1
cd apps/compare/worker
pnpm exec wrangler d1 execute apartments-db --local \
--persist-to ../../../.wrangler/local-dev-persist \
--file=/tmp/import.sql

For a new data source: fetch the spec template from GET /api/item-types/{id}/template, map source fields →
answer:<spec_id> columns, normalize types in your ETL step, then run --dry-run until it passes.

To use with the agent later, mention compare bulk import or attach the compare-bulk-import skill when converting
a spreadsheet or API dump.
