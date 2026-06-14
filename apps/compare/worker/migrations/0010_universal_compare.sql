-- Clean-break schema: multi-type items, spec templates, compare groups.
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS compare_group_items;
DROP TABLE IF EXISTS compare_groups;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS spec_options;
DROP TABLE IF EXISTS specs;
DROP TABLE IF EXISTS spec_sections;
DROP TABLE IF EXISTS item_types;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS listings;

PRAGMA foreign_keys = ON;

CREATE TABLE item_types (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  user_id TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_item_types_user ON item_types(user_id);
CREATE INDEX idx_item_types_system ON item_types(is_system);

CREATE TABLE spec_sections (
  id TEXT PRIMARY KEY,
  item_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE CASCADE
);

CREATE INDEX idx_spec_sections_type_order
  ON spec_sections(item_type_id, "order");

CREATE TABLE specs (
  id TEXT PRIMARY KEY,
  item_type_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL,
  rating_min INTEGER,
  rating_max INTEGER,
  value_preference TEXT,
  FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES spec_sections(id) ON DELETE CASCADE
);

CREATE INDEX idx_specs_type_section_order
  ON specs(item_type_id, section_id, "order");

CREATE TABLE spec_options (
  id TEXT PRIMARY KEY,
  spec_id TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (spec_id) REFERENCES specs(id) ON DELETE CASCADE
);

CREATE INDEX idx_spec_options_spec_order
  ON spec_options(spec_id, "order");

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  item_type_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE RESTRICT
);

CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_items_type ON items(item_type_id);
CREATE INDEX idx_items_public ON items(is_public);

CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  spec_id TEXT NOT NULL,
  value TEXT,
  note TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(item_id, spec_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (spec_id) REFERENCES specs(id) ON DELETE RESTRICT
);

CREATE INDEX idx_answers_item ON answers(item_id);
CREATE INDEX idx_answers_spec ON answers(spec_id);

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  spec_id TEXT,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (spec_id) REFERENCES specs(id) ON DELETE SET NULL
);

CREATE INDEX idx_photos_item ON photos(item_id);

CREATE TABLE compare_groups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  item_type_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  selection_mode TEXT NOT NULL DEFAULT 'curated',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE RESTRICT
);

CREATE INDEX idx_compare_groups_user ON compare_groups(user_id);
CREATE INDEX idx_compare_groups_public ON compare_groups(is_public);
CREATE INDEX idx_compare_groups_type ON compare_groups(item_type_id);

CREATE TABLE compare_group_items (
  group_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (group_id, item_id),
  FOREIGN KEY (group_id) REFERENCES compare_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

INSERT INTO item_types (id, slug, name, icon, is_system, user_id, "order", created_at) VALUES
  ('type-gpu', 'gpu', 'Graphics card (GPU)', 'cpu', 1, NULL, 1, '2026-01-01T00:00:00.000Z');

INSERT INTO spec_sections (id, item_type_id, name, "order") VALUES
  ('sec-gpu-general', 'type-gpu', 'General', 1),
  ('sec-gpu-performance', 'type-gpu', 'Performance', 2),
  ('sec-gpu-power', 'type-gpu', 'Power', 3),
  ('sec-gpu-price', 'type-gpu', 'Price', 4);

INSERT INTO specs (id, item_type_id, section_id, label, type, required, is_archived, "order", rating_min, rating_max, value_preference) VALUES
  ('spec-gpu-model', 'type-gpu', 'sec-gpu-general', 'Model name', 'text', 1, 0, 1, NULL, NULL, NULL),
  ('spec-gpu-vendor', 'type-gpu', 'sec-gpu-general', 'Manufacturer', 'select', 1, 0, 2, NULL, NULL, NULL),
  ('spec-gpu-vram', 'type-gpu', 'sec-gpu-general', 'VRAM (GB)', 'number', 1, 0, 3, NULL, NULL, 'higher'),
  ('spec-gpu-cores', 'type-gpu', 'sec-gpu-performance', 'CUDA / stream processors', 'number', 0, 0, 1, NULL, NULL, 'higher'),
  ('spec-gpu-boost', 'type-gpu', 'sec-gpu-performance', 'Boost clock (MHz)', 'number', 0, 0, 2, NULL, NULL, 'higher'),
  ('spec-gpu-rt', 'type-gpu', 'sec-gpu-performance', 'Ray tracing', 'boolean', 0, 0, 3, NULL, NULL, NULL),
  ('spec-gpu-tdp', 'type-gpu', 'sec-gpu-power', 'TDP (W)', 'number', 0, 0, 1, NULL, NULL, 'lower'),
  ('spec-gpu-psu', 'type-gpu', 'sec-gpu-power', 'Recommended PSU (W)', 'number', 0, 0, 2, NULL, NULL, 'lower'),
  ('spec-gpu-msrp', 'type-gpu', 'sec-gpu-price', 'MSRP ($)', 'number', 0, 0, 1, NULL, NULL, 'lower'),
  ('spec-gpu-street', 'type-gpu', 'sec-gpu-price', 'Street price ($)', 'number', 0, 0, 2, NULL, NULL, 'lower');

INSERT INTO spec_options (id, spec_id, label, value, "order") VALUES
  ('opt-gpu-nvidia', 'spec-gpu-vendor', 'NVIDIA', 'nvidia', 1),
  ('opt-gpu-amd', 'spec-gpu-vendor', 'AMD', 'amd', 2),
  ('opt-gpu-intel', 'spec-gpu-vendor', 'Intel', 'intel', 3);

INSERT INTO compare_groups (id, title, item_type_id, user_id, is_public, selection_mode, created_at, updated_at) VALUES
  ('group-gpu-demo', 'GPU comparison', 'type-gpu', 'system', 1, 'all', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
