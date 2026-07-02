# NVIDIA RTX 4060 / 4060 Ti import

Source: [`data/NvidiaGPU.txt`](../../../data/NvidiaGPU.txt) (NVIDIA product comparison table).

Specs are defined in migration [`worker/migrations/0011_gpu_nvidia_specs.sql`](../../worker/migrations/0011_gpu_nvidia_specs.sql).

Regenerate CSV from source mapping:

```bash
node apps/compare/scripts/build-nvidia-rtx4060-bundle.mjs
```

Import:

```bash
# Apply spec migration first (local)
cd apps/compare/worker
pnpm exec wrangler d1 migrations apply apartments-db --local \
  --persist-to ../../../.wrangler/local-dev-persist

node ../../scripts/csv-to-sql.mjs --dir ../import-templates/nvidia-rtx4060 --dry-run
node ../../scripts/csv-to-sql.mjs --dir ../import-templates/nvidia-rtx4060 --out /tmp/rtx4060-import.sql
pnpm exec wrangler d1 execute apartments-db --local \
  --persist-to ../../../.wrangler/local-dev-persist \
  --file=/tmp/rtx4060-import.sql
```

Field map (NvidiaGPU.txt → CSV):

| Source row | CSV column | Transform |
|------------|------------|-----------|
| Column header | `title`, `answer:spec-gpu-model` | GPU product name |
| CUDA Cores | `answer:spec-gpu-cores` | integer |
| Boost/Base Clock (GHz) | `answer:spec-gpu-boost`, `answer:spec-gpu-base-clock` | ×1000 → MHz |
| Standard Memory Config | `answer:spec-gpu-memory-config` | text; primary GB → `answer:spec-gpu-vram` |
| Yes/No features | `answer:spec-gpu-*` | `Yes`→`true`, `No`→`false` |
| NVIDIA Architecture | `answer:spec-gpu-architecture` | `Ada Lovelace`→`ada-lovelace` |
| Total Graphics Power | `answer:spec-gpu-tdp` | first wattage when multiple |
