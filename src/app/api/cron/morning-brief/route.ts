import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 45 7 * * 1-5 (Mon–Fri 7:45)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toLocaleDateString('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const todayIso = new Date().toISOString().split('T')[0]

    // Leads without recent contact
    const { count: leadsToContact } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')

    // Top 3 hottest deals
    const { data: topDeals } = await supabase
      .from('deals')
      .select('title, ai_score_num, value')
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')
      .order('ai_score_num', { ascending: false })
      .limit(3)

    const top3 = (topDeals ?? [])
      .map((d, i) => `${i + 1}. ${d.title} — score ${d.ai_score_num ?? 0}/100`)
      .join('\n')

    // Meetings today
    const { count: meetingsToday } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .gte('starts_at', todayIso)
      .lt('starts_at', `${todayIso}T23:59:59`)

    // Pipeline totals
    const { count: activeDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')

    const { data: pipelineData } = await supabase
      .from('deals')
      .select('value')
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')

    const pipelineValue = (pipelineData ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0)

    // Briefs in parallel
    await Promise.all([
      sendTelegramAlert({
        target: 'sales',
        message: `☀️ <b>DZIEŃ DOBRY — ${today}</b>

📋 Aktywne deale: <b>${leadsToContact ?? 0}</b>

🔥 TOP 3 dziś:
${top3 || '— brak danych'}

📅 Spotkania: ${meetingsToday ?? 0}

Dobrej sprzedaży.`,
      }),

      sendTelegramAlert({
        target: 'admin',
        message: `📊 <b>STAN SYSTEMU — ${today}</b>

🏗 Pipeline aktywny: ${activeDeals ?? 0} dealów
💰 Wartość lejka: ${pipelineValue.toLocaleString('pl-PL')} PLN
👤 Dziś na spotkaniach: ${meetingsToday ?? 0}`,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/morning-brief]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
