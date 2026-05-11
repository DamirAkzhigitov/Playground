PRAGMA foreign_keys = ON;

ALTER TABLE apartments ADD COLUMN template_slug TEXT;

ALTER TABLE categories ADD COLUMN apartment_id TEXT REFERENCES apartments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_apartment ON categories(apartment_id);

ALTER TABLE questions ADD COLUMN apartment_id TEXT REFERENCES apartments(id) ON DELETE CASCADE;
ALTER TABLE questions ADD COLUMN stable_key TEXT;
CREATE INDEX IF NOT EXISTS idx_questions_apartment ON questions(apartment_id);
