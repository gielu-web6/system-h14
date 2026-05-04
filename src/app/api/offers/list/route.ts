import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: offersRaw, error } = await supabase
      .from('offer_pages')
      .select(
        'id, public_slug, company_name, project_type, status, created_at, expires_at, ' +
        'view_count, last_viewed_at, cta_clicked, cta_clicked_at, accepted_at, ' +
        'pricing_variants, selected_service_ids, contact_name, version, is_active',
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    const offers = offersRaw ?? []

    // Aggregate time_on_sections from offer_page_views for each offer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offerIds = offers.map((o: any) => o.id as string)

    let pricingTimeMap: Record<string, number> = {}

    if (offerIds.length > 0) {
      const { data: views } = await supabase
        .from('offer_page_views')
        .select('offer_page_id, time_on_sections')
        .in('offer_page_id', offerIds)
        .not('time_on_sections', 'is', null)

      pricingTimeMap = (views ?? []).reduce<Record<string, number>>((acc, v) => {
        const sections = v.time_on_sections as Record<string, number> | null
        if (!sections) return acc
        const t = Number(sections['pricing'] ?? 0)
        acc[v.offer_page_id] = (acc[v.offer_page_id] ?? 0) + t
        return acc
      }, {})
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = offers.map((o: any) => ({
      ...o,
      time_on_pricing: pricingTimeMap[o.id] ?? 0,
      effective_status: computeStatus(o),
    }))

    return NextResponse.json({ offers: result })
  } catch (err) {
    console.error('[offers/list]', err)
    return NextResponse.json({ error: 'Błąd pobierania ofert' }, { status: 500 })
  }
}

function computeStatus(offer: {
  accepted_at?: string | null
  expires_at?: string | null
  cta_clicked?: boolean | null
  view_count?: number | null
  status?: string | null
}): string {
  if (offer.accepted_at) return 'accepted'
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return 'expired'
  if (offer.cta_clicked) return 'cta_clicked'
  if ((offer.view_count ?? 0) > 0) return 'viewed'
  if (offer.status === 'sent') return 'sent'
  return 'draft'
}
