PRAGMA foreign_keys = ON;

-- Better Auth core tables (@playground/auth-core)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'contributor', 'admin')),
  locale TEXT NOT NULL DEFAULT 'en'
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS session_userId_idx ON session(userId);
CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS account_userId_idx ON account(userId);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

-- Actions (templates). Published are public; drafts contributor-only.
CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  tags_json TEXT, -- JSON array of strings, e.g. '["finance","housing"]'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  locale TEXT NOT NULL DEFAULT 'en',
  author_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_slug ON actions(slug);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_author ON actions(author_id);

-- Steps belong to an action. order is 1-based position.
CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT,
  estimated_minutes INTEGER, -- optional, per design Q10
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
  UNIQUE(action_id, "order")
);

CREATE INDEX IF NOT EXISTS idx_steps_action_order ON steps(action_id, "order");

-- Informational requirements per step (MVP: stored, not enforced in progress)
CREATE TABLE IF NOT EXISTS step_requirements (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'task' CHECK (kind IN ('document', 'task', 'link')),
  details TEXT, -- e.g. url, description, filename hint
  "order" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_req_step ON step_requirements(step_id);

-- User enrollments into an action (multiple allowed per Q11)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_step_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
  FOREIGN KEY (last_step_id) REFERENCES steps(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_action ON enrollments(action_id);
CREATE INDEX IF NOT EXISTS idx_enroll_updated ON enrollments(updated_at);

-- Per-step progress within an enrollment. Note is per-step.
CREATE TABLE IF NOT EXISTS step_progress (
  enrollment_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  note TEXT,
  completed_at TEXT,
  PRIMARY KEY (enrollment_id, step_id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_enroll ON step_progress(enrollment_id);
