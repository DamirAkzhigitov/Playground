-- compare-next schema
-- We store individual items + per-kind spec definitions. A comparison ("A vs B")
-- is never persisted as content; it is derived at request time. Only lightweight
-- pointers + counters (comparison_stats) are stored for ranking/curation.

CREATE TABLE kinds (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_plural TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  kind_id TEXT NOT NULL REFERENCES kinds(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  release_date TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  -- specs_json: JSON object keyed by spec_definitions.key, e.g. {"vram_gb":16}
  specs_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (kind_id, slug)
);

CREATE INDEX idx_items_kind ON items (kind_id);

CREATE TABLE spec_definitions (
  id TEXT PRIMARY KEY,
  kind_id TEXT NOT NULL REFERENCES kinds(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  -- value_type: 'number' | 'text' | 'boolean'
  value_type TEXT NOT NULL DEFAULT 'text',
  -- higher_is_better: 1 = bigger wins, 0 = smaller wins (price/latency), NULL = not ranked
  higher_is_better INTEGER,
  group_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (kind_id, key)
);

CREATE INDEX idx_spec_defs_kind ON spec_definitions (kind_id);

-- Pointers + counters only. Never stores comparison content.
CREATE TABLE comparison_stats (
  pair_key TEXT PRIMARY KEY,
  kind_id TEXT NOT NULL REFERENCES kinds(id) ON DELETE CASCADE,
  -- item_slugs_json: canonical, ordered JSON array of item slugs, e.g. ["rtx-3070","rtx-5080"]
  item_slugs_json TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_viewed_at TEXT
);

CREATE INDEX idx_comparison_stats_kind ON comparison_stats (kind_id);
CREATE INDEX idx_comparison_stats_views ON comparison_stats (view_count DESC);
CREATE INDEX idx_comparison_stats_featured ON comparison_stats (is_featured, view_count DESC);
