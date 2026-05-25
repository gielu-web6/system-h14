export const REENGAGEMENT_OPENING_VARIANTS = [
  {
    id: 'pytanie_o_zmiane',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy coś się zmieniło u {nazwa_firmy} od naszej ostatniej rozmowy?',
    psychology: 'Pytanie o nich, nie o produkt. Klient czuje że pamiętasz kontekst.',
  },
  {
    id: 'teza_o_powodzie',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nNie wracam bez powodu — i tym razem powodem jest {nowy_haczyk}.',
    psychology: 'Bezpośrednie stwierdzenie. Klient widzi że to nie spam, tylko konkret.',
  },
  {
    id: 'liczba_dni',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nPonad 3 miesiące od naszej ostatniej rozmowy — i mam konkretny powód żeby wrócić: {nowy_haczyk}.',
    psychology: 'Liczba czasu + konkret. Pokazuje że nie wracasz na ślepo.',
  },
  {
    id: 'u_was_zmiana',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nPamiętam że u {nazwa_firmy} mówiliście o tym temacie — pomyślałem że jest powód żeby wrócić: {nowy_haczyk}.',
    psychology: 'Pokazuje że pamiętasz konkretną rozmowę. Buduje wiarygodność.',
  },
  {
    id: 'cos_sie_zmienilo',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nCoś się u nas zmieniło i pomyślałem o {nazwa_firmy} — {nowy_haczyk}.',
    psychology: 'Pokazuje rozwój. Wraca z nowym powodem, nie pustymi rękami.',
  },
]

// KRYTYCZNE: jeśli {kontekst} jest pusty/null — generator musi zwrócić błąd.
// NIE generuj wiadomości re-engagement bez konkretnego powodu powrotu.
export const REENGAGEMENT_BODY_VARIANTS = [
  {
    id: 'nowa_funkcja',
    instruction: 'Jeśli {nowy_haczyk} to nowa funkcja produktu: krótko opisz co przybyło i dlaczego ma znaczenie dla {branza} klienta. Skup się na korzyści, nie samej funkcji. Przykład tonu: "Dodaliśmy moduł X w {nazwa_produktu_klienta}, który rozwiązuje konkretnie problem Y u firm w {branza}."',
  },
  {
    id: 'news_o_firmie',
    instruction: 'Jeśli {nowy_haczyk} to news o firmie klienta (zatrudnili kogoś, nowy projekt, wzrost): wyraź uznanie + pokaż jak to się łączy z {nazwa_produktu_klienta}. Przykład tonu: "Widzę że zatrudniliście kogoś nowego — onboarding takiej osoby to dokładnie sytuacja gdzie {nazwa_produktu_klienta} skraca czas wdrożenia."',
  },
  {
    id: 'kontekst_powrotu',
    instruction: 'Wyjaśnij powód powrotu ({nowy_haczyk}) i połącz go bezpośrednio z korzyścią dla klienta. Pokaż dlaczego {nazwa_produktu_klienta} jest teraz bardziej relevantny niż podczas poprzedniej rozmowy. Bądź konkretny, bez ogólników.',
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
    template: 'Mogę wysłać konkretne info na ten temat — odpisz "tak" jeśli ma sens.',
    psychology: 'Niższy próg — nawet bez calla, tylko info mailem.',
  },
  {
    id: 'czy_warto',
    template: 'Powiedz tylko — czy temat jest dla Was na ten moment warty 10 minut rozmowy?',
    psychology: 'Pyta o ich priorytety, nie o spotkanie. Buduje partnerstwo.',
  },
  {
    id: 'dwa_slowa',
    template: 'Wystarczą dwa słowa — "tak" lub "nie warto". Resztę wezmę na siebie.',
    psychology: 'Minimalizuje wysiłek do absolutnego minimum.',
  },
  {
    id: 'krotki_call',
    template: 'Chcesz 15-minutowy call żeby zobaczyć czy to ma sens dla {nazwa_firmy}? Bez zobowiązań.',
    psychology: 'Konkretny czas + "bez zobowiązań" rozbraja obawę.',
  },
]
