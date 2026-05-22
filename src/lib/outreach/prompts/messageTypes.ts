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

export function buildDm1TypePrompt(combos: Dm1VariantCombo[]): string {
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
4. OPIS PRODUKTU + COMPANY BRAIN (2-3 zdania): system operacyjny dla agencji,
   zastępuje HubSpot/Make/DocSend/Excel, czas pracy z godzin do minut.
   Następnie OBOWIĄZKOWO zdanie z "Company Brain" — nasze AI, które uczy się
   Waszej firmy z plików o Was i pisze maile oraz oferty jak pracownik z dwuletnim
   stażem, nie jak generyczny ChatGPT. Dostosuj ton do przypisanego stylu.
5. SCARCITY + RISK REVERSAL (1-2 zdania): wczesna cena dla pierwszych klientów
   (znacząco niższa, na stałe) + bezpośredni kontakt do mnie, nie do supportu.
6. EASY OUT: zakończenie przypisane do wariantu (osobna linijka)
7. PODPIS: {wysylajacy}

PRZYPISANIE OTWARĆ, TONÓW I ZAKOŃCZEŃ DO WARIANTÓW:

${variantSpecs}

WAŻNE:
- Użyj DOKŁADNIE przypisanego otwarcia i zakończenia dla każdego wariantu (słowo w słowo)
- Dostosuj TON ŚRODKA (punkty 3-5) do stylu opisanego dla danego wariantu
- "Company Brain" MUSI być w każdym wariancie (kapitalizacja, bez tłumaczeń)
- NIE WSTAWIAJ ŻADNYCH LINKÓW`
}

export interface FollowUpVariantCombo {
  opening_id: string
  body_id: string
  closing_id: string
}

export interface FollowUpVariantBanks {
  OPENING_VARIANTS: Array<{ id: string; template: string; psychology: string }>
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
  dm1:          { label: 'DM #1 — Icebreaker',      day: 'Dzień 1',  angle: 'Pattern interrupt + Company Brain + risk reversal' },
  fu1:          { label: 'FU #1 — Case study',       day: '+3 dni',   angle: 'Koszt alternatywny / martwe godziny handlowca' },
  fu2:          { label: 'FU #2 — Kalendarz',        day: '+5 dni',   angle: 'Czyste dawanie wartości, zero CTA', noCta: true },
  fu3:          { label: 'FU #3 — Social proof',     day: '+3 dni',   angle: 'Edukacja techniczna Company Brain vs ChatGPT' },
  fu4:          { label: 'FU #4 — Direct Ask',       day: '+5 dni',   angle: 'Three-option close', threeOptions: true },
  fu5:          { label: 'FU #5 — Breakup',          day: '+7 dni',   angle: 'Godinowy szacunek, zero sprzedawania' },
  po_ofercie:   { label: 'Po ofercie (48h)',          day: '+2 dni',   angle: 'Diagnostyczne pytanie o konkretny element oferty' },
  reengagement: { label: 'Re-engagement',             day: '+90 dni',  angle: 'Nowy haczyk — powrót po długiej ciszy', requiresContext: true },
}

export const MESSAGE_TYPE_PROMPTS: Record<MessageType, string> = {
  dm1: `TYP WIADOMOŚCI: DM #1 — Icebreaker (Dzień 1)

STRUKTURA — dokładnie ta kolejność:
1. POWITANIE: "Cześć {imie},"
2. PATTERN INTERRUPT: "Napiszę wprost — jest to cold DM."
3. KONTEKST FIRMY (1 zdanie): odniesienie do branży lub obserwacji.
4. OPIS PRODUKTU (2-3 zdania): system operacyjny dla agencji, zastępuje
   HubSpot/Make/DocSend/Excel, czas pracy z godzin do minut.
5. COMPANY BRAIN (1 zdanie): "Różnica jest jedna: w środku siedzi
   Company Brain — nasze AI, które uczy się Waszej firmy z plików o Was,
   i pisze maile oraz oferty jak pracownik z dwuletnim stażem,
   nie jak generyczny ChatGPT."
6. SCARCITY + RISK REVERSAL (1-2 zdania): wczesna cena dla pierwszych
   klientów (znacząco niższa, na stałe) + bezpośredni kontakt do mnie,
   nie do supportu.
7. ZAMKNIĘCIE Z EASY OUT: "Jeśli zaciekawił Cię ten temat, prześlę
   krótkie wideo, które tłumaczy jak działa nasz system. Jeśli nie,
   napisz po prostu „nie" a ja to uszanuję."
8. PODPIS: {wysylajacy}

WAŻNE: NIE WSTAWIAJ ŻADNYCH LINKÓW. Wiadomość musi zawierać "Company Brain".`,

  fu1: `TYP WIADOMOŚCI: FU #1 — Koszt alternatywny (+3 dni)

KĄT: KOSZT ALTERNATYWNY. NIE powtarzaj argumentów z cold DM.
Pokaż ile klienta kosztuje to, że tego nie ma.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. POMOST: "Wracam jeszcze raz, bo pomyślałem o tym z trochę innej strony."
3. PROBLEM W LICZBACH (3-4 zdania): "Większość agencji {branza}
   nie traci kasy na pozyskiwaniu klientów — traci ją na martwych
   godzinach handlowca. Research leadów, przepisywanie danych, pisanie
   ofert od zera, ręczne follow-upy. U jednej osoby to często 8-12 godzin
   tygodniowo, w których nikt nie zarabia."
4. ROZWIĄZANIE (1 zdanie): "Company Brain zdejmuje większość tego
   z handlowca — bo zna Waszą firmę z plików o Was i robi to za niego."
5. CTA: "Mam 7-minutowe wideo które pokazuje jak to konkretnie działa. Wysłać?"
6. PODPIS: {wysylajacy}

WAŻNE: liczby 8-12 godzin są ogólnym oszacowaniem, nie wymyślaj
konkretnych klientów ani case studies.`,

  fu2: `TYP WIADOMOŚCI: FU #2 — Czyste dawanie wartości (+5 dni)

KĄT: DAWANIE WARTOŚCI BEZ PYTANIA O NIC. To jedyna wiadomość w sekwencji,
która CELOWO nie ma żadnego CTA.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. ZAPOWIEDŹ BRAKU PYTANIA: "Dziś nic od Ciebie nie chcę — chcę tylko
   podzielić się obserwacją, którą widzę u 9 na 10 agencji {branza}."
3. INSIGHT (3-4 zdania): obserwacja branżowa, konkretna, oparta na
   typowych problemach tej branży.
4. PODSUMOWANIE INSIGHTU (1 krótkie zdanie): "To nie jest problem [X].
   To problem [Y]."
5. ZAKOŃCZENIE BEZ CTA: "Pomyślałem że Ci się to może przydać —
   niezależnie czy będziemy kiedyś razem pracować, czy nie."
6. PODPIS: {wysylajacy}

KRYTYCZNE: NIE DODAWAJ żadnego pytania, żadnego linku, żadnego CTA na końcu.
Zdanie "niezależnie czy będziemy kiedyś razem pracować, czy nie" MUSI być
w tej wiadomości. Brak CTA jest celowy i absolutnie obowiązkowy.`,

  fu3: `TYP WIADOMOŚCI: FU #3 — Edukacja techniczna (+3 dni)

KĄT: EDUKACJA TECHNICZNA + POZYCJONOWANIE EKSPERTA.
NIE używamy zmyślonych case studies. Wyjaśniamy mechanizm techniczny.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. WPROWADZENIE: "Wracam z jedną konkretną rzeczą, bo dużo agencji
   o to pyta."
3. PYTANIE KTÓRE KLIENT MA W GŁOWIE: "„Czym Company Brain różni się
   od ChatGPT z wgranymi plikami?""
4. KRÓTKA EDUKACJA TECHNICZNA (3-4 zdania): ChatGPT z plikami pamięta
   je w jednej rozmowie, potem zapomina. Company Brain trzyma wiedzę
   w wektorowej bazie i używa jej w każdym mailu, ofercie, scoringu —
   codziennie, miesiącami. Analogia: praktykant z notatkami
   vs. pracownik z głową pełną wiedzy.
5. CTA Z PRZYPOMNIENIEM SCARCITY: "Wczesna cena dla pierwszych
   klientów nadal obowiązuje. Mam 7-minutowe wideo które pokazuje
   to w działaniu — wysłać?"
6. PODPIS: {wysylajacy}`,

  fu4: `TYP WIADOMOŚCI: FU #4 — Direct Ask / Three-option close (+5 dni)

KĄT: THREE-OPTION CLOSE. Klient musi zdecydować lub świadomie odpaść.
TO JEST JEDYNA WIADOMOŚĆ W SEKWENCJI, KTÓRA MA TRZY OPCJE NA KOŃCU.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. RAMA SZACUNKU: "Pytam wprost, żeby nie marnować Twojego czasu."
3. SCARCITY KONTEKSTOWA (2 zdania): "Wczesna cena Company Brain —
   ta która zostaje na stałe — jest dostępna jeszcze dla pierwszych
   klientów w tej rundzie. Potem wraca standardowa, która jest
   znacząco wyższa."
4. TRZY OPCJE (dokładnie ten format):
   "Trzy proste opcje:
   1. „Wyślij wideo" — 7 minut, pokazuje cały system w działaniu
   2. „Mam pytanie" — odpisz pytaniem, ja odpowiadam
   3. „Nie teraz" — szanuję, nie piszę więcej w tym wątku"
5. PYTANIE: "Która opcja?"
6. PODPIS: {wysylajacy}

WAŻNE: NIE obiecuj konkretnej krotności ceny. Zostań przy "znacząco wyższa".
Trzy opcje MUSZĄ być w tej wiadomości — to jest kluczowy element.`,

  fu5: `TYP WIADOMOŚCI: FU #5 — Breakup (+7 dni)

KĄT: GODINOWY SZACUNEK. Zero chwytów, zero sprzedawania.
Zamknięcie cyklu bez urażania.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. JASNE OZNACZENIE OSTATNIEJ WIADOMOŚCI: "To ostatnia wiadomość
   w tym wątku."
3. OTWARCIE NA "NIE" BEZ PRETENSJI (2 zdania): "Rozumiem w 100%
   jeśli to nie jest dobry moment dla Was — albo zwyczajnie nie jest
   to dla Was. Bez pretensji."
4. ZOSTAWIENIE OTWARTYCH DRZWI (1 zdanie): "Gdybyś kiedyś chciał
   na spokojnie zobaczyć jak działa Company Brain, jestem tu.
   Wystarczy odpisać."
5. ŻYCZENIE NA KONIEC: "Trzymam kciuki za rozwój {nazwa_firmy}."
6. PODPIS: {wysylajacy}

WAŻNE: NIE używaj żadnych chwytów ("ostatnia szansa", "kończy się
oferta", "wracam za miesiąc"). Czysty, ludzki szacunek.
NIE SPRZEDAWAJ. To jest zamknięcie, nie jeszcze jedna szansa.`,

  po_ofercie: `TYP WIADOMOŚCI: Po ofercie (48h)

KĄT: KONKRETNE PYTANIE DIAGNOSTYCZNE O OFERTĘ.
Klient dostał ofertę 48h temu i nie odpisał. Nie pytaj "co o niej myślisz".

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. ODNIESIENIE DO OFERTY: "Wysłałem Ci ofertę 2 dni temu i nie chciałem
   zostawić tematu w zawieszeniu."
3. JEDNO KONKRETNE PYTANIE (wybierz jedno na podstawie kontekstu):
   - Jeśli kontekst wskazuje zainteresowanie cennikiem: "Czy któreś
     z założeń cenowych wymaga wyjaśnienia?"
   - Jeśli kontekst wskazuje zakres: "Czy któryś z modułów wymaga
     doprecyzowania pod Wasz proces?"
   - Jeśli brak kontekstu: "Czy jest w niej coś, co wymaga wyjaśnienia
     — na poziomie zakresu, ceny lub harmonogramu?"
4. CTA: "Mogę dzisiaj zarezerwować 15 minut na omówienie."
5. PODPIS: {wysylajacy}

ZASADA: krótka, konkretna, profesjonalna. Klient zna już produkt.`,

  reengagement: `TYP WIADOMOŚCI: Re-engagement (+90 dni)

KĄT: NOWY HACZYK. Musisz mieć PRAWDZIWY powód do wracania.
Pole kontekst MUSI zawierać powód reaktywacji (nowy moduł, news,
zmiana u klienta). Jeśli kontekst jest pusty — NIE generuj wiadomości.

STRUKTURA:
1. POWITANIE: "Cześć {imie},"
2. UZNANIE PRZERWY: "Wiem że zostawiłem temat. Wracam, bo {nowy_haczyk}."
3. RELEVANCE DLA NICH (1-2 zdania): konkretne wyjaśnienie dlaczego
   ten nowy haczyk dotyczy ich biznesu — używaj branży i obserwacji.
4. CTA: "Daj znać czy chcesz 5 minut o tym pogadać."
5. PODPIS: {wysylajacy}

ZASADA: Wracasz TYLKO Z KONKRETEM. Jeśli pole kontekst jest puste,
zwróć odpowiedź z samym komunikatem:
{"error": "Brak kontekstu reaktywacji — uzupełnij pole Kontekst przed generowaniem re-engagement."}`,
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

export function buildFollowUpTypePrompt(typ: MessageType, combos: FollowUpVariantCombo[]): string {
  const banks = getVariantBanks(typ)
  const meta = MESSAGE_TYPE_META[typ]

  const variantSpecs = combos.map((combo, i) => {
    const opening = banks.OPENING_VARIANTS.find(v => v.id === combo.opening_id)!
    const body = banks.BODY_VARIANTS.find(v => v.id === combo.body_id)!
    const closing = banks.CLOSING_VARIANTS.find(v => v.id === combo.closing_id)!
    return `WARIANT ${i + 1}:
  Otwarcie (użyj słowo w słowo, podstawiając {decydent_imie}/{branza}/{nazwa_firmy}/{nowy_haczyk} z DANYCH LEADA):
  "${opening.template}"
  Styl korpusu: ${body.instruction}
  Zamknięcie (użyj słowo w słowo, podstawiając zmienne):
  "${closing.template}"`
  }).join('\n\n')

  return `TYP WIADOMOŚCI: ${meta.label} (${meta.day})

KĄT STRATEGICZNY (zachowany dla wszystkich wariantów): ${meta.angle}

OBOWIĄZKOWA STRUKTURA dla każdego wariantu (ta kolejność):
1. OTWARCIE: przypisane do wariantu (podstaw zmienne z DANYCH LEADA)
2. KORPUS: wg instrukcji stylu przypisanego do wariantu
3. ZAMKNIĘCIE: przypisane do wariantu (podstaw zmienne)
4. PODPIS: wartość z pola "Podpisuje się"

PRZYPISANIE OTWARĆ, STYLÓW KORPUSU I ZAMKNIĘĆ DO WARIANTÓW:

${variantSpecs}`
}

export function getFollowUpVariantLabel(typ: MessageType, combo: FollowUpVariantCombo): { katAtaku: string; notatkaHandlowca: string } {
  const banks = getVariantBanks(typ)
  const opening = banks.OPENING_VARIANTS.find(v => v.id === combo.opening_id)
  const body = banks.BODY_VARIANTS.find(v => v.id === combo.body_id)
  const closing = banks.CLOSING_VARIANTS.find(v => v.id === combo.closing_id)
  return {
    katAtaku: `${combo.opening_id} + ${combo.body_id} + ${combo.closing_id}`,
    notatkaHandlowca: `Profil: ${opening?.psychology ?? ''}. Styl: ${body?.id ?? ''}. Zakończenie: ${closing?.psychology ?? ''}.`,
  }
}
