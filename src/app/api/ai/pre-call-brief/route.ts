import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { leadId, dealId } = await req.json()

    const supabase = await createClient()
    let lead: Record<string, unknown> | null = null
    let deal: Record<string, unknown> | null = null

    if (leadId) {
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      lead = data
    }
    if (dealId) {
      const { data } = await supabase.from('deals').select('*').eq('id', dealId).single()
      deal = data
    }

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('outreach_generator', {
        query: `Brief przed rozmową: ${(lead?.company as string) ?? ''} ${(lead?.industry as string) ?? ''} ${(deal?.client_problem as string) ?? ''} strategia sprzedaży, obiekcje, ICP`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś asystentem sprzedaży B2B. Przygotowujesz briefing przed rozmową z klientem.

${brainCtx?.contextString ?? ''}
FIRMA SPRZEDAWCY:
${companyCtx}

Przygotuj krótki brief (max 300 słów) zawierający:
1. **Kim jest klient** (firma, branża, rola)
2. **Zidentyfikowany problem** (na podstawie danych)
3. **Sugerowane rozwiązanie** z oferty firmy — odwołaj się do konkretnych usług i case studies
4. **3 pytania diagnozujące** które zadać na rozmowie
5. **Potencjalne obiekcje** i jak je zbić argumentami firmy

Odpowiedz w formacie markdown.`,
        },
        {
          role: 'user',
          content: `Przygotuj brief przed rozmową z:

${lead ? `Klient: ${lead.first_name} ${lead.last_name} (${lead.position ?? ''} @ ${lead.company})
Branża: ${lead.industry ?? ''}
LinkedIn: ${lead.linkedin_url ?? ''}
Sygnał zakupowy: ${lead.buying_signal ?? ''}
Notatki: ${lead.notes ?? ''}` : '(brak danych leadu)'}

${deal ? `Notatki z deala: ${deal.diagnosis_notes ?? ''}
Problem klienta: ${deal.client_problem ?? ''}` : ''}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    })

    const brief = completion.choices[0].message.content ?? ''
    return NextResponse.json({ brief })
  } catch (err) {
    console.error('pre-call-brief error:', err)
    return NextResponse.json({ error: 'Błąd generowania briefu' }, { status: 500 })
  }
}
