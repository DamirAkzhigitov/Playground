ALTER TABLE listings ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_listings_public ON listings(is_public);
