import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 30 17 * * 1-5 (Mon–Fri 17:30)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const todayIso = new Date().toISOString().split('T')[0]
    const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    // Count outreach messages sent today
    const { count: outreachToday } = await supabase
      .from('outreach_messages')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', todayIso)
      .lt('sent_at', `${todayIso}T23:59:59`)

    // Meetings tomorrow
    const { count: tomorrowMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .gte('starts_at', tomorrowIso)
      .lt('starts_at', `${tomorrowIso}T23:59:59`)

    await sendTelegramAlert({
      target: 'sales',
      message: `🌆 <b>KONIEC DNIA — zaktualizuj kanban</b>

📤 Wysłane dziś outreach: ${outreachToday ?? 0} wiadomości

📅 Jutrzejsze spotkania: ${tomorrowMeetings ?? 0}

Zaktualizuj statusy w pipeline — nikt z dziś nie może być pominięty.`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/evening-reminder]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
