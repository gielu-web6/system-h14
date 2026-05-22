import { BASE_RULES, containsBannedPhrases } from './prompts/base'
import { CHANNEL_RULES, type Channel } from './prompts/channels'
import {
  MESSAGE_TYPE_PROMPTS,
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
}

export interface OutreachVariant {
  temat?: string
  tresc: string
  katAtaku: string
  notatkaHandlowca?: string
}

export interface OutreachError {
  error: string
}

export interface ComposeResult {
  systemPrompt: string
  dm1Combos?: Dm1VariantCombo[]
  followUpCombos?: FollowUpVariantCombo[]
}

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

  const openings = shuffle(banks.OPENING_VARIANTS)
  const closings = shuffle(banks.CLOSING_VARIANTS)

  return Array.from({ length: count }, (_, i) => ({
    opening_id: openings[i % openings.length].id,
    body_id: banks.BODY_VARIANTS[i % banks.BODY_VARIANTS.length].id,
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

  let typePrompt: string
  let dm1Combos: Dm1VariantCombo[] | undefined
  let followUpCombos: FollowUpVariantCombo[] | undefined

  if (input.messageType === 'dm1') {
    dm1Combos = pickDm1Combinations(count)
    typePrompt = buildDm1TypePrompt(dm1Combos)
  } else if (FOLLOW_UP_TYPES.includes(input.messageType)) {
    followUpCombos = pickFollowUpCombinations(input.messageType, count)
    typePrompt = buildFollowUpTypePrompt(input.messageType, followUpCombos)
  } else {
    typePrompt = MESSAGE_TYPE_PROMPTS[input.messageType]
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
- Branża: ${input.industry || 'agencja marketingowa'}
- Obserwacje: ${input.observations || '(brak — wygeneruj na podstawie branży)'}
- Kontekst dodatkowy: ${input.context || '(brak)'}
- Podpisuje się: ${input.wysylajacy || 'Maciek'}`)
  parts.push('')
  parts.push(`ZADANIE: Wygeneruj dokładnie ${count} ZRÓŻNICOWANE warianty tej wiadomości.
Każdy wariant musi mieć INNY KĄT ATAKU (np. ból finansowy / mechanizm techniczny / ryzyko / okazja),
ale WSZYSTKIE warianty muszą się trzymać struktury opisanej powyżej dla tego typu wiadomości.

Typ wiadomości: ${meta.label} (${meta.day})
Domyślny kąt: ${meta.angle}`)

  if (meta.noCta) {
    parts.push('KRYTYCZNE: Ta wiadomość NIE MA CTA. Żadnego pytania, żadnego linku, żadnej prośby na końcu. To jest celowe.')
  }
  if (meta.threeOptions) {
    parts.push('KRYTYCZNE: Ta wiadomość MUSI mieć dokładnie 3 opcje na końcu w formacie numerowanym.')
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

export function validateVariant(
  variant: OutreachVariant,
  input: OutreachInput,
): string[] {
  const issues: string[] = []
  const text = variant.tresc

  if (containsBannedPhrases(text)) {
    issues.push('zawiera zakazane frazy')
  }

  const requiresBrainMention = ['dm1', 'fu1', 'fu3', 'fu4', 'fu5', 'reengagement'].includes(input.messageType)
  if (requiresBrainMention && !text.includes('Company Brain')) {
    issues.push('brak "Company Brain"')
  }

  if (input.messageType === 'fu2' && /\?/.test(text.split('\n').slice(-3).join('\n'))) {
    issues.push('FU#2 nie może kończyć się pytaniem (brak CTA jest celowy)')
  }

  if (input.messageType === 'fu4') {
    const optionCount = (text.match(/^\s*[123]\./gm) || []).length
    if (optionCount < 3) issues.push('FU#4 musi mieć dokładnie 3 opcje')
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
