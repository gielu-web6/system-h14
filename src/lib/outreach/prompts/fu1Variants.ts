export const FU1_OPENING_VARIANTS = [
  {
    id: 'pytanie_o_godziny',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nIle godzin tygodniowo Twój zespół spędza na rzeczach, które nie generują przychodu?',
    psychology: 'Pytanie diagnostyczne otwiera mózg analityczny. Klient zaczyna liczyć w głowie.',
  },
  {
    id: 'teza_o_kosztach',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nNajdroższe rzeczy w firmie to nie te, które kupujesz — tylko te, których nie automatyzujesz.',
    psychology: 'Mocna teza prowokacyjna. Klient czyta dalej żeby zweryfikować lub się sprzeciwić.',
  },
  {
    id: 'liczba_statystyka',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nW {branza} średni handlowiec spędza 60-70% tygodnia na pracy, która nie sprzedaje.',
    psychology: 'Konkretna liczba aktywuje tryb analityczny. CEO porównuje to z własną firmą.',
  },
  {
    id: 'sytuacja_branzy',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nU {nazwa_firmy} i podobnych firm w {branza} największa strata pieniędzy to nie pozyskanie klientów — to czas tracony PO ich pozyskaniu.',
    psychology: 'Personalizacja po imieniu firmy + branży. Klient czuje że to o nim.',
  },
  {
    id: 'osobista_obserwacja',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nCoś mi nie daje spokoju po pierwszej wiadomości — chcę pokazać Ci to z innej, finansowej strony.',
    psychology: 'Ludzki ton, autentyczność. Klient czyta bo to nie brzmi jak template.',
  },
]

export const FU1_BODY_VARIANTS = [
  {
    id: 'liczby_godzin',
    instruction: 'Pokaż problem przez konkretne godziny pracy administracyjnej. Niezarabiające godziny: research, przepisywanie danych, ręczne follow-upy. Wyjaśnij że {nazwa_produktu_klienta} zdejmuje to z zespołu. Ton analityczny, oparty na liczbach.',
  },
  {
    id: 'cykl_klienta',
    instruction: 'Pokaż problem przez cykl klienta — leady przychodzą, ale giną zanim ktoś je obsłuży, bo zespół tonie w administracji. Wyjaśnij że {nazwa_produktu_klienta} przyspiesza odpowiedzi i ratuje konwersje. Ton narracyjny, jak opis sceny z życia firmy.',
  },
  {
    id: 'koszt_alternatywny',
    instruction: 'Pokaż problem przez koszt alternatywny — co handlowiec NIE robi, bo zajmuje się administracją. Stawka handlowca × godziny pracy administracyjnej = utracone przychody. Wyjaśnij że {nazwa_produktu_klienta} uwalnia ich do prawdziwej sprzedaży. Ton ROI-owy, dla CFO.',
  },
]

export const FU1_CLOSING_VARIANTS = [
  {
    id: 'asset_pokazac',
    template: 'Mam {asset_cta} które to konkretnie pokazuje. Wysłać?',
    psychology: 'Klasyczny CTA, prosi o binarną odpowiedź.',
  },
  {
    id: 'wspolna_kalkulacja',
    template: 'Chcesz że przejdziemy razem przez kalkulację dla {nazwa_firmy}? 10 minut.',
    psychology: 'CTA wzywające do współpracy. Bardzo konkretny czas (10 min).',
  },
  {
    id: 'pytanie_diagnostyczne',
    template: 'Powiedz mi tylko jedno — czy to faktycznie problem u {nazwa_firmy}, czy mijam się z tematem?',
    psychology: 'Pytanie diagnostyczne otwiera dialog. Klient łatwo odpisze tak/nie.',
  },
  {
    id: 'wybor_formy',
    template: 'Mam {asset_cta} które to pokazuje — wysłać, czy wolisz krótki call?',
    psychology: 'Daje wybór formy zaangażowania (asset vs call), oba są opcjami "tak".',
  },
  {
    id: 'jedno_zdanie_odpowiedzi',
    template: 'Jedno zdanie odpowiedzi wystarczy — czy to jest temat dla Was na ten kwartał?',
    psychology: 'Niski próg odpowiedzi (jedno zdanie). Pyta o priorytety.',
  },
]
