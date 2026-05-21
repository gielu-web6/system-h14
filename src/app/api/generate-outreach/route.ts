import { NextRequest, NextResponse } from 'next/server'
import { getAnthropic, hasAnthropicKey, CLAUDE_MODEL } from '@/lib/ai/anthropic'
import { EXPERTS, ICP_ANALYSIS_PROMPT, containsBannedPhrases } from '@/lib/ai/experts'
import { getDemoOutreach } from '@/lib/ai/demo-fallback'
import { buildContext } from '@/lib/company-brain/context-builder'

function withBrain(systemPrompt: string, brainCtx: string): string {
  if (!brainCtx.trim()) return systemPrompt
  return `## DANE FIRMOWE Z COMPANY BRAIN (priorytet nadrzędny — użyj tych danych o firmie klienta, tonie i ICP przy pisaniu wiadomości):\n${brainCtx}\n\n---\n\n${systemPrompt}`
}

async function generateWithQualityCheck(
  anthropic: ReturnType<typeof getAnthropic>,
  model: string,
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
    const res = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt + retryNote }],
    })
    const block = res.content.find(b => b.type === 'text')
    lastText = (block as { type: 'text'; text: string } | undefined)?.text ?? ''
    if (!containsBannedPhrases(lastText)) return lastText
  }
  // All retries exhausted — return last attempt anyway (better than empty)
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

    if (!hasAnthropicKey()) {
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

    // Fetch Company Brain context once — degrades gracefully without OpenAI key
    const brainCtx = await buildContext('outreach_generator', {
      query: `cold outreach ${companyName} ${industry ?? ''} kwalifikacja leada ICP sprzedaż`,
    }).catch(() => null)
    const brainString = brainCtx?.contextString ?? ''

    const anthropic = getAnthropic()

    const [kennedyRes, belfortRes, hormoziRes, icpRes] = await Promise.allSettled([
      generateWithQualityCheck(anthropic, CLAUDE_MODEL, withBrain(EXPERTS[0].systemPrompt, brainString), userPrompt, 400),
      generateWithQualityCheck(anthropic, CLAUDE_MODEL, withBrain(EXPERTS[1].systemPrompt, brainString), userPrompt, 400),
      generateWithQualityCheck(anthropic, CLAUDE_MODEL, withBrain(EXPERTS[2].systemPrompt, brainString), userPrompt, 400),
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system: withBrain(ICP_ANALYSIS_PROMPT, brainString),
        messages: [{
          role: 'user',
          content: `Firma: ${companyName}\n${industry ? `Branża: ${industry}` : ''}\n${observations ? `Obserwacje: ${observations}` : ''}`,
        }],
      }),
    ])

    function extractText(res: PromiseSettledResult<string | { content: Array<{ type: string; text?: string }> }>): string {
      if (res.status === 'rejected') return ''
      if (typeof res.value === 'string') return res.value
      const block = (res.value as { content: Array<{ type: string; text?: string }> }).content.find(b => b.type === 'text')
      return (block as { type: 'text'; text: string } | undefined)?.text ?? ''
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
