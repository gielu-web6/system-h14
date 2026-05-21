import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, hasOpenAIKey, OPENAI_MODEL } from '@/lib/ai/openai'
import { EXPERTS, ICP_ANALYSIS_PROMPT, containsBannedPhrases } from '@/lib/ai/experts'
import { getDemoOutreach } from '@/lib/ai/demo-fallback'
import { buildContext } from '@/lib/company-brain/context-builder'

function withBrain(systemPrompt: string, brainCtx: string): string {
  if (!brainCtx.trim()) return systemPrompt
  return `## DANE FIRMOWE Z COMPANY BRAIN (priorytet nadrzędny — użyj tych danych o firmie klienta, tonie i ICP przy pisaniu wiadomości):\n${brainCtx}\n\n---\n\n${systemPrompt}`
}

async function generateWithQualityCheck(
  openai: ReturnType<typeof getOpenAI>,
  system: string,
  userPrompt: string,
  maxTokens: number,
  maxRetries = 2,
): Promise<string> {
  let lastText = ''
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const retryNote = attempt > 0
      ? `\n\nUWAGA: Poprzednia wersja zawierała zakazane wyrażenia. Napisz zupełnie inaczej — zmień strukturę, otwarcie i sformułowania.`
      : ''
    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt + retryNote },
      ],
    })
    lastText = res.choices[0]?.message?.content ?? ''
    if (!containsBannedPhrases(lastText)) return lastText
  }
  return lastText
}

export async function POST(req: NextRequest) {
  try {
    const {
      companyName,
      decisionMakerName,
      decisionMakerRole,
      websiteUrl,
      industry,
      observations,
      channel,
    } = await req.json()

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json({ error: 'Nazwa firmy jest wymagana' }, { status: 400 })
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(getDemoOutreach(companyName.trim(), decisionMakerName?.trim()))
    }

    const channelLabel: Record<string, string> = {
      linkedin: 'LinkedIn DM (maks. 5-6 zdań, bardzo zwięźle)',
      email:    'Cold Email (do 150 słów, ma temat wiadomości jako pierwsza linia)',
      whatsapp: 'WhatsApp (krótko, niezobowiązująco, maksymalnie 4 zdania)',
    }
    const channelInstruction = channelLabel[channel] ?? 'LinkedIn DM'

    const urlNote = websiteUrl
      ? `URL strony: ${websiteUrl}`
      : 'URL strony: nie podano — stwórz wiadomość bez analizy strony'

    const userPrompt = `Firma prospekta: ${companyName}
${decisionMakerName ? `Decydent: ${decisionMakerName}${decisionMakerRole ? ` (${decisionMakerRole})` : ''}` : 'Decydent: nieznany'}
${industry ? `Branża prospekta: ${industry}` : ''}
${urlNote}
${observations ? `Moje obserwacje o prospekcie: ${observations}` : ''}

Kanał: ${channelInstruction}

Napisz wiadomość outreachową według swoich zasad.`

    const brainCtx = await buildContext('outreach_generator', {
      query: `cold outreach ${companyName} ${industry ?? ''} kwalifikacja leada ICP sprzedaż`,
    }).catch(() => null)
    const brainString = brainCtx?.contextString ?? ''

    const openai = getOpenAI()

    const [kennedyRes, belfortRes, hormoziRes, icpRes] = await Promise.allSettled([
      generateWithQualityCheck(openai, withBrain(EXPERTS[0].systemPrompt, brainString), userPrompt, 400),
      generateWithQualityCheck(openai, withBrain(EXPERTS[1].systemPrompt, brainString), userPrompt, 400),
      generateWithQualityCheck(openai, withBrain(EXPERTS[2].systemPrompt, brainString), userPrompt, 400),
      openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 200,
        messages: [
          { role: 'system', content: withBrain(ICP_ANALYSIS_PROMPT, brainString) },
          {
            role: 'user',
            content: `Firma: ${companyName}\n${industry ? `Branża: ${industry}` : ''}\n${observations ? `Obserwacje: ${observations}` : ''}`,
          },
        ],
      }),
    ])

    function extractText(res: PromiseSettledResult<string | { choices: Array<{ message: { content: string | null } }> }>): string {
      if (res.status === 'rejected') return ''
      if (typeof res.value === 'string') return res.value
      return (res.value as { choices: Array<{ message: { content: string | null } }> }).choices[0]?.message?.content ?? ''
    }

    const kennedy = extractText(kennedyRes)
    const belfort = extractText(belfortRes)
    const hormozi = extractText(hormoziRes)
    const icpRaw  = extractText(icpRes)

    let icpAnalysis: { score: number; fit: string; reason: string; pain_point: string } | null = null
    try {
      const cleaned = icpRaw.replace(/```json\n?|\n?```/g, '').trim()
      icpAnalysis = JSON.parse(cleaned)
    } catch {
      icpAnalysis = null
    }

    const dna = brainCtx?.dna as Record<string, unknown> | null | undefined
    const brainComplete = dna
      ? (dna.completeness_score as number | undefined ?? 0) >= 50
      : false

    return NextResponse.json({
      variants: {
        kennedy: { message: kennedy, expert: EXPERTS[0] },
        belfort: { message: belfort, expert: EXPERTS[1] },
        hormozi: { message: hormozi, expert: EXPERTS[2] },
      },
      icp: icpAnalysis,
      _brainUsed: !!dna,
      _brainComplete: brainComplete,
    })
  } catch (err) {
    console.error('generate-outreach error:', err)
    return NextResponse.json({ error: 'Błąd generowania wiadomości' }, { status: 500 })
  }
}
