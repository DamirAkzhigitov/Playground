-- Local dev / smoke-test users (shared auth DB). Password: SeedPass123!

INSERT OR IGNORE INTO users (id, name, email, emailVerified, createdAt, updatedAt, role, locale)
VALUES (
  'a1000001-0001-4001-8001-000000000001',
  'Seed Contributor',
  'seed+contributor@local.test',
  1,
  1748131200000,
  1748131200000,
  'contributor',
  'en'
);

INSERT OR IGNORE INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
VALUES (
  'a1000001-0001-4001-8001-000000000101',
  'seed+contributor@local.test',
  'credential',
  'a1000001-0001-4001-8001-000000000001',
  'de8c7f46a46fa0406f441968dfb447c8:d5bdfe1da363c1bb767e0573c8b201b61b9e2ca85473b3992701b1fe4096dadc30df6b45a05cdf079354956497e46df47032dbcb1f2a8443c9b1845d847b8227',
  1748131200000,
  1748131200000
);

INSERT OR IGNORE INTO users (id, name, email, emailVerified, createdAt, updatedAt, role, locale)
VALUES (
  'a1000001-0001-4001-8001-000000000002',
  'Seed User',
  'seed+user@local.test',
  1,
  1748131200000,
  1748131200000,
  'user',
  'en'
);

INSERT OR IGNORE INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
VALUES (
  'a1000001-0001-4001-8001-000000000102',
  'seed+user@local.test',
  'credential',
  'a1000001-0001-4001-8001-000000000002',
  'de8c7f46a46fa0406f441968dfb447c8:d5bdfe1da363c1bb767e0573c8b201b61b9e2ca85473b3992701b1fe4096dadc30df6b45a05cdf079354956497e46df47032dbcb1f2a8443c9b1845d847b8227',
  1748131200000,
  1748131200000
);
