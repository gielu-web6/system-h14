import { NextResponse } from 'next/server'
import { Client } from 'pg'

const SQL = `
  -- deals: add missing contact columns
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_name     TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_email    TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_phone    TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_position TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_segment  TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_contact_date DATE;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step        TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_scope    TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_score_label   TEXT DEFAULT 'warm';
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_score_num     INTEGER DEFAULT 50;

  -- context_files table for Company Brain
  CREATE TABLE IF NOT EXISTS context_files (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name     TEXT NOT NULL,
    filename          TEXT NOT NULL,
    file_type         TEXT NOT NULL DEFAULT 'text',
    category          TEXT NOT NULL DEFAULT 'general',
    description       TEXT,
    priority          INTEGER NOT NULL DEFAULT 1,
    tags              TEXT[] DEFAULT '{}',
    raw_text          TEXT,
    file_size_bytes   INTEGER DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (processing_status IN ('pending','processing','done','error')),
    processing_error  TEXT,
    chunks_count      INTEGER DEFAULT 0,
    processed_at      TIMESTAMPTZ,
    summary           TEXT,
    key_facts         JSONB DEFAULT '[]',
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE context_files ENABLE ROW LEVEL SECURITY;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='context_files' AND policyname='Full access context_files') THEN
      CREATE POLICY "Full access context_files" ON context_files FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
  END $$;

  -- company_dna table for Company Brain
  CREATE TABLE IF NOT EXISTS company_dna (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name             TEXT DEFAULT '',
    company_tagline          TEXT DEFAULT '',
    company_description      TEXT DEFAULT '',
    founded_year             TEXT DEFAULT '',
    team_size                TEXT DEFAULT '',
    location                 TEXT DEFAULT '',
    services                 JSONB DEFAULT '[]',
    core_usp                 TEXT DEFAULT '',
    secondary_usps           TEXT[] DEFAULT '{}',
    price_range_min          TEXT DEFAULT '',
    price_range_max          TEXT DEFAULT '',
    avg_ticket               TEXT DEFAULT '',
    deal_below_which_skip    TEXT DEFAULT '',
    icp_description          TEXT DEFAULT '',
    icp_company_size         TEXT DEFAULT '',
    icp_revenue_min          TEXT DEFAULT '',
    icp_industry             TEXT[] DEFAULT '{}',
    icp_decision_maker       TEXT DEFAULT '',
    icp_pain_points          TEXT[] DEFAULT '{}',
    icp_goals                TEXT[] DEFAULT '{}',
    icp_buying_triggers      TEXT[] DEFAULT '{}',
    icp_red_flags            TEXT[] DEFAULT '{}',
    sales_process            JSONB DEFAULT '[]',
    avg_sales_cycle_days     TEXT DEFAULT '',
    close_rate_percent       TEXT DEFAULT '',
    avg_followups_to_close   TEXT DEFAULT '',
    top_objections           JSONB DEFAULT '[]',
    competitive_advantages   TEXT[] DEFAULT '{}',
    main_competitors         JSONB DEFAULT '[]',
    content_archetype        TEXT DEFAULT '',
    content_tone             TEXT DEFAULT '',
    content_vocabulary       TEXT[] DEFAULT '{}',
    content_avoid            TEXT[] DEFAULT '{}',
    content_pillars          TEXT[] DEFAULT '{}',
    posting_channels         TEXT[] DEFAULT '{}',
    posting_frequency        TEXT DEFAULT '',
    case_studies             JSONB DEFAULT '[]',
    testimonials             JSONB DEFAULT '[]',
    founder_voice            TEXT DEFAULT '',
    brand_words              TEXT[] DEFAULT '{}',
    brand_avoid_words        TEXT[] DEFAULT '{}',
    monthly_revenue_target   TEXT DEFAULT '',
    monthly_revenue_current  TEXT DEFAULT '',
    quarterly_deals_target   TEXT DEFAULT '',
    current_clients_count    TEXT DEFAULT '',
    target_clients_count     TEXT DEFAULT '',
    completeness_score       INTEGER DEFAULT 0,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE company_dna ENABLE ROW LEVEL SECURITY;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='company_dna' AND policyname='Full access company_dna') THEN
      CREATE POLICY "Full access company_dna" ON company_dna FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
  END $$;
`

export async function GET() {
  // Try multiple env var formats (Vercel-Supabase integration injects these)
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL

  if (!connectionString) {
    return NextResponse.json({ error: 'No DB connection string in env (POSTGRES_URL_NON_POOLING / DATABASE_URL)' }, { status: 500 })
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query(SQL)
    return NextResponse.json({ ok: true, message: 'Migration applied — deals + company_brain tables updated!' })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await client.end()
  }
}
