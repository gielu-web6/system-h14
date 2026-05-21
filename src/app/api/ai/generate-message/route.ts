import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { createClient } from '@/lib/supabase/server'
import { buildContext } from '@/lib/company-brain/context-builder'

export async function POST(req: NextRequest) {
  try {
    const { leadId, messageType, context } = await req.json()

    let lead: Record<string, unknown> | null = null
    if (leadId) {
      const supabase = await createClient()
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      lead = data
    }

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('outreach_generator', {
        query: `Wiadomość do: ${lead?.company ?? ''} (${lead?.industry ?? ''}), stanowisko: ${lead?.position ?? ''}, typ: ${messageType ?? ''}`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const MESSAGE_TYPE_LABELS: Record<string, string> = {
      connection_request: 'zaproszenie do znajomych na LinkedIn (max 200 znaków)',
      dm1_icebreaker: 'pierwsza wiadomość po zaakceptowaniu zaproszenia (personalizacja, problem, propozycja rozmowy)',
      fu1_case_study: 'follow-up z case study (3 dni po pierwszej wiadomości)',
      fu2_calendar: 'follow-up z linkiem do kalendarza (8 dni, ostatni)',
      post_offer_48h: 'follow-up po wysłaniu oferty (48h)',
      reengagement_90d: 'ponowny kontakt po 90 dniach',
      custom: 'spersonalizowana wiadomość',
    }

    const typeLabel = MESSAGE_TYPE_LABELS[messageType] ?? 'wiadomość outreach'

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od cold outreach B2B na LinkedIn. Piszesz wiadomości dla:

${brainCtx?.contextString ?? ''}
FIRMA NADAWCY:
${companyCtx}

Zasady:
- Wiadomości muszą być krótkie, konkretne, ludzkie
- Nigdy nie sprzedawaj wprost — zaproś do rozmowy
- Używaj personalizacji (firma, branża, problem)
- Ton: ${profile?.tone_of_voice || 'bezpośredni, konkretny, bez korporacyjnego żargonu'}

Odpowiedz TYLKO JSON-em:
{
  "message": "<treść wiadomości>",
  "notes": "<krótka uwaga dlaczego ta wiadomość powinna działać>"
}`,
        },
        {
          role: 'user',
          content: `Napisz: ${typeLabel}

Lead:
${lead ? `Imię: ${lead.first_name} ${lead.last_name}
Firma: ${lead.company}
Stanowisko: ${lead.position ?? ''}
Branża: ${lead.industry ?? ''}
Sygnał zakupowy: ${lead.buying_signal ?? ''}` : '(brak danych leadu)'}

${context ? `Kontekst dodatkowy: ${context}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ result })
  } catch (err) {
    console.error('generate-message error:', err)
    return NextResponse.json({ error: 'Błąd generowania wiadomości' }, { status: 500 })
  }
}
