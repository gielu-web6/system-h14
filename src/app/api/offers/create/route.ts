import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

export const maxDuration = 30

interface PricingVariant {
  name: string
  price: number
  features: string[]
  is_recommended: boolean
  description?: string
  ai_match_reason?: string
}

interface ScopeItem {
  text: string
  included: boolean
}

interface TimelineItem {
  week: string
  name: string
  description?: string
  date_start?: string
  date_end?: string
}

interface Objekcja {
  zarzut: string
  odpowiedz: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      // Client
      company_name: string
      contact_name?: string
      client_logo_url?: string
      your_logo_url?: string
      your_company_name?: string

      // Project info
      project_type?: string
      selected_service_ids?: string[]
      client_problem?: string
      project_start_date?: string | null
      additional_notes?: string | null

      // AI-generated content
      diagnoza_bolu: string
      solution_description: string
      scope_items: ScopeItem[]
      timeline_items: TimelineItem[]
      objekcje: Objekcja[]
      pricing_variants: PricingVariant[]

      // Financial (legacy — kept for backward compat)
      daily_loss_amount?: number
      monthly_loss_amount?: number
      yearly_loss_amount?: number
      roi_months?: number | null
      payment_terms?: string

      // Metadata
      selected_modules?: Array<{ id: string; label: string; price: number; desc: string }>
      meeting_notes?: string
      expires_days?: number
      valid_until?: string | null
      status?: string
    }

    if (!body.company_name?.trim()) {
      return NextResponse.json({ error: 'company_name jest wymagane' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const slug = nanoid(10)

    let expiresAt: string
    if (body.valid_until) {
      expiresAt = new Date(body.valid_until).toISOString()
    } else {
      const d = new Date()
      d.setDate(d.getDate() + (body.expires_days ?? 21))
      expiresAt = d.toISOString()
    }

    const { data, error } = await supabase
      .from('offer_pages')
      .insert({
        public_slug: slug,
        is_active: true,
        status: body.status ?? 'sent',

        // Client
        company_name: body.company_name,
        contact_name: body.contact_name ?? null,
        client_logo_url: body.client_logo_url ?? null,
        your_logo_url: body.your_logo_url ?? null,

        // Project
        project_type: body.project_type ?? null,
        selected_service_ids: body.selected_service_ids ?? [],
        client_problem: body.client_problem ?? null,
        project_start_date: body.project_start_date ?? null,
        additional_notes: body.additional_notes ?? null,

        // AI content
        diagnoza_bolu: body.diagnoza_bolu,
        solution_description: body.solution_description,
        scope_items: body.scope_items ?? [],
        timeline_items: body.timeline_items ?? [],
        objekcje: body.objekcje ?? [],
        pricing_variants: body.pricing_variants ?? [],

        // Financial (legacy)
        daily_loss_amount: body.daily_loss_amount ?? 0,
        monthly_loss_amount: body.monthly_loss_amount ?? 0,
        yearly_loss_amount: body.yearly_loss_amount ?? 0,
        roi_months: body.roi_months ?? null,
        payment_terms: body.payment_terms ?? '20% zaliczka, 80% po wdrożeniu.',

        // Meta
        selected_modules: body.selected_modules ?? [],
        meeting_notes: body.meeting_notes ?? null,
        expires_at: expiresAt,
        view_count: 0,
      })
      .select('id, public_slug')
      .single()

    if (error) throw error

    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://am-automations-internal.vercel.app'}/offer/${slug}`
    return NextResponse.json({ slug, url, id: data.id })
  } catch (err) {
    console.error('[offers/create]', err)
    return NextResponse.json({ error: 'Błąd zapisu oferty' }, { status: 500 })
  }
}
