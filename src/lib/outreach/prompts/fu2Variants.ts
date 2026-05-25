export const FU2_OPENING_VARIANTS = [
  {
    id: 'pytanie_diagnostyczne',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy zauważyłeś, że w {branza} prawie wszystkie firmy mają ten sam problem — ale prawie żadna go nie nazywa głośno?',
    psychology: 'Pytanie + sugestia że dotykasz tabu. Klient musi przeczytać dalej.',
  },
  {
    id: 'teza_o_branzy',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nWiększość firm w {branza} myli "brak klientów" z "brak czasu na klientów" — i to drugie kosztuje znacznie więcej.',
    psychology: 'Mocna teza prowokacyjna. Klient testuje na własnej firmie.',
  },
  {
    id: 'fakt_9_na_10',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\n9 na 10 firm w {branza} z którymi rozmawiam ma ten sam problem — i prawie żadna nie nazywa go po imieniu.',
    psychology: 'Konkretna proporcja. CEO sprawdza czy jest jednym z 9 czy 10-tym.',
  },
  {
    id: 'u_was_obserwacja',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nU firm wielkości {nazwa_firmy} widzę często jedną rzecz, której nikt nie chce powiedzieć głośno.',
    psychology: 'Personalizacja + intryga. Klient czyta żeby się dowiedzieć "co".',
  },
  {
    id: 'dzis_bez_pytania',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nDziś nic od Ciebie nie chcę — chcę tylko podzielić się obserwacją, którą widzę u 9 na 10 firm w {branza}.',
    psychology: 'Mocny pattern interrupt przez deklarację "nic nie chcę". Klasyk Godina.',
  },
]

export const FU2_BODY_VARIANTS = [
  {
    id: 'tempo_vs_liczba',
    instruction: 'Insight o tempie odpowiedzi vs liczbie leadów. Firmy myślą że problem to za mało leadów, a problem to TEMPO ich obsługi (lead pisze w środę, odpisują w piątek, lead już rozmawia z konkurencją). Zakończ zdaniem "To nie problem liczby. To problem tempa." NIE WSPOMINAJ o produkcie ani rozwiązaniu — to wiadomość czysto edukacyjna.',
  },
  {
    id: 'wlasciciel_blokuje',
    instruction: 'Insight o tym że firma rośnie tylko tak szybko jak właściciel zdąży wszystko ogarnąć. Każda decyzja, każda oferta, każdy ważniejszy mail przechodzi przez jego głowę. To powolnia rozwój. NIE WSPOMINAJ produktu — to obserwacja branżowa, nie sprzedaż.',
  },
  {
    id: 'oferty_template',
    instruction: 'Insight o ofertach które wyglądają jak template — klient czyta "to samo dostał od 5 innych firm" i wybiera po cenie. Generyczna oferta to droga przegrana. NIE WSPOMINAJ produktu — to insight o branży.',
  },
]

// KRYTYCZNE: żadne z tych zakończeń NIE może zawierać znaku zapytania ani CTA.
export const FU2_CLOSING_VARIANTS = [
  {
    id: 'bez_pretensji',
    template: 'Pomyślałem że Ci się to może przydać — niezależnie czy będziemy kiedyś razem pracować, czy nie.',
    psychology: 'Klasyk Godina. Daje wartość bez prośby. Klient czuje że nie sprzedajesz.',
  },
  {
    id: 'warto_powiedziec',
    template: 'Po prostu warto było to powiedzieć — dla Was lub przeciw Wam.',
    psychology: 'Lekko żartobliwie. Pokazuje że jesteś po stronie klienta niezależnie od deala.',
  },
  {
    id: 'wrzucam_jako',
    template: 'Wrzucam to jako rzecz do przemyślenia. Nic nie musisz z tym robić.',
    psychology: 'Najbardziej luźne zakończenie. Zero presji, czysta wartość.',
  },
  {
    id: 'zostawiam_z_tym',
    template: 'Zostawiam Cię z tą myślą. Jeśli coś z tego wynika — wiesz gdzie mnie znaleźć.',
    psychology: 'Subtelne "drzwi otwarte" bez nachalności.',
  },
  {
    id: 'spoko_jesli',
    template: 'Spoko jeśli to dla Was oczywiste — chciałem mieć pewność że o tym wiesz.',
    psychology: 'Pochlebia klientowi (zakłada że może już to wie). Niski próg ego.',
  },
]
