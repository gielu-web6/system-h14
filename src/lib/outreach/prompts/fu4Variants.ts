export const FU4_OPENING_VARIANTS = [
  {
    id: 'pytanie_decyzji',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy mamy temat — czy zamykamy bez urazy?',
    psychology: 'Pytanie wprost wymusza decyzję. Klient nie może go zignorować.',
  },
  {
    id: 'teza_o_ciszy',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nCisza po obu stronach nikomu nie pomaga.',
    psychology: 'Mocna teza neutralna. Klient nie może się sprzeciwić.',
  },
  {
    id: 'liczba_dni',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nMinęło ponad 2 tygodnie od pierwszej wiadomości. Chcę dać Ci konkretny wybór — zamiast jeszcze jednej wiadomości "na próbę".',
    psychology: 'Liczba dni + uznanie sytuacji. Klient docenia szczerość.',
  },
  {
    id: 'u_was_decyzja',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nU {nazwa_firmy} prawdopodobnie macie teraz 50 pilniejszych spraw niż moje wiadomości. Rozumiem — i daję Ci konkretny wybór, żebyś nie musiał już do tego wracać.',
    psychology: 'Empatia + propozycja zamknięcia. Klient docenia szacunek dla jego czasu.',
  },
  {
    id: 'bez_marnowania',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nPytam wprost, żeby nie marnować Twojego ani mojego czasu.',
    psychology: 'Bezpośrednie. Klient szanuje brak owijania w bawełnę.',
  },
]

export const FU4_BODY_VARIANTS = [
  {
    id: 'scarcity',
    instruction: 'Skup się na scarcity: {scarcity_lub_oferta} dostępne jeszcze dla pierwszych klientów. Potem zmiana warunków. NIE OBIECUJ konkretnych kwot ani krotności. Bezpieczna fraza: "warunki znacząco się zmieniają".',
  },
  {
    id: 'jasnosc',
    instruction: 'Skup się na potrzebie jasności obu stron. Cisza nikomu nie pomaga, decyzja w którąkolwiek stronę posuwa naprzód. Spokojny realizm, bez agresji. "Cisza nic nie buduje, decyzja porusza."',
  },
  {
    id: 'czas_oszczednosci',
    instruction: 'Skup się na tym że już dwa tygodnie temu zaproponowałeś temat. Teraz chcesz wiedzieć gdzie klient stoi. Bez wyrzutów. "Już dwa tygodnie temu pisałem. Chcę wiedzieć czy budujemy temat, czy zamykam."',
  },
]

// KRYTYCZNE: każde zamknięcie MUSI mieć dokładnie 3 opcje wymienione numerycznie lub punktorowo.
export const FU4_CLOSING_VARIANTS = [
  {
    id: 'klasyczne_3_opcje',
    template: 'Trzy proste opcje:\n1. "Wyślij {asset_cta}" — pokazuje wszystko w działaniu\n2. "Mam pytanie" — odpisz pytaniem, ja odpowiadam\n3. "Nie teraz" — szanuję, nie piszę więcej w tym wątku\n\nKtóra opcja?',
    psychology: 'Klasyczny three-option close. Każda opcja konkretnie nazwana.',
  },
  {
    id: 'tak_pytanie_pas',
    template: 'Trzy opcje:\n1. "TAK" — wysyłam {asset_cta} i ustawiamy 15 minut na omówienie\n2. "PYTANIE" — odpiszesz konkretem, ja odpowiem\n3. "PAS" — zostawiam temat, bez ciśnienia\n\nKtórą wybierasz?',
    psychology: 'Krótkie kapsowe etykiety. Łatwiejsze do skopiowania w odpowiedzi.',
  },
  {
    id: 'call_asset_nie',
    template: 'Powiedz mi jedno z trzech:\n• "Call" — umawiamy 15 minut na ten tydzień\n• "{asset_cta}" — wysyłam materiał, oglądasz w spokoju\n• "Nie" — zamykam temat i więcej nie piszę\n\nDecyzja po Twojej stronie.',
    psychology: 'Wybór formy zaangażowania + wyjście. Eleganckie.',
  },
  {
    id: 'binarne_pytanie',
    template: 'Najprościej: chcesz to dalej drążyć, czy zamknąć temat? Jedno słowo wystarczy — "dalej" albo "zamknięte".',
    psychology: 'Ekstremalnie binarne. Działa gdy klient lubi prostotę.',
  },
  {
    id: 'odpowiedz_dzis',
    template: 'Wystarczy że odpiszesz jednym z trzech:\n→ "Pokaż" — wysyłam {asset_cta}\n→ "Pytanie:" — i Twoje pytanie\n→ "Nie" — zamykam\n\nKtórekolwiek z tych szanuję.',
    psychology: 'Strzałki jako wizualne markery opcji. Konkretne.',
  },
]
