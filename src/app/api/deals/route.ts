import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Columns definitely in DB (from schema.sql)
const BASE_COLS = new Set(['title', 'value', 'stage', 'assigned_to', 'notes',
  'lead_id', 'project_type', 'diagnosis_notes', 'client_problem', 'service_ids'])

// Columns added by migration 008
const CONTACT_COLS = new Set(['contact_name', 'contact_email', 'contact_phone',
  'contact_position', 'contact_segment', 'last_contact_date', 'next_step',
  'project_scope', 'ai_score_label', 'ai_score_num'])

async function tryInsert(supabase: ReturnType<typeof getSupabaseAdmin>, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('deals').insert(payload).select().single()
  return { data, error }
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = getSupabaseAdmin()

  // Separate base columns from contact columns
  const basePayload: Record<string, unknown> = {}
  const contactPayload: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(body)) {
    if (BASE_COLS.has(k)) basePayload[k] = v
    else if (CONTACT_COLS.has(k)) contactPayload[k] = v
  }

  // Try with all fields first
  const fullPayload = { ...basePayload, ...contactPayload }
  const { data, error } = await tryInsert(supabase, fullPayload)

  if (!error) return NextResponse.json(data)

  // If contact columns don't exist yet, retry with base only
  if (error.message.includes('column') && error.message.includes('schema cache')) {
    const { data: data2, error: error2 } = await tryInsert(supabase, basePayload)
    if (!error2) return NextResponse.json(data2)
    return NextResponse.json({ error: error2.message }, { status: 500 })
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Try full update
  const { data, error } = await supabase.from('deals').update(updates).eq('id', id).select().single()
  if (!error) return NextResponse.json(data)

  // If contact columns missing, retry with base columns only
  if (error.message.includes('column') && error.message.includes('schema cache')) {
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => BASE_COLS.has(k))
    )
    const { data: data2, error: error2 } = await supabase.from('deals').update(safeUpdates).eq('id', id).select().single()
    if (!error2) return NextResponse.json(data2)
    return NextResponse.json({ error: error2.message }, { status: 500 })
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
