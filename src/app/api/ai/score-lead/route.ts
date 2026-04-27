import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { leadId, leadData } = await req.json()

    // Get company profile for context
    const profile = await getCompanyProfile()
    const companyCtx = buildCompanyContext(profile)

    // Get lead data from DB if leadId provided
    let lead = leadData
    if (leadId && !lead) {
      const supabase = await createClient()
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      lead = data
    }

    if (!lead) {
      return NextResponse.json({ error: 'Brak danych leadu' }, { status: 400 })
    }

    const leadDesc = `
Imię i nazwisko: ${lead.first_name ?? ''} ${lead.last_name ?? ''}
Firma: ${lead.company ?? ''}
Stanowisko: ${lead.position ?? ''}
Branża: ${lead.industry ?? ''}
LinkedIn: ${lead.linkedin_url ?? ''}
Strona www: ${lead.company_website ?? ''}
Sygnał zakupowy: ${lead.buying_signal ?? ''}
Segment: ${lead.segment ?? ''}
Notatki: ${lead.notes ?? ''}
`.trim()

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od kwalifikacji leadów B2B. Oceniasz leady na podstawie danych firmy klienta.

DANE FIRMY (Twojego klienta który ocenia leady):
${companyCtx}

Twoim zadaniem jest ocena LEADA pod kątem tego jak bardzo pasuje do ICP firmy i jakie ma szanse na konwersję.

Odpowiedz TYLKO JSON-em w tym formacie:
{
  "icp_score": <0-25>,
  "signals_score": <0-25>,
  "activity_score": <0-25>,
  "potential_score": <0-25>,
  "total_score": <0-100>,
  "label": "hot" | "warm" | "cold",
  "problem": "<krótki opis zidentyfikowanego problemu po polsku, max 1 zdanie>",
  "icebreaker": "<gotowa personalizowana wiadomość otwierająca do tego leadu, po polsku, max 2 zdania>",
  "reasoning": "<krótkie uzasadnienie oceny po polsku, max 2 zdania>"
}`,
        },
        {
          role: 'user',
          content: `Oceń tego leada:\n${leadDesc}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(raw)

    // Save scores to DB if leadId provided
    if (leadId) {
      const supabase = await createClient()
      await supabase.from('leads').update({
        ai_score_num:         result.total_score    ?? 0,
        ai_score_label:       result.label          ?? 'warm',
        ai_problem:           result.problem        ?? null,
        ai_icebreaker:        result.icebreaker     ?? null,
        ai_icp_score:         result.icp_score      ?? 0,
        ai_signals_score:     result.signals_score  ?? 0,
        ai_activity_score:    result.activity_score ?? 0,
        ai_potential_score:   result.potential_score ?? 0,
        ai_reasoning:         result.reasoning      ?? null,
        ai_scored_at:         new Date().toISOString(),
      }).eq('id', leadId)
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('score-lead error:', err)
    return NextResponse.json({ error: 'Błąd scoringu AI' }, { status: 500 })
  }
}
