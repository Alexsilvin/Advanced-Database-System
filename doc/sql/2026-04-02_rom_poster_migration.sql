-- Migration: Add ROM distribution and poster enrichment metadata
-- Date: 2026-04-02

BEGIN;

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS poster_source VARCHAR(30),
  ADD COLUMN IF NOT EXISTS poster_source_url TEXT,
  ADD COLUMN IF NOT EXISTS poster_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS poster_last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rom_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS rom_filename TEXT,
  ADD COLUMN IF NOT EXISTS rom_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS rom_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS license_type VARCHAR(40) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'license_type' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE games ALTER COLUMN license_type TYPE TEXT USING license_type::text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_games_downloadable ON games(is_downloadable);
CREATE INDEX IF NOT EXISTS idx_games_poster_source ON games(poster_source);

COMMIT;
