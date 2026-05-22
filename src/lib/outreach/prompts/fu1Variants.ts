export const FU1_OPENING_VARIANTS = [
  {
    id: 'inna_strona',
    template: 'Cześć {decydent_imie},\n\nWracam jeszcze raz, bo pomyślałem o tym z trochę innej strony.',
    psychology: 'Sygnalizuje zmianę perspektywy. Klient czyta dalej, bo to nie powtórka.',
  },
  {
    id: 'nie_porzucam',
    template: 'Cześć {decydent_imie},\n\nNie chciałem zostawiać tego tematu w zawieszeniu — przemyślałem to z innej strony.',
    psychology: 'Uznaje ciszę bez wyrzutu. Pokazuje że Ci zależy.',
  },
  {
    id: 'jedna_obserwacja',
    template: 'Cześć {decydent_imie},\n\nWracam z jedną konkretną obserwacją, którą widzę u większości agencji {branza}.',
    psychology: 'Obietnica zwięzłości i wartości. Klient otwiera bo coś dostanie.',
  },
  {
    id: 'nawiazanie_finansowe',
    template: 'Cześć {decydent_imie},\n\nNie chcę zawracać głowy — ale jest jedna rzecz finansowa, która mnie męczy w kontekście Waszej sytuacji.',
    psychology: 'Hook przez ciekawość ("co go męczy?") + finansowy ton wprowadza temat liczb.',
  },
]

export const FU1_BODY_VARIANTS = [
  {
    id: 'liczby_godzin',
    instruction: 'Pokaż problem przez konkretne godziny pracy handlowca. Użyj liczby 8-12 godzin tygodniowo na "martwe godziny" (research leadów, przepisywanie danych, ręczne follow-upy). Podkreśl że te godziny nie zarabiają. Wyjaśnij że Company Brain to zdejmuje. Przykład tonu: "U jednej osoby to często 8-12 godzin tygodniowo, w których nikt nie zarabia."',
  },
  {
    id: 'cykl_klienta',
    instruction: 'Pokaż problem przez cykl klienta — lead przychodzi, ale ginie zanim ktoś go obsłuży. Skup się na utraconych konwersjach, nie godzinach. Wyjaśnij że Company Brain pisze za handlowca i przyspiesza cykl. Przykład tonu: "Lead pisze w środę, handlowiec odpisuje w piątek, a w międzyczasie idzie do konkurencji."',
  },
  {
    id: 'koszt_alternatywny',
    instruction: 'Pokaż problem przez koszt alternatywny — co robi Wasz handlowiec ZAMIAST sprzedawać? Skup się na tym że płacicie sprzedawcy za pracę administracyjną. Wyjaśnij że Company Brain uwalnia go do prawdziwej sprzedaży. Przykład tonu: "Płacicie sprzedawcy stawkę handlowca, a połowę dnia przepisuje dane z LinkedIna do CRM-a."',
  },
]

export const FU1_CLOSING_VARIANTS = [
  {
    id: 'wideo_7min',
    template: 'Mam 7-minutowe wideo które pokazuje jak Company Brain to robi. Wysłać?',
    psychology: 'Klasyczny CTA, prosi o binarną odpowiedź (wysłać/nie wysłać).',
  },
  {
    id: 'kalkulacja',
    template: 'Chcesz że przejdziemy razem przez kalkulację dla Waszej firmy? 10 minut.',
    psychology: 'CTA wzywające do współpracy ("razem"), bardzo konkretny czas (10 min).',
  },
  {
    id: 'pytanie_o_problem',
    template: 'Powiedz mi tylko jedno — czy to faktycznie wąskie miejsce u Was, czy mijam się z tematem?',
    psychology: 'Pytanie diagnostyczne. Klient łatwo odpisze "tak"/"nie" — zaczyna dialog.',
  },
  {
    id: 'wideo_lub_call',
    template: 'Mam 7-minutowe wideo które to pokazuje — wysłać, czy wolisz krótki call?',
    psychology: 'Daje wybór formy (wideo vs call), oba są opcjami "tak".',
  },
]
