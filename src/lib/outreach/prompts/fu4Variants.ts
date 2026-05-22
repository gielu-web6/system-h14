export const FU4_OPENING_VARIANTS = [
  {
    id: 'bez_marnowania',
    template: 'Cześć {decydent_imie},\n\nPytam wprost, żeby nie marnować Twojego czasu.',
    psychology: 'Direct, bez owijania w bawełnę. Cardone-styl.',
  },
  {
    id: 'czas_decyzji',
    template: 'Cześć {decydent_imie},\n\nMyślę że to dobry moment żeby zdecydować — w którąkolwiek stronę.',
    psychology: 'Wzywa do decyzji bez wskazywania kierunku. Klient czuje że ma kontrolę.',
  },
  {
    id: 'jasnosc_obu_stron',
    template: 'Cześć {decydent_imie},\n\nChcę dać Tobie i sobie jasność — bo cisza nikomu nie pomaga.',
    psychology: 'Uznaje że obu stronom zależy na decyzji. Buduje partnerstwo.',
  },
  {
    id: 'ostatni_krok',
    template: 'Cześć {decydent_imie},\n\nZbliżamy się do momentu, w którym chcę Ci dać konkretny wybór.',
    psychology: 'Sygnalizuje że to istotny moment. Klient czyta uważniej.',
  },
]

export const FU4_BODY_VARIANTS = [
  {
    id: 'scarcity_kontekstowa',
    instruction: 'Skup się na scarcity: wczesna cena Company Brain jest dostępna dla pierwszych klientów w tej rundzie. Potem wraca standardowa, znacząco wyższa. NIE obiecuj konkretnych kwot ani krotności — zostań przy "znacząco wyższa", to bezpieczna prawda.',
  },
  {
    id: 'czas_na_decyzje',
    instruction: 'Skup się na tym że cisza kosztuje obie strony — Ciebie czas, klienta okazję. Nie używaj agresywnego tonu, tylko spokojny realizm. Przykład tonu: "Cisza nic nie buduje, decyzja w którąkolwiek stronę posuwa nas do przodu."',
  },
  {
    id: 'klarownosc_oferty',
    instruction: 'Skup się na tym że już dwa tygodnie temu zaproponowałeś temat, teraz chcesz wiedzieć gdzie klient stoi. Bez wyrzutów. Przykład tonu: "Już dwa tygodnie temu pisałem o Company Brain. Chcę wiedzieć czy to dla Was — żebyśmy oboje wiedzieli czy budujemy temat, czy nie."',
  },
]

// KRYTYCZNE: każde zamknięcie MUSI zawierać dokładnie 3 opcje wymienione numerycznie lub jako punkty.
export const FU4_CLOSING_VARIANTS = [
  {
    id: 'klasyczne_3_opcje',
    template: 'Trzy proste opcje:\n1. „Wyślij wideo" — 7 minut, pokazuje cały system w działaniu\n2. „Mam pytanie" — odpisz pytaniem, ja odpowiadam\n3. „Nie teraz" — szanuję, nie piszę więcej w tym wątku\n\nKtóra opcja?',
    psychology: 'Oryginalny three-option close Hormoziego. Klasyk.',
  },
  {
    id: 'tak_pytanie_pas',
    template: 'Trzy opcje:\n1. „TAK" — wysyłam wideo i ustawiamy 15 minut na omówienie\n2. „PYTANIE" — odpiszesz konkretem, ja odpowiem\n3. „PAS" — zostawiam temat, bez ciśnienia\n\nKtórą wybierasz?',
    psychology: 'Krótkie, kapsowe etykiety. Łatwiejsze do skopiowania w odpowiedzi.',
  },
  {
    id: 'call_wideo_nie',
    template: 'Powiedz mi jedno z trzech:\n• „Call" — umawiamy 15 minut na ten tydzień\n• „Wideo" — wysyłam 7-minutowy materiał, oglądasz w spokoju\n• „Nie" — zamykam temat i więcej nie piszę\n\nDecyzja po Twojej stronie.',
    psychology: 'Daje wybór formy zaangażowania (call vs wideo) + wyjście. Eleganckie.',
  },
  {
    id: 'binarne_pytanie',
    template: 'Najprościej: chcesz to dalej drążyć, czy zamknąć temat? Jedno słowo wystarczy — „dalej" albo „zamknięte".',
    psychology: 'Ekstremalnie binarne. Działa gdy klient lubi prostotę.',
  },
]
