PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apartments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  address TEXT,
  price REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  apartment_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value TEXT,
  note TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(apartment_id, question_id),
  FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  apartment_id TEXT NOT NULL,
  question_id TEXT,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_category_order
  ON questions(category_id, "order");
CREATE INDEX IF NOT EXISTS idx_question_options_question_order
  ON question_options(question_id, "order");
CREATE INDEX IF NOT EXISTS idx_answers_apartment
  ON answers(apartment_id);
CREATE INDEX IF NOT EXISTS idx_answers_question
  ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_photos_apartment
  ON photos(apartment_id);
