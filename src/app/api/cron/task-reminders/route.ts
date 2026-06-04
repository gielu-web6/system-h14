import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Vercel Cron: 0 */3 * * * (every 3 hours)
// Sends in-app notifications for tasks pending 3+ hours without completion.

const USERS = ['adrian', 'maciek']

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    const todayIso = now.toISOString().split('T')[0]

    const results: Record<string, number> = {}

    for (const userId of USERS) {
      // Find pending tasks for this user created 3+ hours ago (due today or overdue)
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('assigned_to', userId)
        .eq('completed', false)
        .lte('due_date', todayIso)
        .lte('created_at', threeHoursAgo)

      const count = pendingTasks?.length ?? 0
      if (count === 0) { results[userId] = 0; continue }

      // Check if we already sent a reminder to this user in the last 2.5 hours
      // (to avoid spam between cron runs)
      const twoAndHalfHoursAgo = new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString()
      const { data: recentNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'task_reminder')
        .eq('user_id', userId)
        .gte('created_at', twoAndHalfHoursAgo)
        .limit(1)

      if (recentNotif && recentNotif.length > 0) {
        results[userId] = 0; continue
      }

      // Build message based on count
      const body = count === 1
        ? 'Pamiętaj, że czeka na Ciebie zadanie do zrobienia.'
        : `Pamiętaj, że czekają na Ciebie jeszcze ${count} ${count < 5 ? 'zadania' : 'zadań'} do zrobienia.`

      await supabase.from('notifications').insert({
        type: 'task_reminder',
        title: count === 1 ? 'Masz nieukończone zadanie' : `Masz ${count} nieukończonych zadań`,
        body,
        priority: count >= 3 ? 'high' : 'normal',
        user_id: userId,
        is_read: false,
      })

      results[userId] = count
    }

    return NextResponse.json({ ok: true, notified: results })
  } catch (err) {
    console.error('[cron/task-reminders]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
