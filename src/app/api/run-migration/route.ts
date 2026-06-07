import { NextResponse } from 'next/server'
import { Client } from 'pg'

const SQL = `
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
    return NextResponse.json({ ok: true, message: 'Migration applied — deals table updated!' })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await client.end()
  }
}
