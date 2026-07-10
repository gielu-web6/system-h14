-- ============================================================
-- Migration 010: Create allegro_products table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.allegro_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ,
  name                TEXT NOT NULL,
  thumbnail_url       TEXT,
  category            TEXT,
  sku                 TEXT,
  ean                 TEXT,
  supplier            TEXT,
  supplier_url        TEXT,
  purchase_price      NUMERIC(10,2),
  supplier_shipping   NUMERIC(10,2),
  target_price        NUMERIC(10,2),
  commission_pct      NUMERIC(5,2) DEFAULT 12,
  shipping_cost       NUMERIC(10,2),
  units_sold          INTEGER DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pomysl'
    CHECK (status IN ('pomysl','do_wystawienia','aktywny','wstrzymany','wyprzedany','wycofany')),
  offer_title         TEXT,
  offer_description   TEXT,
  allegro_url         TEXT,
  notes               TEXT
);

-- Enable RLS
ALTER TABLE public.allegro_products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "allegro_products_all" ON public.allegro_products
  FOR ALL USING (auth.role() = 'authenticated');
