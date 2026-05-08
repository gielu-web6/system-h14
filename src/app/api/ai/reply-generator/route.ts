import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'

const GOAL_LABELS: Record<string, string> = {
  demo:    'umówienie demonstracji produktu/usługi',
  offer:   'wysłanie oferty lub propozycji współpracy',
  call:    'umówienie rozmowy telefonicznej lub video',
  nurture: 'podtrzymanie relacji i budowanie zaufania',
}

export async function POST(req: NextRequest) {
  try {
    const { receivedMessage, conversationContext, goal, leadContext, imageBase64 } = await req.json()

    const goalLabel = GOAL_LABELS[goal] ?? goal ?? 'kontynuacja rozmowy'

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('outreach_generator', {
        query: `Odpowiedź na wiadomość LinkedIn. Firma rozmówcy: ${leadContext?.company ?? ''}. Stanowisko: ${leadContext?.position ?? ''}. Cel: ${goalLabel}`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const openai = getOpenAI()

    const systemPrompt = `Jesteś ekspertem od sprzedaży B2B i komunikacji na LinkedIn. Pomagasz odpowiadać na wiadomości od potencjalnych klientów.

${brainCtx?.contextString ?? ''}
KONTEKST FIRMY NADAWCY:
${companyCtx}

CEL TEJ ROZMOWY: ${goalLabel}

Zasady pisania odpowiedzi:
- Odpowiadaj naturalnie, ludzko, bez korporacyjnego żargonu
- Nie sprzedawaj wprost — najpierw odpowiedz na to co napisał rozmówca, potem prowadź do celu
- Ton: ${profile?.tone_of_voice || 'bezpośredni, konkretny, przyjazny'}
- Odpowiedź: 2-4 zdania, zakończona jednym konkretnym pytaniem lub CTA
- Uwzględnij USP firmy, case studies i problemy które rozwiązuje

Odpowiedz TYLKO JSON-em:
{
  "reply": "<gotowa odpowiedź do wysłania, po polsku, naturalna i krótka>",
  "strategy": "<1-2 zdania: jaka taktyka i dlaczego ta odpowiedź ma działać>",
  "cta": "<samo call-to-action które kończy wiadomość, np. 'Masz 20 minut na krótką rozmowę?'>",
  "next_step": "<co zrobić dalej po tej wiadomości — np. jeśli odpowie pozytywnie, co wysłać; jeśli milczy, kiedy i jak follow-up>"
}`

    const leadInfo = leadContext
      ? `Rozmówca: ${leadContext.firstName ?? ''} ${leadContext.lastName ?? ''} z ${leadContext.company ?? ''} (${leadContext.position ?? ''})\n\n`
      : ''
    const ctxInfo = conversationContext
      ? `Kontekst poprzednich wiadomości:\n${conversationContext}\n\n`
      : ''

    type UserMessage = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: 'low' } }>

    const userContent: UserMessage = imageBase64
      ? [
          {
            type: 'text' as const,
            text: `${leadInfo}${ctxInfo}Przeanalizuj screenshota konwersacji i wygeneruj odpowiedź na ostatnią wiadomość rozmówcy.`,
          },
          {
            type: 'image_url' as const,
            image_url: { url: imageBase64, detail: 'low' as const },
          },
        ]
      : `${leadInfo}${ctxInfo}Wiadomość którą otrzymałem/am:\n"${receivedMessage}"`

    const completion = await openai.chat.completions.create({
      model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.65,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ result })
  } catch (err) {
    console.error('reply-generator error:', err)
    return NextResponse.json({ error: 'Błąd generowania odpowiedzi' }, { status: 500 })
  }
}
