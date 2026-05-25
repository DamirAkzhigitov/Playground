-- Seed data for local development & smoke tests (Phase 1+)
-- Password for both seeds: SeedPass123!
-- Contributor: can create/edit/publish via API
-- User: can enroll and track progress

INSERT OR IGNORE INTO users (id, email, password_hash, role, created_at)
VALUES (
  'a1000001-0001-4001-8001-000000000001',
  'seed+contributor@local.test',
  'Bo2BMwEjon1hY9mVGStPUA==:iDPfUasi3+k+eeLH9UxQCdyDRKdQbnftPHhADZRWUOA=',
  'contributor',
  '2026-05-25T00:00:00.000Z'
);

INSERT OR IGNORE INTO users (id, email, password_hash, role, created_at)
VALUES (
  'a1000001-0001-4001-8001-000000000002',
  'seed+user@local.test',
  'Bo2BMwEjon1hY9mVGStPUA==:iDPfUasi3+k+eeLH9UxQCdyDRKdQbnftPHhADZRWUOA=',
  'user',
  '2026-05-25T00:00:00.000Z'
);

-- Sample published action: "Buying an apartment with a mortgage" (realistic for housing tools)
INSERT OR IGNORE INTO actions (id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at)
VALUES (
  'a1000001-0001-4001-8001-000000000010',
  'buy-apartment-mortgage',
  'Buying an apartment with a mortgage',
  'Step-by-step guide to finding, financing, and closing on your first home using a mortgage loan.',
  '["housing","finance","mortgage"]',
  'published',
  'en',
  'a1000001-0001-4001-8001-000000000001',
  '2026-05-25T00:00:00.000Z',
  '2026-05-25T00:00:00.000Z'
);

-- Steps for the sample action (order 1-based, some with estimated time)
INSERT OR IGNORE INTO steps (id, action_id, "order", title, body_md, estimated_minutes, created_at, updated_at)
VALUES
  ('a1000001-0001-4001-8001-000000000011', 'a1000001-0001-4001-8001-000000000010', 1, 'Assess your finances and credit', 'Calculate your monthly budget, check your credit score, and determine how much you can realistically afford for a down payment and monthly mortgage.', 45, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z'),
  ('a1000001-0001-4001-8001-000000000012', 'a1000001-0001-4001-8001-000000000010', 2, 'Get pre-approved for a mortgage', 'Shop lenders or use your bank. Gather income docs, tax returns, and employment verification. Aim for a pre-approval letter.', 90, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z'),
  ('a1000001-0001-4001-8001-000000000013', 'a1000001-0001-4001-8001-000000000010', 3, 'Search for homes within budget', 'Work with a realtor or use listing sites. Tour properties, note must-haves vs nice-to-haves. Track favorites.', 120, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z'),
  ('a1000001-0001-4001-8001-000000000014', 'a1000001-0001-4001-8001-000000000010', 4, 'Make an offer and negotiate', 'Submit offer with pre-approval. Negotiate price, closing costs, contingencies (inspection, financing).', 60, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z'),
  ('a1000001-0001-4001-8001-000000000015', 'a1000001-0001-4001-8001-000000000010', 5, 'Complete inspection and appraisal', 'Hire inspector. Review report for major issues. Appraisal required by lender to confirm value.', 30, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z'),
  ('a1000001-0001-4001-8001-000000000016', 'a1000001-0001-4001-8001-000000000010', 6, 'Finalize mortgage and closing', 'Review closing disclosure (3 days before). Sign docs, pay closing costs, get keys!', 120, '2026-05-25T00:00:00.000Z', '2026-05-25T00:00:00.000Z');

-- Sample requirements (informational)
INSERT OR IGNORE INTO step_requirements (id, step_id, label, kind, details, "order")
VALUES
  ('a1000001-0001-4001-8001-000000000021', 'a1000001-0001-4001-8001-000000000011', 'Recent pay stubs (last 2 months)', 'document', null, 1),
  ('a1000001-0001-4001-8001-000000000022', 'a1000001-0001-4001-8001-000000000011', 'Last 2 years tax returns', 'document', null, 2),
  ('a1000001-0001-4001-8001-000000000023', 'a1000001-0001-4001-8001-000000000012', 'Choose 2-3 lenders to compare rates', 'task', null, 1),
  ('a1000001-0001-4001-8001-000000000024', 'a1000001-0001-4001-8001-000000000013', 'Use Zillow / local MLS + realtor tours', 'link', 'https://zillow.com', 1);

-- Note: No enrollments or progress in seed; users create via API after login.
