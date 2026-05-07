import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramAlert } from '@/lib/telegram'

// Calendly webhook payload (simplified — v2 format)
interface CalendlyPayload {
  event: string
  payload: {
    event_type?: { name?: string }
    invitee?: {
      name?: string
      email?: string
      text_reminder_number?: string
      questions_and_answers?: Array<{ question: string; answer: string }>
    }
    scheduled_event?: {
      start_time?: string
      end_time?: string
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CalendlyPayload = await req.json()

    // Only handle booking created events
    if (body.event !== 'invitee.created') {
      return NextResponse.json({ ok: true })
    }

    const invitee = body.payload?.invitee ?? {}
    const scheduledEvent = body.payload?.scheduled_event ?? {}

    const name = invitee.name ?? 'Nieznany'
    const email = invitee.email ?? '—'

    // Try to extract company from questions_and_answers
    const companyAnswer = invitee.questions_and_answers?.find(
      (q) => q.question.toLowerCase().includes('firma') || q.question.toLowerCase().includes('company'),
    )
    const company = companyAnswer?.answer ?? '—'

    let date = '—'
    let time = '—'
    if (scheduledEvent.start_time) {
      const dt = new Date(scheduledEvent.start_time)
      date = dt.toLocaleDateString('pl-PL')
      time = dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    }

    await sendTelegramAlert({
      target: 'sales',
      message: `📅 <b>NOWE SPOTKANIE</b>

👤 ${name} — ${company}
🗓 ${date} o ${time}
📧 ${email}

Przygotuj scoring i case study przed rozmową.`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhooks/calendly]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
