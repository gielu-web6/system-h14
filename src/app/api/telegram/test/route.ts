import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramAlert } from '@/lib/telegram'

// Only admins should call this — checked via simple token in header or cookie
// In production: swap for Supabase Auth session check
export async function POST(req: NextRequest) {
  try {
    // Basic guard — require CRON_SECRET or any internal token
    const auth = req.headers.get('x-internal-token')
    if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await sendTelegramAlert({
      target: 'both',
      message: `🧪 <b>TEST ALERTU</b>

System H14 działa poprawnie.
📅 ${new Date().toLocaleString('pl-PL')}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[telegram/test]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
