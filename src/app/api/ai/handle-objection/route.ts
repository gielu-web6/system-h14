import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'

export async function POST(req: NextRequest) {
  try {
    const { objectionText } = await req.json()

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('outreach_generator', {
        query: `Obiekcja klienta: ${objectionText}. Case studies, dowody społeczne, argumenty sprzedażowe`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od sprzedaży B2B. Pomagasz odpowiadać na obiekcje klientów.

${brainCtx?.contextString ?? ''}
KONTEKST FIRMY:
${companyCtx}

Zasady:
- Nie odrzucaj obiekcji — validuj ją najpierw
- Następnie zmień perspektywę lub podaj konkretny dowód z case studies firmy
- Zakończ pytaniem lub CTA
- Ton: ${profile?.tone_of_voice || 'bezpośredni, empatyczny'}

Odpowiedz TYLKO JSON-em:
{
  "response": "<gotowa odpowiedź na obiekcję, po polsku, 2-4 zdania>",
  "technique": "<nazwa techniki np. Feel-Felt-Found, Reframe, Social Proof>",
  "follow_up": "<sugerowane pytanie do zadania po odpowiedzi>"
}`,
        },
        {
          role: 'user',
          content: `Obiekcja klienta: "${objectionText}"`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.5,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ result })
  } catch (err) {
    console.error('handle-objection error:', err)
    return NextResponse.json({ error: 'Błąd generowania odpowiedzi' }, { status: 500 })
  }
}
