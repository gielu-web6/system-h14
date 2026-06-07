-- Add missing contact columns to deals table
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
