import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Vercel Cron: 0 9 * * 1 (Monday 9:00) — Alert 11: Company Brain not updated 30 days
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: lastEntry } = await supabase
      .from('company_brain')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastEntry?.updated_at) {
      await sendTelegramAlert({
        target: 'admin',
        message: `🧬 <b>COMPANY BRAIN — wymaga uwagi</b>

⚠️ Brak wpisów w Company Brain.

Zaplanuj aktualizację wiedzy systemu.`,
      })
      return NextResponse.json({ ok: true })
    }

    const daysSinceLastUpdate = Math.floor(
      (Date.now() - new Date(lastEntry.updated_at).getTime()) / 86400000,
    )

    if (daysSinceLastUpdate >= 30) {
      const lastUpdate = new Date(lastEntry.updated_at).toLocaleDateString('pl-PL')
      await sendTelegramAlert({
        target: 'admin',
        message: `🧬 <b>COMPANY BRAIN — wymaga uwagi</b>

⏱ Ostatnia aktualizacja: ${lastUpdate} (${daysSinceLastUpdate} dni temu)

Zaplanuj aktualizację wiedzy systemu.`,
      })
    }

    return NextResponse.json({ ok: true, daysSinceLastUpdate })
  } catch (err) {
    console.error('[cron/brain-check]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
