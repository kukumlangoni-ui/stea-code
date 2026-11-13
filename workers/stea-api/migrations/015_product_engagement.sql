-- Product social-proof counters (Dribbble/Behance-style card metrics).
--
-- views: incremented once per session per product by the client (sessionStorage
-- dedupe). likes: public, anonymous likes tracked client-side in localStorage;
-- the Worker only increments/decrements the count.
--
-- Both are defensively defaulted to 0 so pre-existing rows render "0" rather
-- than NULL. The engagement routes wrap their UPDATEs in try/catch, so a product
-- deployed before this migration still loads (counters just stay 0).
ALTER TABLE products ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
