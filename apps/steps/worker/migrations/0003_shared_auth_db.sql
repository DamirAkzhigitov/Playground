-- Auth tables moved to shared `playground-auth-db` (AUTH_DB binding).
-- App tables keep user_id / author_id as opaque ids (no FK to users).

PRAGMA foreign_keys = OFF;

CREATE TABLE actions_new (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  tags_json TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  locale TEXT NOT NULL DEFAULT 'en',
  author_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO actions_new
SELECT id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at
FROM actions;

DROP TABLE actions;
ALTER TABLE actions_new RENAME TO actions;

CREATE INDEX IF NOT EXISTS idx_actions_slug ON actions(slug);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_author ON actions(author_id);

CREATE TABLE enrollments_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_step_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
  FOREIGN KEY (last_step_id) REFERENCES steps(id) ON DELETE SET NULL
);

INSERT INTO enrollments_new
SELECT id, user_id, action_id, started_at, last_step_id, updated_at
FROM enrollments;

DROP TABLE enrollments;
ALTER TABLE enrollments_new RENAME TO enrollments;

CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_action ON enrollments(action_id);
CREATE INDEX IF NOT EXISTS idx_enroll_updated ON enrollments(updated_at);

DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;
