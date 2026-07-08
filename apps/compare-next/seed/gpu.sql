-- Manual seed for the GPU kind. Idempotent-ish: clears the kind first so it can
-- be re-run in local dev. Do NOT run against remote without intent.

DELETE FROM comparison_stats WHERE kind_id = 'kind-gpu';
DELETE FROM items WHERE kind_id = 'kind-gpu';
DELETE FROM spec_definitions WHERE kind_id = 'kind-gpu';
DELETE FROM kinds WHERE id = 'kind-gpu';

INSERT INTO kinds (id, slug, name, name_plural, description) VALUES
  ('kind-gpu', 'gpu', 'Graphics Card', 'Graphics Cards',
   'Compare desktop GPUs on memory, clocks, power draw, and price to find the right card for your build.');

INSERT INTO spec_definitions (id, kind_id, key, label, unit, value_type, higher_is_better, group_label, sort_order) VALUES
  ('gpu-spec-vram',       'kind-gpu', 'vram_gb',        'VRAM',           'GB',  'number',  1,    'Memory',  10),
  ('gpu-spec-memtype',    'kind-gpu', 'memory_type',    'Memory Type',    NULL,  'text',    NULL, 'Memory',  20),
  ('gpu-spec-membus',     'kind-gpu', 'memory_bus_bit', 'Memory Bus',     'bit', 'number',  1,    'Memory',  30),
  ('gpu-spec-boost',      'kind-gpu', 'boost_clock_mhz','Boost Clock',    'MHz', 'number',  1,    'Clocks',  40),
  ('gpu-spec-cores',      'kind-gpu', 'shader_cores',   'Shader Cores',   NULL,  'number',  1,    'Compute', 50),
  ('gpu-spec-tdp',        'kind-gpu', 'tdp_w',          'TDP',            'W',   'number',  0,    'Power',   60),
  ('gpu-spec-length',     'kind-gpu', 'length_mm',      'Length',         'mm',  'number',  0,    'Physical',70),
  ('gpu-spec-rt',         'kind-gpu', 'ray_tracing',    'Ray Tracing',    NULL,  'boolean', NULL, 'Features',80),
  ('gpu-spec-msrp',       'kind-gpu', 'msrp_usd',       'MSRP',           '$',   'number',  0,    'Price',   90);

INSERT INTO items (id, kind_id, slug, name, brand, image_url, release_date, view_count, specs_json) VALUES
  ('gpu-rtx-5080', 'kind-gpu', 'rtx-5080', 'GeForce RTX 5080', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-5080/800/600', '2025-01-30', 48200,
   '{"vram_gb":16,"memory_type":"GDDR7","memory_bus_bit":256,"boost_clock_mhz":2617,"shader_cores":10752,"tdp_w":360,"length_mm":304,"ray_tracing":true,"msrp_usd":999}'),
  ('gpu-rtx-4090', 'kind-gpu', 'rtx-4090', 'GeForce RTX 4090', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-4090/800/600', '2022-10-12', 51200,
   '{"vram_gb":24,"memory_type":"GDDR6X","memory_bus_bit":384,"boost_clock_mhz":2520,"shader_cores":16384,"tdp_w":450,"length_mm":304,"ray_tracing":true,"msrp_usd":1599}'),
  ('gpu-rtx-4080-super', 'kind-gpu', 'rtx-4080-super', 'GeForce RTX 4080 Super', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-4080s/800/600', '2024-01-31', 39800,
   '{"vram_gb":16,"memory_type":"GDDR6X","memory_bus_bit":256,"boost_clock_mhz":2550,"shader_cores":10240,"tdp_w":320,"length_mm":310,"ray_tracing":true,"msrp_usd":999}'),
  ('gpu-rtx-3080', 'kind-gpu', 'rtx-3080', 'GeForce RTX 3080', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-3080/800/600', '2020-09-17', 44100,
   '{"vram_gb":10,"memory_type":"GDDR6X","memory_bus_bit":320,"boost_clock_mhz":1710,"shader_cores":8704,"tdp_w":320,"length_mm":285,"ray_tracing":true,"msrp_usd":699}'),
  ('gpu-rtx-3070', 'kind-gpu', 'rtx-3070', 'GeForce RTX 3070', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-3070/800/600', '2020-10-29', 46700,
   '{"vram_gb":8,"memory_type":"GDDR6","memory_bus_bit":256,"boost_clock_mhz":1725,"shader_cores":5888,"tdp_w":220,"length_mm":242,"ray_tracing":true,"msrp_usd":499}'),
  ('gpu-rx-7900-xtx', 'kind-gpu', 'rx-7900-xtx', 'Radeon RX 7900 XTX', 'AMD',
   'https://picsum.photos/seed/gpu-rx-7900xtx/800/600', '2022-12-13', 33500,
   '{"vram_gb":24,"memory_type":"GDDR6","memory_bus_bit":384,"boost_clock_mhz":2500,"shader_cores":6144,"tdp_w":355,"length_mm":287,"ray_tracing":true,"msrp_usd":999}'),
  ('gpu-rx-7700-xt', 'kind-gpu', 'rx-7700-xt', 'Radeon RX 7700 XT', 'AMD',
   'https://picsum.photos/seed/gpu-rx-7700xt/800/600', '2023-09-06', 28900,
   '{"vram_gb":12,"memory_type":"GDDR6","memory_bus_bit":192,"boost_clock_mhz":2544,"shader_cores":3456,"tdp_w":245,"length_mm":267,"ray_tracing":true,"msrp_usd":449}'),
  ('gpu-rtx-4060-ti', 'kind-gpu', 'rtx-4060-ti', 'GeForce RTX 4060 Ti', 'NVIDIA',
   'https://picsum.photos/seed/gpu-rtx-4060ti/800/600', '2023-05-24', 31200,
   '{"vram_gb":8,"memory_type":"GDDR6","memory_bus_bit":128,"boost_clock_mhz":2535,"shader_cores":4352,"tdp_w":160,"length_mm":240,"ray_tracing":true,"msrp_usd":399}');

-- Curated / popular comparisons (pointers only). item_slugs_json is canonical (alphabetical).
INSERT INTO comparison_stats (pair_key, kind_id, item_slugs_json, view_count, is_featured) VALUES
  ('gpu:rtx-3070|rtx-5080',       'kind-gpu', '["rtx-3070","rtx-5080"]',       18400, 1),
  ('gpu:rtx-4080-super|rtx-4090', 'kind-gpu', '["rtx-4080-super","rtx-4090"]', 15200, 1),
  ('gpu:rtx-4080-super|rx-7900-xtx','kind-gpu','["rtx-4080-super","rx-7900-xtx"]', 12800, 1),
  ('gpu:rtx-4060-ti|rx-7700-xt',  'kind-gpu', '["rtx-4060-ti","rx-7700-xt"]',  9600,  1),
  ('gpu:rtx-3070|rtx-3080',       'kind-gpu', '["rtx-3070","rtx-3080"]',       8700,  0),
  ('gpu:rtx-4090|rx-7900-xtx',    'kind-gpu', '["rtx-4090","rx-7900-xtx"]',    7300,  0);
