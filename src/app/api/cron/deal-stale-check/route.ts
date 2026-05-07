import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 0 8 * * 1-5 (weekdays 8:00) — Alert 7: deal cooling
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: staleDeals } = await supabase
      .from('deals')
      .select('id, title, stage, updated_at')
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')
      .lt('updated_at', sevenDaysAgo)

    for (const deal of staleDeals ?? []) {
      const daysSince = Math.floor(
        (Date.now() - new Date(deal.updated_at).getTime()) / 86400000,
      )

      sendTelegramAlert({
        target: 'sales',
        message: `⚠️ <b>DEAL STYGNIE</b>

🏢 ${deal.title}
📍 Etap: ${deal.stage}
⏱ Brak aktywności od ${daysSince} dni

Wyślij follow-up. Historycznie ratuje 40% takich sytuacji.`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, checked: staleDeals?.length ?? 0 })
  } catch (err) {
    console.error('[cron/deal-stale-check]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
