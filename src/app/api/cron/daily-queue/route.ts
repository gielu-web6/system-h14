import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// App users (localStorage-based auth, not Supabase Auth)
const APP_USERS = ['adrian', 'maciek']

export async function GET() {
  try {
    // Count active leads with high score
    const { count: leadCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('app_status', ['nowy', 'kontakt', 'zainteresowany'])
      .gte('ai_score_num', 50)

    const today = new Date().toISOString().split('T')[0]

    for (const userId of APP_USERS) {
      if (leadCount && leadCount > 0) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          type: 'daily_tasks',
          title: `Dzisiejsze zadania: ${leadCount} leadów do kontaktu`,
          body: 'Otwórz Outreach Queue żeby zobaczyć kolejkę.',
          priority: 'normal',
          is_read: false,
        })
      }

      // Check reengagement dates for this user's deals
      const { data: reengagements } = await supabaseAdmin
        .from('deals')
        .select('id, title')
        .eq('user_id', userId)
        .eq('reengagement_date', today)

      if (reengagements?.length) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          type: 'reengagement',
          title: `${reengagements.length} deal${reengagements.length > 1 ? 'i' : ''} do re-engagement dziś`,
          body: reengagements.map((d) => d.title).join(', '),
          priority: 'high',
          is_read: false,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/daily-queue]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
