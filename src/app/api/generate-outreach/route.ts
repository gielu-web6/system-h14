import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, hasOpenAIKey, OPENAI_MODEL } from '@/lib/ai/openai'
import { buildContext } from '@/lib/company-brain/context-builder'
import {
  composeSystemPrompt,
  validateVariant,
  getDm1VariantLabel,
  getFollowUpVariantLabel,
  MESSAGE_TYPE_META,
  type OutreachInput,
  type OutreachVariant,
} from '@/lib/outreach/promptComposer'
import { ICP_ANALYSIS_PROMPT } from '@/lib/ai/experts'

// ─── Demo fallback (no API key) ───────────────────────────────────────────────

function getDemoVariants(input: OutreachInput) {
  const name = input.decisionMakerName || 'tam'
  const firm = input.companyName
  const meta = MESSAGE_TYPE_META[input.messageType]

  const demos: OutreachVariant[] = [
    {
      temat: input.channel === 'email' ? `Krótka obserwacja o ${firm}` : undefined,
      tresc: `Cześć ${name},\n\nNapiszę wprost — jest to cold DM.\n\nWidzę że ${firm} aktywnie pozyskuje klientów. Buduję system operacyjny dla agencji który zastępuje HubSpot/Make/Excel — czas pracy z godzin do minut.\n\nRóżnica jest jedna: w środku siedzi Company Brain — nasze AI, które uczy się Waszej firmy z plików o Was, i pisze maile oraz oferty jak pracownik z dwuletnim stażem, nie jak generyczny ChatGPT.\n\nWczesna cena dla pierwszych klientów jest znacząco niższa i zostaje na stałe. Jeśli zaciekawił Cię ten temat, prześlę krótkie wideo. Jeśli nie, napisz „nie" a ja to uszanuję.\n\nMaciek`,
      katAtaku: 'Pattern interrupt + Company Brain',
      notatkaHandlowca: 'Tryb demo — wygeneruj po dodaniu OPENAI_API_KEY',
    },
    {
      temat: input.channel === 'email' ? `Pytanie odnośnie skalowania ${firm}` : undefined,
      tresc: `Cześć ${name},\n\nNapiszę wprost — jest to cold DM.\n\n${firm} — zakładam że cały czas walczycie z tym samym co inne agencje: handlowiec robi research, przepisuje dane, pisze oferty od zera. Company Brain to eliminuje — zna Waszą firmę i robi to za niego.\n\nWczesna cena zostaje na stałe. Bezpośredni kontakt do mnie, nie do supportu.\n\nJeśli temat Cię zaciekawił, prześlę krótkie wideo. Jeśli nie — napisz „nie".\n\nMaciek`,
      katAtaku: 'Ból operacyjny + risk reversal',
      notatkaHandlowca: 'Tryb demo — wygeneruj po dodaniu OPENAI_API_KEY',
    },
    {
      temat: input.channel === 'email' ? `${firm} — system który zastępuje 3 narzędzia` : undefined,
      tresc: `Cześć ${name},\n\nNapiszę wprost — jest to cold DM.\n\nJesteś w branży gdzie każda godzina handlowca kosztuje. System H14 z Company Brain zwraca te godziny — bo uczy się Waszej firmy i pracuje za handlowca przy powtarzalnych zadaniach.\n\nJesteśmy nowi na rynku — stąd wczesna cena znacząco niższa dla pierwszych klientów, na stałe.\n\nPrześlę 7-minutowe wideo jeśli chcesz zobaczyć jak to działa. Jeśli nie — napisz „nie".\n\nMaciek`,
      katAtaku: 'Koszt czasu + nowy gracz scarcity',
      notatkaHandlowca: 'Tryb demo — wygeneruj po dodaniu OPENAI_API_KEY',
    },
  ]

  return {
    warianty: demos.slice(0, input.variantCount ?? 3),
    typ: input.messageType,
    typLabel: meta.label,
    _demo: true,
  }
}

// ─── Generate with quality check ─────────────────────────────────────────────

async function generateVariants(
  openai: ReturnType<typeof getOpenAI>,
  systemPrompt: string,
  userPrompt: string,
  input: OutreachInput,
  maxRetries = 2,
): Promise<{ warianty: OutreachVariant[]; _warned?: boolean }> {
  let lastVariants: OutreachVariant[] = []
  let warned = false

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const retryNote = attempt > 0
      ? '\n\nUWAGA: Poprzednie warianty nie przeszły walidacji. Przepisz wszystkie — zmień strukturę i sformułowania. Przestrzegaj zasad co do CTA/braku CTA i obecności "Company Brain".'
      : ''

    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt + retryNote },
      ],
    })

    const raw = res.choices[0]?.message?.content ?? '{}'
    let parsed: { warianty?: OutreachVariant[] } = {}
    try { parsed = JSON.parse(raw) } catch { continue }

    const variants = parsed.warianty ?? []
    const allValid = variants.every(v => validateVariant(v, input).length === 0)

    if (allValid && variants.length > 0) {
      return { warianty: variants }
    }
    lastVariants = variants
  }

  warned = true
  return { warianty: lastVariants, _warned: warned }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as OutreachInput

    const {
      messageType,
      channel,
      companyName,
      decisionMakerName,
      decisionMakerRole,
      industry,
      observations,
      context,
      wysylajacy,
    } = body

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json({ error: 'Nazwa firmy jest wymagana' }, { status: 400 })
    }

    if (!messageType) {
      return NextResponse.json({ error: 'Typ wiadomości jest wymagany' }, { status: 400 })
    }

    if (messageType === 'reengagement' && !context?.trim()) {
      return NextResponse.json({
        error: 'Brak kontekstu reaktywacji — uzupełnij pole Kontekst przed generowaniem re-engagement.',
      }, { status: 400 })
    }

    const input: OutreachInput = {
      messageType,
      channel: channel ?? 'linkedin',
      companyName: companyName.trim(),
      decisionMakerName: decisionMakerName?.trim(),
      decisionMakerRole: decisionMakerRole?.trim(),
      industry: industry?.trim(),
      observations: observations?.trim(),
      context: context?.trim(),
      wysylajacy: wysylajacy?.trim() || 'Maciek',
      variantCount: 3,
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(getDemoVariants(input))
    }

    const brainCtx = await buildContext('outreach_generator', {
      query: `cold outreach ${companyName} ${industry ?? ''} kwalifikacja leada ICP sprzedaż`,
    }).catch(() => null)
    const brainString = brainCtx?.contextString ?? ''

    const openai = getOpenAI()
    const { systemPrompt, dm1Combos, followUpCombos } = composeSystemPrompt(input, brainString)

    const userPrompt = `Wygeneruj 3 zróżnicowane warianty wiadomości dla:
Firma: ${input.companyName}
Decydent: ${input.decisionMakerName || 'nieznany'}${input.decisionMakerRole ? ` (${input.decisionMakerRole})` : ''}
Branża: ${input.industry || 'agencja marketingowa'}
Obserwacje: ${input.observations || '(brak)'}
Kontekst: ${input.context || '(brak)'}
Kanał: ${input.channel}
Typ: ${MESSAGE_TYPE_META[input.messageType].label}`

    const [variantsResult, icpRes] = await Promise.allSettled([
      generateVariants(openai, systemPrompt, userPrompt, input),
      openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ICP_ANALYSIS_PROMPT },
          {
            role: 'user',
            content: `Firma: ${input.companyName}\n${input.industry ? `Branża: ${input.industry}` : ''}\n${input.observations ? `Obserwacje: ${input.observations}` : ''}`,
          },
        ],
      }),
    ])

    const { warianty, _warned } = variantsResult.status === 'fulfilled'
      ? variantsResult.value
      : { warianty: [], _warned: true }

    if (input.messageType === 'dm1' && dm1Combos && warianty.length > 0) {
      warianty.forEach((v, i) => {
        const combo = dm1Combos[i]
        if (combo) {
          const labels = getDm1VariantLabel(combo)
          v.katAtaku = labels.katAtaku
          v.notatkaHandlowca = labels.notatkaHandlowca
        }
      })
    }

    if (followUpCombos && warianty.length > 0) {
      warianty.forEach((v, i) => {
        const combo = followUpCombos[i]
        if (combo) {
          const labels = getFollowUpVariantLabel(input.messageType, combo)
          v.katAtaku = labels.katAtaku
          v.notatkaHandlowca = labels.notatkaHandlowca
        }
      })
    }

    let icpAnalysis: { score: number; fit: string; reason: string; pain_point: string } | null = null
    if (icpRes.status === 'fulfilled') {
      try {
        const raw = icpRes.value.choices[0]?.message?.content ?? ''
        const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
        icpAnalysis = JSON.parse(cleaned)
      } catch { /* ignore */ }
    }

    const dna = brainCtx?.dna as Record<string, unknown> | null | undefined
    const brainComplete = dna
      ? (dna.completeness_score as number | undefined ?? 0) >= 50
      : false

    return NextResponse.json({
      warianty,
      typ: input.messageType,
      typLabel: MESSAGE_TYPE_META[input.messageType].label,
      icp: icpAnalysis,
      _brainUsed: !!dna,
      _brainComplete: brainComplete,
      _warned,
    })
  } catch (err) {
    console.error('generate-outreach error:', err)
    return NextResponse.json({ error: 'Błąd generowania wiadomości' }, { status: 500 })
  }
}
