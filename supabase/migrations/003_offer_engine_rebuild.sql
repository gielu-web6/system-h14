-- ============================================================
-- Migration 003: Offer Engine Rebuild
-- Adds columns for controlled AI generation, edit mode, and enhanced tracking
-- ============================================================

-- ── offer_pages: new columns ──────────────────────────────────────────────────

-- Status tracking (draft → sent → viewed → cta_clicked → accepted/rejected/expired)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- CTA interaction
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS cta_clicked     BOOLEAN    DEFAULT false;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS cta_clicked_at  TIMESTAMPTZ;

-- Offer version (for duplication/renegotiation)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Contact info
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Services selected by Adrian (controls what AI can use)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS selected_service_ids TEXT[] DEFAULT '{}';

-- Client problem (raw notes from Adrian's call)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS client_problem TEXT;

-- Project start date
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS project_start_date DATE;

-- Additional AI notes
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- FAQ items (client-facing Q&A, stored separately from objekcje)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS faq_items JSONB DEFAULT '[]';

-- Ensure these columns exist (may have been added directly to Supabase DB)
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS diagnoza_bolu        TEXT;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS objekcje             JSONB DEFAULT '[]';
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS payment_terms        TEXT;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS client_logo_url      TEXT;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS your_logo_url        TEXT;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS selected_modules     JSONB DEFAULT '[]';
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS meeting_notes        TEXT;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS expires_at           TIMESTAMPTZ;
ALTER TABLE offer_pages ADD COLUMN IF NOT EXISTS timeline_items       JSONB DEFAULT '[]';

-- ── offer_page_views: enhanced tracking columns ───────────────────────────────

-- Time spent on each section (seconds): { "hero": 12, "pricing": 187, ... }
ALTER TABLE offer_page_views ADD COLUMN IF NOT EXISTS time_on_sections JSONB DEFAULT '{}';

-- Scroll depth (0-100%)
ALTER TABLE offer_page_views ADD COLUMN IF NOT EXISTS scroll_depth INTEGER DEFAULT 0;

-- CTA click tracking
ALTER TABLE offer_page_views ADD COLUMN IF NOT EXISTS cta_clicked    BOOLEAN    DEFAULT false;
ALTER TABLE offer_page_views ADD COLUMN IF NOT EXISTS cta_clicked_at TIMESTAMPTZ;

-- Session ID (generated on client, stored in sessionStorage)
ALTER TABLE offer_page_views ADD COLUMN IF NOT EXISTS session_id TEXT;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_offer_pages_status      ON offer_pages(status);
CREATE INDEX IF NOT EXISTS idx_offer_pages_expires_at  ON offer_pages(expires_at);
CREATE INDEX IF NOT EXISTS idx_offer_page_views_session ON offer_page_views(session_id);
