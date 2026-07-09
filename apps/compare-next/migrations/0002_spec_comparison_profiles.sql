ALTER TABLE spec_definitions
  ADD COLUMN comparison_role TEXT NOT NULL DEFAULT 'informational'
  CHECK (comparison_role IN ('primary', 'tradeoff', 'informational'));

ALTER TABLE spec_definitions
  ADD COLUMN comparison_weight REAL NOT NULL DEFAULT 0
  CHECK (comparison_weight >= 0);

ALTER TABLE spec_definitions
  ADD COLUMN minimum_difference_percent REAL NOT NULL DEFAULT 0
  CHECK (minimum_difference_percent >= 0);

UPDATE spec_definitions
SET
  comparison_role = CASE key
    WHEN 'vram_gb' THEN 'primary'
    WHEN 'memory_bus_bit' THEN 'primary'
    WHEN 'shader_cores' THEN 'primary'
    WHEN 'msrp_usd' THEN 'tradeoff'
    WHEN 'tdp_w' THEN 'tradeoff'
    WHEN 'length_mm' THEN 'tradeoff'
    ELSE 'informational'
  END,
  comparison_weight = CASE key
    WHEN 'vram_gb' THEN 3
    WHEN 'memory_bus_bit' THEN 2
    WHEN 'shader_cores' THEN 2
    ELSE 0
  END,
  minimum_difference_percent = CASE key
    WHEN 'vram_gb' THEN 5
    WHEN 'memory_bus_bit' THEN 5
    WHEN 'shader_cores' THEN 5
    ELSE 0
  END
WHERE kind_id = (SELECT id FROM kinds WHERE slug = 'gpu');
