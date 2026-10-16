-- Subcategories for the Layout category only. All other products keep ''.
ALTER TABLE products ADD COLUMN subcategory TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(category, subcategory);
