ALTER TABLE spec_definitions
  ADD COLUMN comparison_mode TEXT NOT NULL DEFAULT 'numeric'
  CHECK (comparison_mode IN ('numeric', 'ordinal', 'none'));

UPDATE spec_definitions
SET comparison_mode = 'none'
WHERE value_type != 'number' OR higher_is_better IS NULL;

CREATE TABLE spec_options (
  id TEXT PRIMARY KEY,
  spec_definition_id TEXT NOT NULL REFERENCES spec_definitions(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  rank INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (spec_definition_id, key)
);

CREATE INDEX idx_spec_options_definition
  ON spec_options (spec_definition_id, sort_order, label);

UPDATE spec_definitions
SET comparison_mode = 'ordinal'
WHERE key = 'memory_type'
  AND kind_id = (SELECT id FROM kinds WHERE slug = 'gpu');

INSERT INTO spec_options (id, spec_definition_id, key, label, rank, sort_order)
SELECT
  sd.id || '-option-gddr6',
  sd.id,
  'gddr6',
  'GDDR6',
  1,
  10
FROM spec_definitions sd
JOIN kinds k ON k.id = sd.kind_id
WHERE k.slug = 'gpu' AND sd.key = 'memory_type'
UNION ALL
SELECT
  sd.id || '-option-gddr6x',
  sd.id,
  'gddr6x',
  'GDDR6X',
  2,
  20
FROM spec_definitions sd
JOIN kinds k ON k.id = sd.kind_id
WHERE k.slug = 'gpu' AND sd.key = 'memory_type'
UNION ALL
SELECT
  sd.id || '-option-gddr7',
  sd.id,
  'gddr7',
  'GDDR7',
  3,
  30
FROM spec_definitions sd
JOIN kinds k ON k.id = sd.kind_id
WHERE k.slug = 'gpu' AND sd.key = 'memory_type';

UPDATE items
SET specs_json = json_set(
  specs_json,
  '$.memory_type',
  CASE lower(json_extract(specs_json, '$.memory_type'))
    WHEN 'gddr6' THEN 'gddr6'
    WHEN 'gddr6x' THEN 'gddr6x'
    WHEN 'gddr7' THEN 'gddr7'
  END
)
WHERE kind_id = (SELECT id FROM kinds WHERE slug = 'gpu')
  AND lower(json_extract(specs_json, '$.memory_type')) IN (
    'gddr6',
    'gddr6x',
    'gddr7'
  );
