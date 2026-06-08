-- ============================================================
-- Migration 009: Create company_dna and context_files tables
-- ============================================================

-- ─── context_files ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS context_files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name     TEXT NOT NULL,
  filename          TEXT NOT NULL,
  file_type         TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'general',
  description       TEXT,
  priority          INTEGER NOT NULL DEFAULT 1,
  tags              TEXT[] DEFAULT '{}',
  raw_text          TEXT,
  file_size_bytes   INTEGER DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'done', 'error')),
  processing_error  TEXT,
  chunks_count      INTEGER DEFAULT 0,
  processed_at      TIMESTAMPTZ,
  summary           TEXT,
  key_facts         JSONB DEFAULT '[]',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY IF NOT EXISTS "Full access context_files" ON context_files
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE context_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_context_files_status   ON context_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_context_files_category ON context_files(category);
CREATE INDEX IF NOT EXISTS idx_context_files_active   ON context_files(is_active);

-- ─── company_dna ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_dna (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basics
  company_name             TEXT DEFAULT '',
  company_tagline          TEXT DEFAULT '',
  company_description      TEXT DEFAULT '',
  founded_year             TEXT DEFAULT '',
  team_size                TEXT DEFAULT '',
  location                 TEXT DEFAULT '',

  -- Services
  services                 JSONB DEFAULT '[]',
  core_usp                 TEXT DEFAULT '',
  secondary_usps           TEXT[] DEFAULT '{}',
  price_range_min          TEXT DEFAULT '',
  price_range_max          TEXT DEFAULT '',
  avg_ticket               TEXT DEFAULT '',
  deal_below_which_skip    TEXT DEFAULT '',

  -- ICP
  icp_description          TEXT DEFAULT '',
  icp_company_size         TEXT DEFAULT '',
  icp_revenue_min          TEXT DEFAULT '',
  icp_industry             TEXT[] DEFAULT '{}',
  icp_decision_maker       TEXT DEFAULT '',
  icp_pain_points          TEXT[] DEFAULT '{}',
  icp_goals                TEXT[] DEFAULT '{}',
  icp_buying_triggers      TEXT[] DEFAULT '{}',
  icp_red_flags            TEXT[] DEFAULT '{}',

  -- Sales
  sales_process            JSONB DEFAULT '[]',
  avg_sales_cycle_days     TEXT DEFAULT '',
  close_rate_percent       TEXT DEFAULT '',
  avg_followups_to_close   TEXT DEFAULT '',
  top_objections           JSONB DEFAULT '[]',
  competitive_advantages   TEXT[] DEFAULT '{}',
  main_competitors         JSONB DEFAULT '[]',

  -- Content
  content_archetype        TEXT DEFAULT '',
  content_tone             TEXT DEFAULT '',
  content_vocabulary       TEXT[] DEFAULT '{}',
  content_avoid            TEXT[] DEFAULT '{}',
  content_pillars          TEXT[] DEFAULT '{}',
  posting_channels         TEXT[] DEFAULT '{}',
  posting_frequency        TEXT DEFAULT '',

  -- Proof
  case_studies             JSONB DEFAULT '[]',
  testimonials             JSONB DEFAULT '[]',
  founder_voice            TEXT DEFAULT '',
  brand_words              TEXT[] DEFAULT '{}',
  brand_avoid_words        TEXT[] DEFAULT '{}',

  -- Metrics
  monthly_revenue_target   TEXT DEFAULT '',
  monthly_revenue_current  TEXT DEFAULT '',
  quarterly_deals_target   TEXT DEFAULT '',
  current_clients_count    TEXT DEFAULT '',
  target_clients_count     TEXT DEFAULT '',

  -- Meta
  completeness_score       INTEGER DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Full access company_dna" ON company_dna
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
