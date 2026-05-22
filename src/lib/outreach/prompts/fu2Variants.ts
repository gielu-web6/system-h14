export const FU2_OPENING_VARIANTS = [
  {
    id: 'nic_nie_chce',
    template: 'Cześć {decydent_imie},\n\nDziś nic od Ciebie nie chcę — chcę tylko podzielić się obserwacją, którą widzę u 9 na 10 agencji {branza}.',
    psychology: 'Najmocniejszy pattern interrupt w sekwencji. Klient czyta, bo nikt nigdy nie pisze że nic nie chce.',
  },
  {
    id: 'bez_pytania',
    template: 'Cześć {decydent_imie},\n\nDziś bez pytania — tylko jedna myśl, która może Ci się przydać niezależnie czy będziemy pracować razem.',
    psychology: 'Wyraźnie sygnalizuje brak presji. Słowo "myśl" obniża próg.',
  },
  {
    id: 'dziele_sie',
    template: 'Cześć {decydent_imie},\n\nDziś nie sprzedaję — dzielę się rzeczą, którą widzę u 9 na 10 agencji {branza}.',
    psychology: 'Otwarte przyznanie "nie sprzedaję" rozbraja czujność.',
  },
  {
    id: 'obietnica_zero_pytania',
    template: 'Cześć {decydent_imie},\n\nObiecuję — dziś żadnego pytania na końcu. Tylko obserwacja, która może Ci się przydać.',
    psychology: 'Lekki humor i zaskoczenie (kto obiecuje brak pytania?). Wyróżnia się.',
  },
]

export const FU2_BODY_VARIANTS = [
  {
    id: 'tempo_odpowiedzi',
    instruction: 'Insight o tempie odpowiedzi: agencje myślą że problem to brak leadów, a problem to tempo (lead pisze w środę, handlowiec odpisuje w piątek, lead idzie do konkurencji). Zakończ zdaniem "To nie problem liczby leadów. To problem tempa odpowiedzi."',
  },
  {
    id: 'wlasciciel_blokuje',
    instruction: 'Insight o właścicielu jako wąskim gardle (bez używania słów "wąskie gardło"!): agencje próbują skalować, ale wszystko musi przejść przez głowę właściciela. Każda decyzja, każda oferta, każdy mail. Zakończ zdaniem "Firma rośnie tylko tak szybko, jak szybko Ty zdążysz wszystko ogarnąć."',
  },
  {
    id: 'oferty_template',
    instruction: 'Insight o ofertach: większość agencji wysyła oferty które wyglądają jak template, bo nie ma czasu na personalizację. Klient czyta i myśli "to samo dostałem od 5 innych firm". Zakończ zdaniem "Generyczna oferta to drogi sposób, żeby przegrać z tańszą konkurencją."',
  },
]

// KRYTYCZNE: żadne z tych zakończeń NIE może być pytaniem ani CTA.
export const FU2_CLOSING_VARIANTS = [
  {
    id: 'bez_pretensji',
    template: 'Pomyślałem że Ci się to może przydać — niezależnie czy będziemy kiedyś razem pracować, czy nie.',
    psychology: 'Klasyk Godina. Daje wartość bez prośby. Klient czuje że nie sprzedajesz.',
  },
  {
    id: 'po_prostu_warto',
    template: 'Po prostu warto było to powiedzieć — dla Was lub przeciw Wam.',
    psychology: 'Lekko żartobliwie. Pokazuje że jesteś po stronie klienta, niezależnie od deala.',
  },
  {
    id: 'na_przyszlosc',
    template: 'Wrzucam to jako rzecz do przemyślenia. Nic nie musisz z tym robić.',
    psychology: 'Najbardziej luźne zakończenie. Zero presji, czysta wartość.',
  },
  {
    id: 'zostawiam_z_tym',
    template: 'Zostawiam Cię z tą myślą. Jeśli coś z tego wynika — wiesz gdzie mnie znaleźć.',
    psychology: 'Daje subtelne "drzwi otwarte" bez nachalności.',
  },
]
