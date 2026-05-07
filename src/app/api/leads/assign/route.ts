import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

// Only admins should call this endpoint
export async function POST(req: NextRequest) {
  try {
    const { leadId, salesUserId } = await req.json()

    if (!leadId || !salesUserId) {
      return NextResponse.json({ error: 'leadId and salesUserId are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: lead, error } = await supabase
      .from('leads')
      .update({ assigned_to: salesUserId })
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await sendTelegramAlert({
      target: 'sales',
      message: `📋 <b>Nowy lead przypisany do Ciebie</b>

🏢 ${lead.company ?? '—'}
👤 ${lead.first_name ?? ''} ${lead.last_name ?? ''}
⭐ Score: ${lead.ai_score_num ?? '—'}/100

Sprawdź w systemie i zaplanuj kontakt.`,
    })

    return NextResponse.json({ ok: true, lead })
  } catch (err) {
    console.error('[leads/assign]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
