export const FU5_OPENING_VARIANTS = [
  {
    id: 'ostatnia_wiadomosc',
    template: 'Cześć {decydent_imie},\n\nTo ostatnia wiadomość w tym wątku.',
    psychology: 'Klarowne i uczciwe. Klient wie że to koniec, nie spam.',
  },
  {
    id: 'zamykam_petle',
    template: 'Cześć {decydent_imie},\n\nZamykam tę pętlę z naszej strony.',
    psychology: 'Profesjonalne, biznesowe. Pokazuje że masz system.',
  },
  {
    id: 'bez_pretensji',
    template: 'Cześć {decydent_imie},\n\nPiszę po raz ostatni w tym wątku — bez żadnych pretensji.',
    psychology: 'Z góry rozbraja obawę "teraz się obrazi". Uznaje że obie strony są ok.',
  },
  {
    id: 'koniec_cyklu',
    template: 'Cześć {decydent_imie},\n\nKończę cykl wiadomości od siebie — chcę żebyś wiedział, że więcej Ci nie zawracam.',
    psychology: 'Bardzo szanujące. Klient odetchnie z ulgą — i właśnie wtedy może wrócić.',
  },
]

export const FU5_BODY_VARIANTS = [
  {
    id: 'rozumiem_moment',
    instruction: 'Wyraź zrozumienie: to po prostu może nie być dobry moment, lub nie jest to dla nich. Bez wyrzutu. Zostaw drzwi otwarte: "Gdybyś kiedyś chciał na spokojnie zobaczyć jak działa Company Brain, jestem tu. Wystarczy odpisać."',
  },
  {
    id: 'rozumiem_priorytety',
    instruction: 'Wyraź zrozumienie przez priorytety: każdy ma w tym tygodniu 50 ważnych rzeczy, my po prostu nie trafiliśmy w jedną z nich. Zostaw drzwi: "Gdyby Company Brain kiedyś trafił na Twoją listę — wystarczy odpisać."',
  },
  {
    id: 'rozumiem_decyzje',
    instruction: 'Wyraź zrozumienie przez decyzję: brak odpowiedzi to też odpowiedź i ją szanujesz. Przykład tonu: "Brak odpowiedzi to też informacja i ją przyjmuję — bez urazy. Gdyby coś się zmieniło, Company Brain nigdzie nie ucieknie."',
  },
]

// KRYTYCZNE: żadne zamknięcie NIE może zawierać: "ostatnia szansa", "kończy się",
// "wracam za miesiąc", "ostatnia okazja" ani żadnych chwytów scarcity.
export const FU5_CLOSING_VARIANTS = [
  {
    id: 'trzymam_kciuki',
    template: 'Trzymam kciuki za rozwój {nazwa_firmy}.',
    psychology: 'Klasyk Godina. Pozytywne życzenie. Klient zapamiętuje uczciwość.',
  },
  {
    id: 'powodzenia',
    template: 'Powodzenia w tym co budujecie w {nazwa_firmy}.',
    psychology: 'Ciepło, prawie kumpelski ton.',
  },
  {
    id: 'wszystkiego_dobrego',
    template: 'Wszystkiego dobrego dla {nazwa_firmy} — niezależnie od tego, co dalej.',
    psychology: 'Najszczersze, najmniej "sprzedażowe" zakończenie.',
  },
  {
    id: 'do_uslyszenia',
    template: 'Do usłyszenia — kiedyś, jeśli będzie potrzeba.',
    psychology: 'Krótkie, lekko ciepłe. Sygnalizuje "drzwi otwarte" bez nachalności.',
  },
]
