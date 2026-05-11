PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';
