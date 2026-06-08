import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { calculateDNACompleteness } from '@/app/api/company-brain/sync/route'

// Columns known to exist in the current DB schema
const KNOWN_COLS = new Set([
  'company_name', 'company_tagline', 'company_description', 'founded_year',
  'team_size', 'location', 'services', 'core_usp', 'secondary_usps',
  'price_range_min', 'price_range_max', 'avg_ticket', 'deal_below_which_skip',
  'icp_description', 'icp_company_size', 'icp_revenue_min', 'icp_industry',
  'icp_decision_maker', 'icp_pain_points', 'icp_goals', 'icp_buying_triggers',
  'icp_red_flags', 'sales_process', 'avg_sales_cycle_days', 'close_rate_percent',
  'avg_followups_to_close', 'top_objections', 'competitive_advantages',
  'main_competitors', 'content_archetype', 'content_tone', 'content_vocabulary',
  'content_avoid', 'content_pillars', 'posting_channels', 'posting_frequency',
  'case_studies', 'testimonials', 'founder_voice', 'dna_score',
  // Extra cols that may or may not exist — will be stripped on error
  'brand_words', 'brand_avoid_words', 'monthly_revenue_target',
  'monthly_revenue_current', 'quarterly_deals_target',
  'current_clients_count', 'target_clients_count',
])

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('company_dna')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ dna: data })
  } catch (err) {
    console.error('GET /api/company-brain/dna error:', err)
    return NextResponse.json({ error: 'Błąd pobierania DNA' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('company_dna')
      .select('id')
      .limit(1)
      .maybeSingle()

    const completeness = calculateDNACompleteness(body as Record<string, unknown>)

    // Build payload: strip unknown/system columns, use dna_score not completeness_score
    const payload: Record<string, unknown> = { dna_score: completeness }
    for (const [k, v] of Object.entries(body)) {
      if (k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'completeness_score' && KNOWN_COLS.has(k)) {
        payload[k] = v
      }
    }

    const save = async (p: Record<string, unknown>) => {
      if (existing?.id) {
        return supabase.from('company_dna').update(p).eq('id', existing.id).select().single()
      }
      return supabase.from('company_dna').insert(p).select().single()
    }

    let { data: result, error } = await save(payload)

    // If some extra columns don't exist yet, retry with only KNOWN_COLS base set
    if (error && error.message.includes('column') && error.message.includes('schema cache')) {
      const safePayload: Record<string, unknown> = { dna_score: completeness }
      const BASE = new Set(['company_name','company_tagline','company_description','founded_year','team_size','location','services','core_usp','secondary_usps','price_range_min','price_range_max','avg_ticket','deal_below_which_skip','icp_description','icp_company_size','icp_revenue_min','icp_industry','icp_decision_maker','icp_pain_points','icp_goals','icp_buying_triggers','icp_red_flags','sales_process','avg_sales_cycle_days','close_rate_percent','avg_followups_to_close','top_objections','competitive_advantages','main_competitors','content_archetype','content_tone','content_vocabulary','content_avoid','content_pillars','posting_channels','posting_frequency','case_studies','testimonials','founder_voice'])
      for (const [k, v] of Object.entries(body)) {
        if (BASE.has(k)) safePayload[k] = v
      }
      const res2 = await save(safePayload)
      result = res2.data
      error = res2.error
    }

    if (error) throw error
    return NextResponse.json({ dna: result })
  } catch (err) {
    console.error('PUT /api/company-brain/dna error:', err)
    return NextResponse.json({ error: 'Błąd zapisu DNA' }, { status: 500 })
  }
}
