import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

type NotifyType = 'won' | 'big_deal' | 'lost'

interface NotifyBody {
  type: NotifyType
  dealId: string
  company: string
  value?: number
  stage?: string
  assignedTo?: string
  lostReason?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: NotifyBody = await req.json()
    const { type, dealId, company, value, stage, assignedTo, lostReason } = body

    // Alert 4 — deal won
    if (type === 'won') {
      await sendTelegramAlert({
        target: 'admin',
        message: `🏆 <b>DEAL ZAMKNIĘTY!</b>

🏢 ${company}
💵 ${value ? value.toLocaleString('pl-PL') : '—'} PLN
👤 Handlowiec: ${assignedTo || 'AM Automations'}
📅 ${new Date().toLocaleDateString('pl-PL')}

GG WP.`,
      })
    }

    // Alert 9 — big deal (>= 15 000 PLN)
    if (type === 'big_deal' && value && value >= 15000) {
      await sendTelegramAlert({
        target: 'admin',
        message: `🚨 <b>DUŻY DEAL</b>

🏢 ${company}
💵 ${value.toLocaleString('pl-PL')} PLN
📍 Etap: ${stage || '—'}
👤 Handlowiec: ${assignedTo || 'AM Automations'}

Rozważ dołączenie do rozmowy.`,
      })
    }

    // Alert 10 — objection pattern (3x same reason in 30 days)
    if (type === 'lost' && lostReason && dealId) {
      const supabase = getSupabaseAdmin()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { count } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'przegrana')
        .eq('lost_reason', lostReason)
        .gte('lost_at', thirtyDaysAgo)

      if ((count ?? 0) >= 3) {
        await sendTelegramAlert({
          target: 'admin',
          message: `🧠 <b>PATTERN OBIEKCJI WYKRYTY</b>

❌ Powód: "${lostReason}"
🔢 Wystąpienia (30 dni): ${count}x

Zaktualizuj Bank Obiekcji i rozważ nową strategię.`,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[deals/notify]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
