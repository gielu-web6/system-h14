-- ============================================================
-- MIGRATION 004 — Sales role + RLS policies
-- Run via: supabase db push  OR  paste in Supabase SQL editor
-- ============================================================

-- ─── profiles table (create if not exists) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'sales')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add role to existing profiles table if it already exists without it
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'sales'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- ─── assigned_to columns ─────────────────────────────────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);

-- ─── Helper function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── RLS: leads ──────────────────────────────────────────────────────────────

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_leads"      ON public.leads;
DROP POLICY IF EXISTS "sales_own_leads"      ON public.leads;
DROP POLICY IF EXISTS "sales_insert_leads"   ON public.leads;
DROP POLICY IF EXISTS "sales_update_leads"   ON public.leads;

CREATE POLICY "admin_all_leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "sales_own_leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'sales'
    AND assigned_to::TEXT = auth.uid()::TEXT
  );

CREATE POLICY "sales_insert_leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() = 'sales'
    AND assigned_to::TEXT = auth.uid()::TEXT
  );

CREATE POLICY "sales_update_leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'sales'
    AND assigned_to::TEXT = auth.uid()::TEXT
  );

-- ─── RLS: deals ──────────────────────────────────────────────────────────────

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_deals" ON public.deals;
DROP POLICY IF EXISTS "sales_own_deals" ON public.deals;

CREATE POLICY "admin_all_deals" ON public.deals
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "sales_own_deals" ON public.deals
  FOR ALL TO authenticated
  USING (
    public.get_user_role() = 'sales'
    AND assigned_to::TEXT = auth.uid()::TEXT
  );

-- ─── RLS: offer_pages ────────────────────────────────────────────────────────

ALTER TABLE public.offer_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_offers"  ON public.offer_pages;
DROP POLICY IF EXISTS "sales_own_offers"  ON public.offer_pages;

CREATE POLICY "admin_all_offers" ON public.offer_pages
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "sales_own_offers" ON public.offer_pages
  FOR ALL TO authenticated
  USING (
    public.get_user_role() = 'sales'
    AND created_by::TEXT = auth.uid()::TEXT
  );

-- ─── RLS: finances (admin only) ──────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'income'
  ) THEN
    ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "admin_only_income" ON public.income;
    CREATE POLICY "admin_only_income" ON public.income
      FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "admin_only_expenses" ON public.expenses;
    CREATE POLICY "admin_only_expenses" ON public.expenses
      FOR ALL TO authenticated
      USING (public.get_user_role() = 'admin');
  END IF;
END $$;

-- ─── RLS: company_brain ──────────────────────────────────────────────────────

ALTER TABLE public.company_brain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_brain" ON public.company_brain;
DROP POLICY IF EXISTS "sales_read_dna"  ON public.company_brain;

CREATE POLICY "admin_all_brain" ON public.company_brain
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- Sales can read DNA chunks (needed for message generation)
CREATE POLICY "sales_read_dna" ON public.company_brain
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'sales'
    AND type = 'dna'
  );
