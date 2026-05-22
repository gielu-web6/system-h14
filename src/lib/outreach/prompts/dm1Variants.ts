export interface OpeningVariant {
  id: string
  label: string
  template: string
}

export interface EasyOutVariant {
  id: string
  label: string
  template: string
}

export interface MiddleToneVariant {
  id: string
  label: string
  instruction: string
}

export interface Dm1VariantCombo {
  opening_id: string
  easy_out_id: string
  middle_tone_id: string
}

export const OPENING_VARIANTS: OpeningVariant[] = [
  {
    id: 'wprost',
    label: 'Wprost - cold DM',
    template: 'Napiszę wprost — to cold DM.',
  },
  {
    id: 'zwiezly',
    label: 'Obietnica zwięzłości',
    template: 'To wiadomość od kogoś, kogo nie znasz — więc obiecuję, że będę zwięzły.',
  },
  {
    id: 'szacunek_czasu',
    label: 'Szacunek do czasu',
    template: 'Wiem że dostajesz dużo takich wiadomości. Postaram się żebym ja Ci nie zmarnował czasu.',
  },
  {
    id: 'do_rzeczy',
    label: 'Pierwszy raz - od razu do rzeczy',
    template: 'Piszę pierwszy raz i od razu do rzeczy.',
  },
  {
    id: 'sprzedaje_jawnie',
    label: 'Jawna deklaracja sprzedaży',
    template: 'Jestem osobą która próbuje Ci coś sprzedać. Dam Ci 5 zdań, potem zdecydujesz.',
  },
  {
    id: 'krotka_30s',
    label: '30 sekund',
    template: 'Krótka wiadomość od obcego człowieka — daj mi 30 sekund.',
  },
]

export const EASY_OUT_VARIANTS: EasyOutVariant[] = [
  {
    id: 'nie_uszanuje',
    label: 'Klasyczne - nie i uszanuję',
    template: 'Jeśli to dla Was — odpiszę szczegółami. Jeśli nie, napisz „nie” i to uszanuję.',
  },
  {
    id: 'zignoruj',
    label: 'Po prostu zignoruj',
    template: 'Jeśli temat Cię interesuje — daj znać. Jeśli nie, po prostu mnie zignoruj, nie obrażę się.',
  },
  {
    id: 'pokaz_lub_zamykam',
    label: 'Pokaż lub zamykam temat',
    template: 'Jeśli to dla Was, odpisz „pokaż”. Jeśli nie — „nie teraz” i zamykam temat.',
  },
  {
    id: 'czy_zawracac',
    label: 'Bezpośrednie pytanie',
    template: 'Powiedz mi czy temat Cię interesuje, czy mam nie zawracać głowy.',
  },
  {
    id: 'tak_lub_nic',
    label: 'Tak lub żadnych wiadomości',
    template: 'Jeśli tak — odpiszę. Jeśli nie — żadnych kolejnych wiadomości ode mnie.',
  },
  {
    id: 'tak_lub_nie_obie_spoko',
    label: 'Tak lub nie - obie spoko',
    template: 'Daj znać tak lub nie — obie odpowiedzi są spoko.',
  },
]

export const MIDDLE_TONE_VARIANTS: MiddleToneVariant[] = [
  {
    id: 'biznesowy',
    label: 'Biznesowy / rzeczowy',
    instruction: 'Ton biznesowy, rzeczowy. Konkretne korzyści, suche fakty, bez emocji. Słownictwo: "zastępuje", "skraca", "zwiększa efektywność".',
  },
  {
    id: 'ludzki',
    label: 'Ludzki / konwersacyjny',
    instruction: 'Ton ludzki, jak tłumaczysz znajomemu. Bardziej miękkie słownictwo, więcej "Wasze/Wam", mniej żargonu.',
  },
  {
    id: 'mocny',
    label: 'Mocny / energiczny',
    instruction: 'Ton mocny, z energią. Krótkie zdania, mocne czasowniki, śmiała obietnica.',
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickDm1Combinations(count: number): Dm1VariantCombo[] {
  const openings = shuffle(OPENING_VARIANTS).slice(0, count)
  const easyOuts = shuffle(EASY_OUT_VARIANTS).slice(0, count)

  return Array.from({ length: count }, (_, i) => ({
    opening_id: openings[i].id,
    easy_out_id: easyOuts[i].id,
    middle_tone_id: MIDDLE_TONE_VARIANTS[i % MIDDLE_TONE_VARIANTS.length].id,
  }))
}

export function getDm1VariantLabel(combo: Dm1VariantCombo): { katAtaku: string; notatkaHandlowca: string } {
  const opening = OPENING_VARIANTS.find(v => v.id === combo.opening_id)!
  const easyOut = EASY_OUT_VARIANTS.find(v => v.id === combo.easy_out_id)!
  const tone = MIDDLE_TONE_VARIANTS.find(v => v.id === combo.middle_tone_id)!
  return {
    katAtaku: `${opening.id} + ${easyOut.id} (ton: ${tone.id})`,
    notatkaHandlowca: `Otwarcie: ${opening.label}. Zakończenie: ${easyOut.label}.`,
  }
}
