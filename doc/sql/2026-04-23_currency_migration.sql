-- Migration: switch default order currency to XAF for FCFA display
-- This keeps existing order amounts intact and only changes the default for new rows.

BEGIN;

ALTER TABLE IF EXISTS orders
  ALTER COLUMN currency_code SET DEFAULT 'XAF';

COMMIT;