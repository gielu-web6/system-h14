import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 0 * * * * (every hour) — Alert 8: offer not opened 24h
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Window: sent between 24h-25h ago (so we alert once per offer)
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: unopenedOffers } = await supabase
      .from('offer_pages')
      .select('id, company_name, title, created_at')
      .lt('created_at', twentyFourHoursAgo)
      .gt('created_at', twentyFiveHoursAgo)
      .eq('status', 'sent')
      .is('last_viewed_at', null)

    for (const offer of unopenedOffers ?? []) {
      const sentAt = new Date(offer.created_at).toLocaleDateString('pl-PL')
      sendTelegramAlert({
        target: 'sales',
        message: `🕐 <b>OFERTA NIE OTWARTA — 24H</b>

👤 ${offer.company_name ?? '—'}
📄 ${offer.title ?? 'Oferta'}
📨 Wysłana: ${sentAt}

Wyślij follow-up: "Czy oferta dotarła?"`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, checked: unopenedOffers?.length ?? 0 })
  } catch (err) {
    console.error('[cron/offer-unopened-check]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
