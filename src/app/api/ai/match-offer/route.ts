import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { leadId, diagnosisNotes, clientProblem } = await req.json()

    const supabase = await createClient()
    let lead: Record<string, unknown> | null = null

    if (leadId) {
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      lead = data
    }

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('offer_generator', {
        query: `Dopasowanie oferty: ${clientProblem || diagnosisNotes || 'usługi firmy, cennik, case studies'}`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od dopasowania ofert B2B. Twoim zadaniem jest dopasowanie odpowiedniej usługi do klienta.

${brainCtx?.contextString ?? ''}
OFERTA FIRMY:
${companyCtx}

Odpowiedz TYLKO JSON-em:
{
  "recommended_service": "<nazwa usługi>",
  "problem_summary": "<1 zdanie - problem klienta>",
  "solution_pitch": "<2-3 zdania - jak Twoja usługa rozwiązuje problem>",
  "price_range_min": <liczba PLN lub null>,
  "price_range_max": <liczba PLN lub null>,
  "estimated_timeline": "<np. 14 dni, 3 tygodnie>",
  "key_arguments": ["<argument 1>", "<argument 2>", "<argument 3>"]
}`,
        },
        {
          role: 'user',
          content: `Dopasuj ofertę dla klienta:

${lead ? `Firma: ${lead.company}
Branża: ${lead.industry ?? ''}
Stanowisko: ${lead.position ?? ''}` : ''}

Problem klienta: ${clientProblem || '(nie podano)'}
Notatki z diagnozy: ${diagnosisNotes || '(brak)'}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ result })
  } catch (err) {
    console.error('match-offer error:', err)
    return NextResponse.json({ error: 'Błąd dopasowania oferty' }, { status: 500 })
  }
}
