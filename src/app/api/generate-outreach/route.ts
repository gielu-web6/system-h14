import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, hasOpenAIKey, OPENAI_MODEL } from '@/lib/ai/openai'
import { buildContext } from '@/lib/company-brain/context-builder'
import {
  composeSystemPrompt,
  validateVariant,
  getDm1VariantLabel,
  getFollowUpVariantLabel,
  MESSAGE_TYPE_META,
  extractFirstWords,
  buildFU2PromptStrict,
  FU2_ROUTING,
  type OutreachInput,
  type OutreachVariant,
} from '@/lib/outreach/promptComposer'
import {
  FU2_OPENING_VARIANTS,
  FU2_BODY_VARIANTS,
  FU2_CLOSING_VARIANTS,
} from '@/lib/outreach/prompts/fu2Variants'
import { ICP_ANALYSIS_PROMPT } from '@/lib/ai/experts'

// ─── Extract structured fields from Company Brain DNA ────────────────────────

function extractProductContext(dna: Record<string, unknown> | null | undefined): {
  productName: string
  assetCta: string
  scarcity: string
} {
  if (!dna) return { productName: 'nasz produkt', assetCta: 'krótki materiał informacyjny', scarcity: '' }

  const productName = (dna.company_name as string | undefined)?.trim() || 'nasz produkt'

  // asset_cta i scarcity mogą być opcjonalnymi polami w dna lub odczytane z chunks
  const assetCta = (dna.asset_cta as string | undefined)?.trim()
    || (dna.primary_asset as string | undefined)?.trim()
    || 'krótki materiał informacyjny'

  const scarcity = (dna.scarcity as string | undefined)?.trim()
    || (dna.current_offer as string | undefined)?.trim()
    || ''

  return { productName, assetCta, scarcity }
}

// ─── Demo fallback (no API key) ───────────────────────────────────────────────

function getDemoVariants(input: OutreachInput) {
  const name = input.decisionMakerName || 'tam'
  const firm = input.companyName
  const product = input.productName || 'nasz system'
  const meta = MESSAGE_TYPE_META[input.messageType]

  const demos: OutreachVariant[] = [
    {
      temat: input.channel === 'email' ? `Krótka obserwacja o ${firm}` : undefined,
      tresc: `Cześć ${name},\n\nNapiszę wprost — jest to cold DM.\n\nWidzę że ${firm} aktywnie pozyskuje klientów. ${product} to system który zdejmuje z zespołu powtarzalne zadania — research, przepisywanie danych, ręczne follow-upy — i zwraca te godziny sprzedawcom.\n\nRóżnica jest jedna: system uczy się Waszej firmy z plików o Was i pisze wiadomości jak pracownik z wiedzą o tej firmie — nie jak generyczny ChatGPT.\n\nJeśli to brzmi jak temat dla Was, daj znać. Jeśli nie — napisz "nie" i to uszanuję.\n\nMaciek`,
      katAtaku: 'Pattern interrupt + opis produktu',
      notatkaHandlowca: 'Tryb demo — wygeneruj po dodaniu OPENAI_API_KEY',
    },
    {
      temat: input.channel === 'email' ? `Pytanie odnośnie skalowania ${firm}` : undefined,
      tresc: `Cześć ${name},\n\nIle godzin tygodniowo Twój zespół spędza na rzeczach, które nie generują przychodu?\n\n${firm} i podobne firmy tracą często 8-12 godzin handlowca tygodniowo na zadaniach administracyjnych. ${product} eliminuje większość z tego — zna Waszą firmę i robi to za handlowca.\n\nMam krótki materiał który to pokazuje. Wysłać?\n\nMaciek`,
      katAtaku: 'Koszt alternatywny — pytanie diagnostyczne',
      notatkaHandlowca: 'Tryb demo — wygeneruj po dodaniu OPENAI_API_KEY',
    },
    {
      temat: input.channel === 'email' ? `${firm} — obserwacja z branży` : undefined,
      tresc: `Cześć ${name},\n\nPo setce rozmów z firmami z tej branży zauważyłem rzecz, której prawie nikt nie nazywa głośno.\n\nFirmy myślą że problem to za mało leadów. Realny problem to tempo ich obsługi — lead pisze w środę, firma odpisuje w piątek, lead już rozmawia z konkurencją.\n\nTo nie problem liczby. To problem tempa.\n\nPomyślałem że Ci się to może przydać — niezależnie od tego, czy kiedykolwiek będziemy pracować razem.\n\nMaciek`,
      katAtaku: 'Szkoła: LICZBA → korpus: tempo_vs_liczba',
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

// ─── FU #2 Sequential Generation (v2 hotfix) ─────────────────────────────────
// Generuje 3 warianty FU#2 jeden po drugim z hard-coded routing i dynamiczną
// blacklistą pierwszych słów. Gwarantuje brak klonów strukturalnie, nie prośbą.

async function generateFU2Sequentially(
  openai: ReturnType<typeof getOpenAI>,
  input: OutreachInput,
  productName: string,
): Promise<{ warianty: OutreachVariant[]; _warned?: boolean }> {
  const warianty: OutreachVariant[] = []
  const blacklistaPierwszychSlow: string[] = []

  for (let i = 0; i < FU2_ROUTING.length; i++) {
    const { szkola, body_id, closing_idx } = FU2_ROUTING[i]

    const opening = FU2_OPENING_VARIANTS.find(v => v.szkola === szkola)
    if (!opening) throw new Error(`Brak otwarcia dla szkoły ${szkola}`)

    const body = FU2_BODY_VARIANTS.find(v => v.id === body_id)
    if (!body) throw new Error(`Brak korpusu ${body_id}`)

    const closing = FU2_CLOSING_VARIANTS[closing_idx]

    const prompt = buildFU2PromptStrict({
      input,
      productName,
      opening,
      body,
      closing,
      blacklistaPierwszychSlow,
      numerWariantu: i + 1,
    })

    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 500,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Wygeneruj wiadomość.' },
      ],
    })

    const tresc = res.choices[0]?.message?.content?.trim() ?? ''

    blacklistaPierwszychSlow.push(...extractFirstWords(tresc, 5))

    warianty.push({
      tresc,
      katAtaku: `Szkoła: ${szkola} → korpus: ${body_id}`,
      notatkaHandlowca: `Otwarcie: ${szkola} (${opening.psychology}). Zakończenie: ${closing.psychology}`,
      szkola_otwarcia: szkola,
    })
  }

  return { warianty }
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
      ? `\n\nUWAGA: Poprzednie warianty nie przeszły walidacji. Przepisz wszystkie — zmień strukturę i sformułowania. Upewnij się że:\n- każdy wariant ma inną szkołę narracyjną otwarcia\n- nazwa produktu "${input.productName ?? 'nasz produkt'}" pojawia się w treści (poza FU#2)\n- przestrzegasz zasad co do CTA/braku CTA`
      : ''

    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1400,
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

    const brainCtx = await buildContext('outreach_generator', {
      query: `cold outreach ${companyName} ${industry ?? ''} kwalifikacja leada ICP sprzedaż`,
    }).catch(() => null)
    const brainString = brainCtx?.contextString ?? ''
    const dna = brainCtx?.dna as Record<string, unknown> | null | undefined

    const { productName, assetCta, scarcity } = extractProductContext(dna)

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
      productName,
      assetCta,
      scarcity,
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(getDemoVariants(input))
    }

    const openai = getOpenAI()

    // SPECJALNA OBSŁUGA FU #2 — sekwencyjne generowanie z blacklistą
    // Dla wszystkich innych typów — standardowa równoległa ścieżka.
    let variantsPromise: Promise<{ warianty: OutreachVariant[]; _warned?: boolean }>
    let dm1Combos: ReturnType<typeof composeSystemPrompt>['dm1Combos']
    let followUpCombos: ReturnType<typeof composeSystemPrompt>['followUpCombos']

    if (input.messageType === 'fu2') {
      variantsPromise = generateFU2Sequentially(openai, input, productName)
    } else {
      const composed = composeSystemPrompt(input, brainString)
      dm1Combos = composed.dm1Combos
      followUpCombos = composed.followUpCombos

      const userPrompt = `Wygeneruj 3 zróżnicowane warianty wiadomości dla:
Firma: ${input.companyName}
Decydent: ${input.decisionMakerName || 'nieznany'}${input.decisionMakerRole ? ` (${input.decisionMakerRole})` : ''}
Branża: ${input.industry || 'nieznana'}
Obserwacje: ${input.observations || '(brak)'}
Kontekst: ${input.context || '(brak)'}
Kanał: ${input.channel}
Typ: ${MESSAGE_TYPE_META[input.messageType].label}`

      variantsPromise = generateVariants(openai, composed.systemPrompt, userPrompt, input)
    }

    const [variantsResult, icpRes] = await Promise.allSettled([
      variantsPromise,
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
          v.szkola_otwarcia = labels.szkola_otwarcia
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

    const brainComplete = dna
      ? ((dna.completeness_score as number | undefined) ?? 0) >= 50
      : false

    return NextResponse.json({
      warianty,
      typ: input.messageType,
      typLabel: MESSAGE_TYPE_META[input.messageType].label,
      icp: icpAnalysis,
      _brainUsed: !!dna,
      _brainComplete: brainComplete,
      _productName: productName,
      _warned,
    })
  } catch (err) {
    console.error('generate-outreach error:', err)
    return NextResponse.json({ error: 'Błąd generowania wiadomości' }, { status: 500 })
  }
}
