-- 005_gallery.sql
-- Add a gallery column to products. Gallery is a JSON array of up to 10
-- image URLs (first image = cover). Stored as TEXT JSON.
-- NOTE: SQLite has no "ADD COLUMN IF NOT EXISTS". This migration is applied
-- once; guard at execution time by checking pragma_table_info first.
ALTER TABLE products ADD COLUMN gallery TEXT DEFAULT '[]';
