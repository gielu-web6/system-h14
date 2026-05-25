export const FU5_OPENING_VARIANTS = [
  {
    id: 'pytanie_o_wstrzymanie',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy mam przestać pisać?',
    psychology: 'Ekstremalnie bezpośrednie pytanie. Klient nie może zignorować takiej szczerości.',
  },
  {
    id: 'teza_o_szanowaniu',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nNajbardziej szanuję klientów którzy mówią mi "nie" — bardziej niż tych co milczą.',
    psychology: 'Mocna teza która rozbraja klienta. "Może powinienem powiedzieć nie".',
  },
  {
    id: 'liczba_wiadomosci',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nTo moja ostatnia wiadomość w tej sekwencji — szósta od cold DM.',
    psychology: 'Konkretna liczba pokazuje że masz system i go szanujesz.',
  },
  {
    id: 'u_was_priorytety',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nU {nazwa_firmy} pewnie jest teraz 100 ważniejszych spraw niż moje wiadomości — i to jest ok.',
    psychology: 'Empatia + akceptacja. Klient docenia że rozumiesz jego sytuację.',
  },
  {
    id: 'koncze_petle',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nZamykam tę pętlę z mojej strony. Bez żadnych pretensji.',
    psychology: 'Profesjonalne zamknięcie. Klient odetchnie i właśnie wtedy może wrócić.',
  },
]

export const FU5_BODY_VARIANTS = [
  {
    id: 'rozumiem_moment',
    instruction: 'Wyraź zrozumienie: to po prostu może nie być dobry moment, lub nie jest to dla nich. Bez wyrzutu. Zostaw drzwi: "Gdybyś kiedyś chciał na spokojnie zobaczyć {nazwa_produktu_klienta} w działaniu, jestem tu."',
  },
  {
    id: 'rozumiem_priorytety',
    instruction: 'Wyraź zrozumienie przez priorytety: każdy ma 50 ważnych rzeczy w tygodniu, my po prostu nie trafiliśmy w jedną z nich. "Gdyby {nazwa_produktu_klienta} kiedyś trafił na Twoją listę — wystarczy odpisać."',
  },
  {
    id: 'rozumiem_decyzje',
    instruction: 'Wyraź zrozumienie przez decyzję: brak odpowiedzi to też odpowiedź i ją szanujesz. "Brak odpowiedzi to też informacja i ją przyjmuję bez urazy. Gdyby coś się zmieniło, {nazwa_produktu_klienta} nigdzie nie ucieknie."',
  },
]

// KRYTYCZNE: żadne zamknięcie NIE może zawierać:
// "ostatnia szansa", "kończy się", "wracam za", ani żadnych chwytów scarcity.
export const FU5_CLOSING_VARIANTS = [
  {
    id: 'trzymam_kciuki',
    template: 'Trzymam kciuki za rozwój {nazwa_firmy}.',
    psychology: 'Klasyk Godina. Pozytywne życzenie. Klient zapamiętuje uczciwość.',
  },
  {
    id: 'powodzenia',
    template: 'Powodzenia w tym co budujecie w {nazwa_firmy}.',
    psychology: 'Cieplej, prawie kumpelski ton.',
  },
  {
    id: 'wszystkiego_dobrego',
    template: 'Wszystkiego dobrego dla {nazwa_firmy} — niezależnie od tego co dalej.',
    psychology: 'Najszczersze, najmniej "sprzedażowe" zakończenie.',
  },
  {
    id: 'do_uslyszenia',
    template: 'Do usłyszenia kiedyś — jeśli będzie potrzeba.',
    psychology: 'Krótkie, lekko ciepłe. Sygnalizuje "drzwi otwarte".',
  },
  {
    id: 'dzieki_za_czas',
    template: 'Dzięki że dotarłeś do tej wiadomości. Powodzenia w {nazwa_firmy}.',
    psychology: 'Wyraża wdzięczność. Klient czuje że jego uwaga była doceniona.',
  },
]
