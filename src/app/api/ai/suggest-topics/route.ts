import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { buildContext } from '@/lib/company-brain/context-builder'

export async function POST(req: NextRequest) {
  try {
    const { channel, profileUrl } = await req.json()

    const [profile, brainCtx] = await Promise.all([
      getCompanyProfile(),
      buildContext('content_generator', {
        query: `Tematy postów na ${channel === 'instagram' ? 'Instagram karuzele' : 'LinkedIn'}, case studies, wartościowy content dla klientów`,
      }).catch(() => null),
    ])
    const companyCtx = buildCompanyContext(profile)

    const openai = getOpenAI()

    // LinkedIn with profile analysis — return 3 detailed suggestions
    if (channel === 'linkedin' && profileUrl) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Jesteś ekspertem od content marketingu na LinkedIn. Analizujesz profil LinkedIn i dane firmy, żeby zaproponować 3 wartościowe tematy na posty.

${brainCtx?.contextString ?? ''}
DANE FIRMY:
${companyCtx}

Zasady:
- Tematy mają być konkretne, oparte na wiedzy i case studies firmy
- Dopasowane do branży, usług i ICP firmy
- Angażujące dla docelowej grupy odbiorców
- Napisz tematy po polsku

Odpowiedz TYLKO JSON-em:
{
  "suggestions": [
    { "topic": "<konkretny temat posta>", "rationale": "<1 zdanie dlaczego ten temat zadziała>" },
    { "topic": "<konkretny temat posta>", "rationale": "<1 zdanie dlaczego>" },
    { "topic": "<konkretny temat posta>", "rationale": "<1 zdanie dlaczego>" }
  ]
}`,
          },
          {
            role: 'user',
            content: `Profil LinkedIn: ${profileUrl}

Zaproponuj 3 tematy na posty LinkedIn które będą:
1. Spójne z językiem i marką osobistą z profilu
2. Wartościowe dla ICP firmy (${profile?.icp_industry || 'różne branże'})
3. Oparte na wiedzy eksperckiej firmy (${profile?.usp || 'usługi marketingowe'})`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0.8,
      })

      const result = JSON.parse(completion.choices[0].message.content ?? '{}')
      return NextResponse.json(result)
    }

    // General topic suggestions for Instagram or LinkedIn (without profile)
    const channelLabel = channel === 'instagram' ? 'Instagram (karuzele)' : 'LinkedIn'
    const count = channel === 'instagram' ? 6 : 4

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś ekspertem od content marketingu B2B. Proponujesz wartościowe tematy postów na ${channelLabel} dla firmy.

${brainCtx?.contextString ?? ''}
DANE FIRMY:
${companyCtx}

Zasady:
- Tematy muszą być konkretne i wartościowe — NIE generyczne
- Oparte na usługach, problemach ICP, case studies i wiedzy eksperckiej firmy
- Każdy temat to gotowy tytuł posta, nie ogólna kategoria
- Pisz po polsku

Odpowiedz TYLKO JSON-em:
{
  "topics": ["<konkretny temat 1>", "<konkretny temat 2>", ..., "<konkretny temat ${count}>"]
}`,
        },
        {
          role: 'user',
          content: `Zaproponuj ${count} konkretnych tematów postów na ${channelLabel}. Tematy mają być dopasowane do firmy ${profile?.company_name || ''} i jej klientów (${profile?.icp_industry || 'różne branże'}).`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.9,
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json(result)
  } catch (err) {
    console.error('suggest-topics error:', err)
    return NextResponse.json({ topics: [], suggestions: [] })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST' }, { status: 405 })
}
