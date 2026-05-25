import {
  OPENING_VARIANTS,
  EASY_OUT_VARIANTS,
  MIDDLE_TONE_VARIANTS,
  type Dm1VariantCombo,
} from './dm1Variants'
import * as fu1 from './fu1Variants'
import * as fu2 from './fu2Variants'
import * as fu3 from './fu3Variants'
import * as fu4 from './fu4Variants'
import * as fu5 from './fu5Variants'
import * as poOfercie from './poOfercieVariants'
import * as reengagement from './reengagementVariants'

export function buildDm1TypePrompt(combos: Dm1VariantCombo[], productName = 'nasz produkt'): string {
  const variantSpecs = combos.map((combo, i) => {
    const opening = OPENING_VARIANTS.find(v => v.id === combo.opening_id)!
    const easyOut = EASY_OUT_VARIANTS.find(v => v.id === combo.easy_out_id)!
    const tone = MIDDLE_TONE_VARIANTS.find(v => v.id === combo.middle_tone_id)!
    return `WARIANT ${i + 1}:
  Otwarcie (użyj słowo w słowo): "${opening.template}"
  Ton środka: ${tone.instruction}
  Zakończenie (użyj słowo w słowo): "${easyOut.template}"`
  }).join('\n\n')

  return `TYP WIADOMOŚCI: DM #1 — Icebreaker (Dzień 1)

OBOWIĄZKOWA STRUKTURA dla każdego wariantu (ta kolejność):
1. POWITANIE: "Cześć {imie},"
2. PATTERN INTERRUPT: otwarcie przypisane do wariantu (po powitaniu, osobna linijka)
3. KONTEKST FIRMY (1 zdanie): odniesienie do branży lub obserwacji
4. OPIS PRODUKTU (2-3 zdania): co robi "${productName}", jakie narzędzia zastępuje lub jakie
   problemy zdejmuje z zespołu. Następnie OBOWIĄZKOWO zdanie które opisuje że ten system
   uczy się firmy klienta i pisze wiadomości jak pracownik z wiedzą o tej firmie — nie jak
   generyczny AI. Dostosuj ton do przypisanego stylu.
5. SCARCITY + RISK REVERSAL (1-2 zdania): specjalna oferta dla pierwszych klientów
   + bezpośredni kontakt, nie do supportu.
6. EASY OUT: zakończenie przypisane do wariantu (osobna linijka)
7. PODPIS: {wysylajacy}

PRZYPISANIE OTWARĆ, TONÓW I ZAKOŃCZEŃ DO WARIANTÓW:

${variantSpecs}

WAŻNE:
- Użyj DOKŁADNIE przypisanego otwarcia i zakończenia dla każdego wariantu (słowo w słowo)
- Dostosuj TON ŚRODKA (punkty 3-5) do stylu opisanego dla danego wariantu
- Nazwa produktu "${productName}" MUSI być w każdym wariancie
- NIE WSTAWIAJ ŻADNYCH LINKÓW`
}

export interface FollowUpVariantCombo {
  opening_id: string
  body_id: string
  closing_id: string
}

export interface FollowUpVariantBanks {
  OPENING_VARIANTS: Array<{ id: string; szkola?: string; template: string; psychology: string }>
  BODY_VARIANTS: Array<{ id: string; instruction: string }>
  CLOSING_VARIANTS: Array<{ id: string; template: string; psychology: string }>
}

export type MessageType =
  | 'dm1'
  | 'fu1'
  | 'fu2'
  | 'fu3'
  | 'fu4'
  | 'fu5'
  | 'po_ofercie'
  | 'reengagement'

export interface MessageTypeMeta {
  label: string
  day: string
  angle: string
  requiresContext?: boolean
  noCta?: boolean
  threeOptions?: boolean
}

export const MESSAGE_TYPE_META: Record<MessageType, MessageTypeMeta> = {
  dm1:          { label: 'DM #1 — Icebreaker',      day: 'Dzień 1',  angle: 'Pattern interrupt + opis produktu + risk reversal' },
  fu1:          { label: 'FU #1 — Koszt alternatywny', day: '+3 dni', angle: 'Koszt alternatywny / martwe godziny handlowca' },
  fu2:          { label: 'FU #2 — Czysta wartość',   day: '+5 dni',   angle: 'Dawanie wartości bez CTA', noCta: true },
  fu3:          { label: 'FU #3 — Edukacja techniczna', day: '+3 dni', angle: 'AI z bazą wektorową vs generyczne AI' },
  fu4:          { label: 'FU #4 — Direct Ask',       day: '+5 dni',   angle: 'Three-option close', threeOptions: true },
  fu5:          { label: 'FU #5 — Breakup',          day: '+7 dni',   angle: 'Godinowy szacunek, zero sprzedawania' },
  po_ofercie:   { label: 'Po ofercie (48h)',          day: '+2 dni',   angle: 'Diagnostyczne pytanie o konkretny element oferty' },
  reengagement: { label: 'Re-engagement',             day: '+90 dni',  angle: 'Nowy haczyk — powrót po długiej ciszy', requiresContext: true },
}

export const FOLLOW_UP_TYPES: MessageType[] = ['fu1', 'fu2', 'fu3', 'fu4', 'fu5', 'po_ofercie', 'reengagement']

export function getVariantBanks(typ: MessageType): FollowUpVariantBanks {
  switch (typ) {
    case 'fu1': return { OPENING_VARIANTS: fu1.FU1_OPENING_VARIANTS, BODY_VARIANTS: fu1.FU1_BODY_VARIANTS, CLOSING_VARIANTS: fu1.FU1_CLOSING_VARIANTS }
    case 'fu2': return { OPENING_VARIANTS: fu2.FU2_OPENING_VARIANTS, BODY_VARIANTS: fu2.FU2_BODY_VARIANTS, CLOSING_VARIANTS: fu2.FU2_CLOSING_VARIANTS }
    case 'fu3': return { OPENING_VARIANTS: fu3.FU3_OPENING_VARIANTS, BODY_VARIANTS: fu3.FU3_BODY_VARIANTS, CLOSING_VARIANTS: fu3.FU3_CLOSING_VARIANTS }
    case 'fu4': return { OPENING_VARIANTS: fu4.FU4_OPENING_VARIANTS, BODY_VARIANTS: fu4.FU4_BODY_VARIANTS, CLOSING_VARIANTS: fu4.FU4_CLOSING_VARIANTS }
    case 'fu5': return { OPENING_VARIANTS: fu5.FU5_OPENING_VARIANTS, BODY_VARIANTS: fu5.FU5_BODY_VARIANTS, CLOSING_VARIANTS: fu5.FU5_CLOSING_VARIANTS }
    case 'po_ofercie': return { OPENING_VARIANTS: poOfercie.PO_OFERCIE_OPENING_VARIANTS, BODY_VARIANTS: poOfercie.PO_OFERCIE_BODY_VARIANTS, CLOSING_VARIANTS: poOfercie.PO_OFERCIE_CLOSING_VARIANTS }
    case 'reengagement': return { OPENING_VARIANTS: reengagement.REENGAGEMENT_OPENING_VARIANTS, BODY_VARIANTS: reengagement.REENGAGEMENT_BODY_VARIANTS, CLOSING_VARIANTS: reengagement.REENGAGEMENT_CLOSING_VARIANTS }
    default: throw new Error(`Nieznany typ wiadomości dla banków wariantów: ${typ}`)
  }
}

export function buildFollowUpTypePrompt(
  typ: MessageType,
  combos: FollowUpVariantCombo[],
  productName = 'nasz produkt',
  assetCta = 'krótki materiał informacyjny',
  scarcity = '',
): string {
  const banks = getVariantBanks(typ)
  const meta = MESSAGE_TYPE_META[typ]

  const variantSpecs = combos.map((combo, i) => {
    const opening = banks.OPENING_VARIANTS.find(v => v.id === combo.opening_id)!
    const body = banks.BODY_VARIANTS.find(v => v.id === combo.body_id)!
    const closing = banks.CLOSING_VARIANTS.find(v => v.id === combo.closing_id)!

    // Podstaw produkt, asset i scarcity w instrukcjach corpo i szablonach zamknięcia
    const resolvedBodyInstruction = body.instruction
      .replace(/\{nazwa_produktu_klienta\}/g, productName)
      .replace(/\{asset_cta\}/g, assetCta)
      .replace(/\{scarcity_lub_oferta\}/g, scarcity || 'specjalna oferta dla pierwszych klientów')

    const resolvedClosingTemplate = closing.template
      .replace(/\{asset_cta\}/g, assetCta)
      .replace(/\{scarcity_lub_oferta\}/g, scarcity || 'specjalna oferta dla pierwszych klientów')

    const szkolaLabel = opening.szkola ? ` [Szkoła: ${opening.szkola}]` : ''

    return `WARIANT ${i + 1}${szkolaLabel}:
  Otwarcie (użyj słowo w słowo, podstawiając {decydent_imie}/{branza}/{nazwa_firmy}/{nowy_haczyk} z DANYCH LEADA):
  "${opening.template}"
  Styl korpusu: ${resolvedBodyInstruction}
  Zamknięcie (użyj słowo w słowo, podstawiając zmienne z DANYCH LEADA):
  "${resolvedClosingTemplate}"`
  }).join('\n\n')

  return `TYP WIADOMOŚCI: ${meta.label} (${meta.day})

KĄT STRATEGICZNY (zachowany dla wszystkich wariantów): ${meta.angle}

NAZWA PRODUKTU (używaj w treści zamiast "nasz produkt"/"nasze AI"): "${productName}"

OBOWIĄZKOWA STRUKTURA dla każdego wariantu (ta kolejność):
1. OTWARCIE: przypisane do wariantu (podstaw zmienne z DANYCH LEADA)
2. KORPUS: wg instrukcji stylu przypisanego do wariantu
3. ZAMKNIĘCIE: przypisane do wariantu (podstaw zmienne)
4. PODPIS: wartość z pola "Podpisuje się"

PRZYPISANIE OTWARĆ, STYLÓW KORPUSU I ZAMKNIĘĆ DO WARIANTÓW:

${variantSpecs}`
}

export function getFollowUpVariantLabel(
  typ: MessageType,
  combo: FollowUpVariantCombo,
): { katAtaku: string; notatkaHandlowca: string; szkola_otwarcia?: string } {
  const banks = getVariantBanks(typ)
  const opening = banks.OPENING_VARIANTS.find(v => v.id === combo.opening_id)
  const body = banks.BODY_VARIANTS.find(v => v.id === combo.body_id)
  const closing = banks.CLOSING_VARIANTS.find(v => v.id === combo.closing_id)
  return {
    katAtaku: opening?.szkola
      ? `Szkoła: ${opening.szkola} → korpus: ${combo.body_id}`
      : `${combo.opening_id} + ${combo.body_id} + ${combo.closing_id}`,
    notatkaHandlowca: `Otwarcie [${opening?.szkola ?? 'brak szkoły'}]: ${opening?.psychology ?? ''}. Zakończenie: ${closing?.psychology ?? ''}.`,
    szkola_otwarcia: opening?.szkola,
  }
}
