import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// GET /api/offers/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await getSupabaseAdmin()
      .from('offer_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Oferta nie znaleziona' }, { status: 404 })
    }

    return NextResponse.json({ offer: data })
  } catch (err) {
    console.error('[offers/[id] GET]', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// PATCH /api/offers/[id] — autosave partial updates
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    // Prevent overwriting status from draft/sent in a way that loses data
    const ALLOWED_FIELDS = new Set([
      'company_name', 'contact_name', 'project_type',
      'diagnoza_bolu', 'solution_description',
      'scope_items', 'timeline_items', 'objekcje', 'faq_items',
      'pricing_variants', 'payment_terms', 'expires_at', 'valid_until',
      'client_logo_url', 'your_logo_url', 'meeting_notes',
      'client_problem', 'project_start_date', 'additional_notes',
      'selected_service_ids', 'status', 'is_active',
    ])

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [key, val] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) patch[key] = val
    }

    const { data, error } = await getSupabaseAdmin()
      .from('offer_pages')
      .update(patch)
      .eq('id', id)
      .select('id, status, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, offer: data })
  } catch (err) {
    console.error('[offers/[id] PATCH]', err)
    return NextResponse.json({ error: 'Błąd zapisu' }, { status: 500 })
  }
}
