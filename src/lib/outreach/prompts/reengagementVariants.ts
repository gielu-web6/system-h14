export const REENGAGEMENT_OPENING_VARIANTS = [
  {
    id: 'wiem_zostawilem',
    template: 'Cześć {decydent_imie},\n\nWiem że zostawiłem temat. Wracam, bo {nowy_haczyk}.',
    psychology: 'Uczciwie uznaje przerwę. "Bo X" wprowadza konkretny powód powrotu.',
  },
  {
    id: 'cos_zmienilo',
    template: 'Cześć {decydent_imie},\n\nCoś się u nas zmieniło i pomyślałem o Waszej firmie — {nowy_haczyk}.',
    psychology: 'Pokazuje rozwój ("coś się zmieniło"). Wraca z nowym powodem, nie pustymi rękami.',
  },
  {
    id: 'okazja_szczegolna',
    template: 'Cześć {decydent_imie},\n\nDawno nie pisałem — ale jest okazja, która konkretnie dotyczy {nazwa_firmy}.',
    psychology: 'Hook przez personalizację. Klient czyta bo to o nim.',
  },
  {
    id: 'pamietalem_o_was',
    template: 'Cześć {decydent_imie},\n\nPamiętam że rozmawialiśmy o {nowy_haczyk} — i pomyślałem że jest powód żeby wrócić.',
    psychology: 'Sygnalizuje że pamiętasz konkretną rozmowę. Buduje wiarygodność.',
  },
]

// KRYTYCZNE: jeśli {kontekst} jest pusty/null — generator zwraca błąd,
// nie wolno wracać "z niczym". Walidacja musi blokować generowanie.
export const REENGAGEMENT_BODY_VARIANTS = [
  {
    id: 'nowa_funkcja',
    instruction: 'Opisz krótko nową funkcję Company Brain (z pola kontekst) i wyjaśnij dlaczego ma znaczenie dla branży klienta. Skup się na korzyści, nie samej funkcji. Przykład tonu: "Dodaliśmy moduł X, który rozwiązuje konkretnie problem Y u agencji {branza}."',
  },
  {
    id: 'news_o_firmie',
    instruction: 'Odnieś się do newsa o firmie klienta (z pola kontekst — np. zatrudnienie, nowy projekt, wzrost). Wyraź uznanie + pokaż jak to się łączy z Company Brain. Przykład tonu: "Widzę że zatrudniliście nowego handlowca — onboarding takiej osoby to dokładnie sytuacja gdzie Company Brain skraca czas wdrożenia z miesięcy do tygodni."',
  },
  {
    id: 'kontekst_powrotu',
    instruction: 'Wyjaśnij powód powrotu (z pola kontekst) i połącz go bezpośrednio z korzyścią dla klienta. Bądź konkretny — jaki nowy powód sprawia że Company Brain jest teraz bardziej relevantny niż wcześniej. Bez ogólników.',
  },
]

export const REENGAGEMENT_CLOSING_VARIANTS = [
  {
    id: '5_min_pogadac',
    template: 'Daj znać czy chcesz 5 minut o tym pogadać.',
    psychology: 'Bardzo niski próg (5 min). Łatwe "tak".',
  },
  {
    id: 'wysylam_info',
    template: 'Mogę Ci wysłać konkretne info na ten temat — odpisz „tak" jeśli ma sens.',
    psychology: 'Daje jeszcze niższy próg — nawet bez calla, tylko info mailem.',
  },
  {
    id: 'czy_warto',
    template: 'Powiedz tylko — czy temat jest dla Was na ten moment warty 10 minut rozmowy?',
    psychology: 'Pyta o ich priorytety, nie o spotkanie. Buduje partnerstwo.',
  },
  {
    id: 'dwa_slowa',
    template: 'Wystarczą dwa słowa — „tak" lub „nie warto". Resztę wezmę na siebie.',
    psychology: 'Minimalizuje ich wysiłek do absolutnego minimum.',
  },
]
