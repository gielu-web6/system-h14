-- ============================================================
-- MIGRATION 005 — Change assigned_to to TEXT
-- UUID type is incompatible with localStorage-based user IDs.
-- Both columns dropped/recreated as TEXT.
-- ============================================================

ALTER TABLE public.leads DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE public.leads ADD COLUMN assigned_to TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS assigned_to TEXT;
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
