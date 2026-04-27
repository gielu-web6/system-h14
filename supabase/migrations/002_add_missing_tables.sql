-- ============================================================
-- Migration 002: Add all missing tables + fix RLS + AI scoring columns
-- ============================================================

-- ============================================================
-- FIX RLS: allow anon role (app uses localStorage auth, not Supabase Auth)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated full access" ON leads;
DROP POLICY IF EXISTS "Authenticated full access" ON deals;
DROP POLICY IF EXISTS "Authenticated full access" ON outreach_messages;
DROP POLICY IF EXISTS "Authenticated full access" ON call_scripts;
DROP POLICY IF EXISTS "Authenticated full access" ON content_calendar;
DROP POLICY IF EXISTS "Authenticated full access" ON content_templates;
DROP POLICY IF EXISTS "Authenticated full access" ON income;
DROP POLICY IF EXISTS "Authenticated full access" ON expenses;

CREATE POLICY "Full access" ON leads               FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON deals               FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON outreach_messages   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON call_scripts        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON content_calendar    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON content_templates   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON income              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access" ON expenses            FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- LEADS: missing columns (idempotent with IF NOT EXISTS)
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city             TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_url    TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact     DATE DEFAULT CURRENT_DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scan_data        TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS outreach_history JSONB DEFAULT '[]';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_ids      TEXT[] DEFAULT '{}';

-- AI scoring (basic)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_num   INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_label TEXT    DEFAULT 'warm'
  CHECK (ai_score_label IN ('hot', 'warm', 'cold'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS app_status TEXT DEFAULT 'nowy'
  CHECK (app_status IN ('nowy', 'kontakt', 'zainteresowany', 'pipeline', 'nieaktywny'));

-- AI scoring (per-criteria — eliminates fake approximation in UI)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_icp_score      INTEGER DEFAULT 0 CHECK (ai_icp_score      BETWEEN 0 AND 25);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_signals_score  INTEGER DEFAULT 0 CHECK (ai_signals_score  BETWEEN 0 AND 25);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_activity_score INTEGER DEFAULT 0 CHECK (ai_activity_score BETWEEN 0 AND 25);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_potential_score INTEGER DEFAULT 0 CHECK (ai_potential_score BETWEEN 0 AND 25);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_reasoning  TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_scored_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_ai_score_num  ON leads(ai_score_num DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ai_scored_at  ON leads(ai_scored_at);
CREATE INDEX IF NOT EXISTS idx_leads_app_status    ON leads(app_status);

-- ============================================================
-- DEALS: missing columns
-- ============================================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id         TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS heat_score      INTEGER DEFAULT 0 CHECK (heat_score      BETWEEN 0 AND 100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_hot          BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hot_reason      TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS service_ids     TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_deals_heat_score   ON deals(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_id      ON deals(user_id);

-- ============================================================
-- TABLE: company_profile
-- ============================================================

CREATE TABLE IF NOT EXISTS company_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  company_name          TEXT NOT NULL DEFAULT 'AM Automations',
  tagline               TEXT,
  description           TEXT,
  problems_solved       TEXT,
  usp                   TEXT,

  target_client         TEXT,
  icp_industry          TEXT,
  icp_company_size      TEXT,
  icp_role              TEXT,

  services              JSONB DEFAULT '[]',

  website_url           TEXT,
  linkedin_company_url  TEXT,
  linkedin_personal_url TEXT,
  instagram_url         TEXT,
  facebook_url          TEXT,
  other_links           TEXT,

  tone_of_voice         TEXT,
  case_studies          TEXT,
  objections            TEXT
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON company_profile FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  user_id  TEXT,
  deal_id  UUID REFERENCES deals(id)  ON DELETE CASCADE,
  lead_id  UUID REFERENCES leads(id)  ON DELETE CASCADE,

  type     TEXT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  is_read  BOOLEAN DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- TABLE: user_profiles (maps localStorage user IDs → names)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  full_name  TEXT,
  company    TEXT DEFAULT 'AM Automations',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON user_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO user_profiles (id, name, full_name) VALUES
  ('adrian', 'Adrian', 'Adrian'),
  ('maciek', 'Maciek', 'Maciek'),
  ('demo',   'Demo',   'Demo')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLE: offer_pages (public offer pages sent to clients)
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_pages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  deal_id     UUID REFERENCES deals(id) ON DELETE CASCADE,
  public_slug TEXT UNIQUE NOT NULL,

  company_name          TEXT NOT NULL,
  project_type          TEXT,
  solution_description  TEXT,

  daily_loss_amount    DECIMAL(10,2),
  monthly_loss_amount  DECIMAL(10,2),
  yearly_loss_amount   DECIMAL(10,2),
  roi_months           INTEGER,

  pricing_variants JSONB DEFAULT '[]',
  timeline         JSONB DEFAULT '[]',
  scope_items      JSONB DEFAULT '[]',

  view_count     INTEGER    DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  sections_viewed JSONB     DEFAULT '{}',

  accepted_at      TIMESTAMPTZ,
  accepted_variant TEXT,

  is_active BOOLEAN DEFAULT true
);

ALTER TABLE offer_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON offer_pages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_offer_pages_slug    ON offer_pages(public_slug);
CREATE INDEX IF NOT EXISTS idx_offer_pages_deal_id ON offer_pages(deal_id);

-- ============================================================
-- TABLE: offer_page_views
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_page_views (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  offer_page_id UUID REFERENCES offer_pages(id) ON DELETE CASCADE,
  ip_address    TEXT,
  user_agent    TEXT,

  duration_seconds      INTEGER DEFAULT 0,
  sections_viewed       TEXT[]  DEFAULT '{}',
  slider_interactions   INTEGER DEFAULT 0,
  roi_calculator_used   BOOLEAN DEFAULT false,
  pricing_variant_viewed TEXT
);

ALTER TABLE offer_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON offer_page_views FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_offer_page_views_page_id ON offer_page_views(offer_page_id);

-- ============================================================
-- TABLE: offer_tracking_events (for heat score cron)
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_tracking_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  deal_id       UUID REFERENCES deals(id)       ON DELETE CASCADE,
  offer_page_id UUID REFERENCES offer_pages(id) ON DELETE CASCADE,

  event_type TEXT  NOT NULL,
  data       JSONB DEFAULT '{}'
);

ALTER TABLE offer_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON offer_tracking_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_offer_tracking_deal_id ON offer_tracking_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_offer_tracking_created ON offer_tracking_events(created_at DESC);

-- ============================================================
-- TABLE: cs_clients (Content Studio — one row per managed client)
-- ============================================================

CREATE TABLE IF NOT EXISTS cs_clients (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  business_name    TEXT NOT NULL,
  industry         TEXT,
  target_audience  TEXT,
  brand_voice      TEXT,

  -- JSON: { instagram: { token, account_id }, facebook: { token, page_id }, linkedin: { token, organization_id } }
  social_accounts  JSONB DEFAULT '{}',

  brand_colors     TEXT[],
  logo_url         TEXT,

  posting_frequency TEXT,
  content_pillars   TEXT[],

  is_active BOOLEAN DEFAULT true,
  notes     TEXT
);

ALTER TABLE cs_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON cs_clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABLE: cs_posts (Content Studio scheduled posts)
-- ============================================================

CREATE TABLE IF NOT EXISTS cs_posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  client_id UUID REFERENCES cs_clients(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),

  caption   TEXT,
  hashtags  TEXT[] DEFAULT '{}',

  generated_image_url TEXT,
  final_image_url     TEXT,
  source_photo_url    TEXT,

  status       TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  publish_external_id TEXT,
  publish_error       TEXT,

  topic             TEXT,
  generation_prompt TEXT
);

ALTER TABLE cs_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access" ON cs_posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cs_posts_client_id  ON cs_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_cs_posts_status     ON cs_posts(status);
CREATE INDEX IF NOT EXISTS idx_cs_posts_scheduled  ON cs_posts(scheduled_at);
