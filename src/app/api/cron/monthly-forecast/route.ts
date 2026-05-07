import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 0 9 1 * * (1st of each month 9:00)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: activeDeals } = await supabase
      .from('deals')
      .select('value, stage, expected_close_date')
      .not('stage', 'in', '("wygrana","przegrana","nie_teraz")')

    const now = Date.now()
    const d30 = now + 30 * 86400000
    const d60 = now + 60 * 86400000
    const d90 = now + 90 * 86400000

    // Close-probability weights per stage
    const STAGE_PROB: Record<string, number> = {
      nowy_lead: 0.05,
      dm_wyslany: 0.10,
      odpowiedz: 0.15,
      rozmowa_umowiona: 0.25,
      diagnoza_zrobiona: 0.40,
      oferta_prezentowana: 0.60,
      negocjacje: 0.75,
    }

    let forecast30 = 0
    let forecast60 = 0
    let forecast90 = 0

    for (const deal of activeDeals ?? []) {
      const value = deal.value ?? 0
      const prob = STAGE_PROB[deal.stage] ?? 0.1
      const expected = deal.expected_close_date ? new Date(deal.expected_close_date).getTime() : d60

      if (expected <= d30) forecast30 += value * prob
      if (expected <= d60) forecast60 += value * prob
      if (expected <= d90) forecast90 += value * prob
    }

    const MONTHLY_GOAL = 25000

    await sendTelegramAlert({
      target: 'admin',
      message: `🗓 <b>PROGNOZA FINANSOWA</b>

📊 Przy obecnym lejku:
• 30 dni: ${Math.round(forecast30).toLocaleString('pl-PL')} PLN
• 60 dni: ${Math.round(forecast60).toLocaleString('pl-PL')} PLN
• 90 dni: ${Math.round(forecast90).toLocaleString('pl-PL')} PLN

🎯 Cel miesięczny: ${MONTHLY_GOAL.toLocaleString('pl-PL')} PLN
${forecast30 < MONTHLY_GOAL
  ? `⚠️ Brakuje: ${(MONTHLY_GOAL - Math.round(forecast30)).toLocaleString('pl-PL')} PLN`
  : '✅ Cel w zasięgu'}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/monthly-forecast]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
