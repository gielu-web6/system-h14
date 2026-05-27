import { BASE_RULES, containsBannedPhrases } from './prompts/base'
import { CHANNEL_RULES, type Channel } from './prompts/channels'
import {
  MESSAGE_TYPE_META,
  buildDm1TypePrompt,
  buildFollowUpTypePrompt,
  getVariantBanks,
  getFollowUpVariantLabel,
  FOLLOW_UP_TYPES,
  type MessageType,
  type FollowUpVariantCombo,
} from './prompts/messageTypes'
import { pickDm1Combinations, getDm1VariantLabel, type Dm1VariantCombo } from './prompts/dm1Variants'

export type { Channel, MessageType }
export { MESSAGE_TYPE_META, containsBannedPhrases, getDm1VariantLabel, getFollowUpVariantLabel }
export type { Dm1VariantCombo, FollowUpVariantCombo }

export interface OutreachInput {
  messageType: MessageType
  channel: Channel
  companyName: string
  decisionMakerName?: string
  decisionMakerRole?: string
  industry?: string
  observations?: string
  context?: string
  wysylajacy?: string
  variantCount?: number
  productName?: string   // wyciągany z Company Brain (dna.company_name)
  assetCta?: string      // co wysyłamy jako asset (wideo/PDF/demo)
  scarcity?: string      // scarcity lub oferta specjalna
}

export interface OutreachVariant {
  temat?: string
  tresc: string
  katAtaku: string
  notatkaHandlowca?: string
  szkola_otwarcia?: string
}

export interface OutreachError {
  error: string
}

export interface ComposeResult {
  systemPrompt: string
  dm1Combos?: Dm1VariantCombo[]
  followUpCombos?: FollowUpVariantCombo[]
}

// Wybiera count kombinacji gwarantując RÓŻNE szkoły narracyjne dla każdego wariantu
function pickFollowUpCombinations(typ: MessageType, count: number): FollowUpVariantCombo[] {
  const banks = getVariantBanks(typ)

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Grupuj otwarcia po szkołach narracyjnych
  const openingsByShkola = new Map<string, typeof banks.OPENING_VARIANTS>()
  banks.OPENING_VARIANTS.forEach(v => {
    const key = v.szkola ?? 'INNE'
    if (!openingsByShkola.has(key)) openingsByShkola.set(key, [])
    openingsByShkola.get(key)!.push(v)
  })

  // Wybierz count RÓŻNYCH szkół (jeśli jest mniej szkół niż count — recykling)
  const allSzkoly = shuffle(Array.from(openingsByShkola.keys()))
  const selectedSzkoly = Array.from({ length: count }, (_, i) => allSzkoly[i % allSzkoly.length])

  // Z każdej wybranej szkoły losuj jedno otwarcie
  const openings = selectedSzkoly.map(szkola => {
    const pool = openingsByShkola.get(szkola)!
    return pool[Math.floor(Math.random() * pool.length)]
  })

  const closings = shuffle(banks.CLOSING_VARIANTS).slice(0, count)
  const bodiesShuffled = shuffle(banks.BODY_VARIANTS)

  return Array.from({ length: count }, (_, i) => ({
    opening_id: openings[i].id,
    body_id: bodiesShuffled[i % bodiesShuffled.length].id,
    closing_id: closings[i % closings.length].id,
  }))
}

export function composeSystemPrompt(
  input: OutreachInput,
  brainCtx: string,
): ComposeResult {
  const channelRules = CHANNEL_RULES[input.channel]
  const meta = MESSAGE_TYPE_META[input.messageType]
  const count = input.variantCount ?? 3
  const productName = input.productName || 'nasz produkt'
  const assetCta = input.assetCta || 'krótki materiał informacyjny'
  const scarcity = input.scarcity || ''

  let typePrompt: string
  let dm1Combos: Dm1VariantCombo[] | undefined
  let followUpCombos: FollowUpVariantCombo[] | undefined

  if (input.messageType === 'dm1') {
    dm1Combos = pickDm1Combinations(count)
    typePrompt = buildDm1TypePrompt(dm1Combos, productName)
  } else if (FOLLOW_UP_TYPES.includes(input.messageType)) {
    followUpCombos = pickFollowUpCombinations(input.messageType, count)
    typePrompt = buildFollowUpTypePrompt(input.messageType, followUpCombos, productName, assetCta, scarcity)
  } else {
    typePrompt = ''
  }

  const parts: string[] = []

  if (brainCtx.trim()) {
    parts.push('## DANE Z COMPANY BRAIN (priorytet nadrzędny):')
    parts.push(brainCtx)
    parts.push('---')
    parts.push('')
  }

  parts.push(BASE_RULES)
  parts.push('')
  parts.push(channelRules)
  parts.push('')
  parts.push(typePrompt)
  parts.push('')
  parts.push(`DANE LEADA:
- Firma: ${input.companyName}
- Imię decydenta: ${input.decisionMakerName || 'nieznane'}
- Stanowisko: ${input.decisionMakerRole || 'nieznane'}
- Branża: ${input.industry || 'nieznana'}
- Obserwacje: ${input.observations || '(brak — wygeneruj na podstawie branży)'}
- Kontekst dodatkowy: ${input.context || '(brak)'}
- Podpisuje się: ${input.wysylajacy || 'Maciek'}`)
  parts.push('')
  parts.push(`ZADANIE: Wygeneruj dokładnie ${count} ZRÓŻNICOWANE warianty tej wiadomości.
Każdy wariant musi mieć INNĄ SZKOŁĘ NARRACYJNĄ otwarcia i INNY styl zaangażowania.
Trzymaj się struktury przypisanej do każdego wariantu.

Typ wiadomości: ${meta.label} (${meta.day})
Kąt strategiczny: ${meta.angle}`)

  if (meta.noCta) {
    parts.push('KRYTYCZNE: Ta wiadomość NIE MA CTA. Żadnego pytania, żadnego linku, żadnej prośby na końcu. To jest celowe.')
  }
  if (meta.threeOptions) {
    parts.push('KRYTYCZNE: Ta wiadomość MUSI mieć dokładnie 3 opcje na końcu w formacie numerowanym lub jako punkty.')
  }

  parts.push('')
  parts.push(`ZWRÓĆ ODPOWIEDŹ WYŁĄCZNIE W FORMACIE JSON — bez żadnych dodatkowych komentarzy:
{
  "warianty": [
    {
      ${input.channel === 'email' ? '"temat": "Temat wiadomości emailowej",' : ''}
      "tresc": "Gotowa wiadomość do wysłania",
      "katAtaku": "Krótki opis kąta ataku (3-5 słów)",
      "notatkaHandlowca": "Opcjonalna wskazówka co sprawdzić/zmienić przed wysłaniem"
    }
  ]
}`)

  return { systemPrompt: parts.join('\n'), dm1Combos, followUpCombos }
}

// ─── FU #2 Sequential Generation Helpers ─────────────────────────────────────

export const FU2_ROUTING = [
  { szkola: 'PYTANIE', body_id: 'tempo_vs_liczba',   closing_idx: 0 },
  { szkola: 'TEZA',    body_id: 'wlasciciel_blokuje', closing_idx: 1 },
  { szkola: 'LICZBA',  body_id: 'oferty_template',    closing_idx: 2 },
] as const

export function extractFirstWords(tresc: string, n: number): string[] {
  const linie = tresc.split('\n').filter(l => l.trim() && !l.toLowerCase().startsWith('cześć'))
  if (!linie.length) return []
  return linie[0]
    .toLowerCase()
    .replace(/[^\w\sąćęłńóśźż]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, n)
}

export function buildFU2PromptStrict(params: {
  input: OutreachInput
  productName: string
  opening: { szkola: string; template: string; psychology: string }
  body: { id: string; instruction: string; zakazane_zwroty_dla_llm: string[] }
  closing: { template: string; psychology: string }
  blacklistaPierwszychSlow: string[]
  numerWariantu: number
}): string {
  const { input, productName, opening, body, closing, blacklistaPierwszychSlow, numerWariantu } = params
  const name    = input.decisionMakerName || 'tam'
  const firma   = input.companyName
  const branza  = input.industry || 'Twoja branża'

  const substitute = (t: string) => t
    .replace(/{decydent_imie}/g, name)
    .replace(/{nazwa_firmy}/g, firma)
    .replace(/{branza}/g, branza)
    .replace(/{nazwa_produktu_klienta}/g, productName)

  // Extract only the opening sentence (skip "Cześć X,\n\n" prefix)
  const openingLine = substitute(opening.template).split('\n').filter(Boolean).slice(-1)[0]
  const closingLine = substitute(closing.template)
  const bodyInstruction = body.instruction.replace(/{nazwa_produktu_klienta}/g, productName)

  const blacklistaSection = blacklistaPierwszychSlow.length > 0
    ? `\n⛔ ZABRONIONE PIERWSZE SŁOWA (użyte w poprzednich wariantach — absolutnie niedopuszczalne):\n${blacklistaPierwszychSlow.join(', ')}\n\nTwoja pierwsza linia treści (po "Cześć ${name},") MUSI zaczynać się KOMPLETNIE INNYM słowem.\n`
    : ''

  return `Jesteś copywriterem sprzedaży B2B. Generujesz wariant ${numerWariantu} z 3 dla follow-up FU #2.

DANE LEADA:
- Imię: ${name}
- Firma: ${firma}
- Branża: ${branza}
- Obserwacje: ${input.observations || 'brak'}

SZKOŁA NARRACYJNA TEGO WARIANTU: ${opening.szkola}

OBOWIĄZKOWA STRUKTURA:

1. POWITANIE:
"Cześć ${name},"

2. OTWARCIE (użyj DOKŁADNIE tej linii):
"${openingLine}"

3. KORPUS:
${bodyInstruction}

⛔ ZAKAZANE ZWROTY W KORPUSIE (wiadomość zostanie odrzucona jeśli ich użyjesz):
${body.zakazane_zwroty_dla_llm.join(', ')}

4. ZAMKNIĘCIE (użyj DOKŁADNIE tej linii):
"${closingLine}"

5. PODPIS:
"${input.wysylajacy || 'Maciek'}"
${blacklistaSection}
⛔ KRYTYCZNE ZASADY:
- BEZ ŻADNEGO CTA. BEZ pytania na końcu. BEZ "daj znać", "odpisz", "umówmy".
- Długość: 5-6 zdań w głównej treści.
- NIE używaj fraz: "9 na 10", "większość firm", "Dziś nic od Ciebie", "u 9 na 10".

Wygeneruj wiadomość teraz.`
}

export function validateVariant(
  variant: OutreachVariant,
  input: OutreachInput,
): string[] {
  const issues: string[] = []
  const text = variant.tresc

  if (containsBannedPhrases(text)) {
    issues.push('zawiera zakazane frazy')
  }

  // Sprawdź że nazwa produktu pojawia się w treści (poza FU#2 który jest czysto edukacyjny)
  const productName = input.productName
  const requiresProductMention = ['dm1', 'fu1', 'fu3', 'fu4', 'fu5', 'reengagement'].includes(input.messageType)
  if (requiresProductMention && productName && productName !== 'nasz produkt') {
    if (!text.includes(productName)) {
      issues.push(`brak nazwy produktu "${productName}"`)
    }
  }

  if (input.messageType === 'fu2' && /\?/.test(text.split('\n').slice(-3).join('\n'))) {
    issues.push('FU#2 nie może kończyć się pytaniem (brak CTA jest celowy)')
  }

  if (input.messageType === 'fu4') {
    const optionCount = (text.match(/^\s*[123]\.|^\s*[•→]/gm) || []).length
    if (optionCount < 3) issues.push('FU#4 musi mieć dokładnie 3 opcje')
  }

  if (input.messageType === 'fu5') {
    const scarcyFrazy = ['ostatnia szansa', 'kończy się', 'wracam za miesiąc']
    scarcyFrazy.forEach(f => {
      if (text.toLowerCase().includes(f)) issues.push(`FU#5 zawiera scarcity: "${f}"`)
    })
  }

  if (input.messageType === 'dm1' && /https?:\/\//.test(text)) {
    issues.push('DM#1 nie może zawierać linków')
  }

  if (input.channel === 'linkedin') {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3)
    if (sentences.length > 8) issues.push('LinkedIn DM — za długa wiadomość')
  }

  if (input.channel === 'whatsapp') {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3)
    if (sentences.length > 5) issues.push('WhatsApp — za długa wiadomość')
  }

  if (input.channel === 'email' && !variant.temat) {
    issues.push('brak tematu emaila')
  }

  return issues
}
