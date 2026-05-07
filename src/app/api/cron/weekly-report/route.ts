import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 0 8 * * 1 (Monday 8:00)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: weeklyNewLeads },
      { count: weeklyMeetings },
      { data: wonDeals },
      { count: weeklyLost },
      { data: lostDeals },
    ] = await Promise.all([
      supabase.from('deals').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).gte('starts_at', sevenDaysAgo),
      supabase.from('deals').select('value').eq('stage', 'wygrana').gte('won_at', sevenDaysAgo),
      supabase.from('deals').select('*', { count: 'exact', head: true }).eq('stage', 'przegrana').gte('lost_at', sevenDaysAgo),
      supabase.from('deals').select('lost_reason').eq('stage', 'przegrana').gte('lost_at', sevenDaysAgo).not('lost_reason', 'is', null),
    ])

    const weeklyClosed = (wonDeals ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0)

    // Top objection this week
    const reasonCounts: Record<string, number> = {}
    for (const d of lostDeals ?? []) {
      if (d.lost_reason) reasonCounts[d.lost_reason] = (reasonCounts[d.lost_reason] ?? 0) + 1
    }
    const topObjection = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    await sendTelegramAlert({
      target: 'admin',
      message: `📈 <b>RAPORT TYGODNIOWY</b>

📥 Nowe deale: ${weeklyNewLeads ?? 0}
📅 Spotkania: ${weeklyMeetings ?? 0}
✅ Zamknięte: ${weeklyClosed.toLocaleString('pl-PL')} PLN
❌ Przegrane: ${weeklyLost ?? 0}

🔁 Najczęstsza obiekcja: ${topObjection}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/weekly-report]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
