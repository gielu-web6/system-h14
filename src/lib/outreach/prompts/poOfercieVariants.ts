export const PO_OFERCIE_OPENING_VARIANTS = [
  {
    id: 'pytanie_o_jasnosc',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy w ofercie którą dostałeś coś wymaga doprecyzowania?',
    psychology: 'Bezpośrednie pytanie diagnostyczne. Klient łatwo odpisze tak/nie.',
  },
  {
    id: 'teza_o_decyzji',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nLepiej zadać teraz głupie pytanie niż za miesiąc żałować decyzji.',
    psychology: 'Teza która rozbraja wstyd przed pytaniem. Klient czuje pozwolenie.',
  },
  {
    id: 'liczba_dni',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\n48 godzin od wysłania oferty — chcę sprawdzić czy wszystko w niej jest jasne.',
    psychology: 'Konkretna liczba czasu. Profesjonalne, biznesowe.',
  },
  {
    id: 'u_was_oferta',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nU {nazwa_firmy} pewnie omawiacie ofertę w kilka osób — chcę pomóc jeśli są pytania, na które łatwiej odpowiedzieć ode mnie niż czytać między wierszami.',
    psychology: 'Empatia + pomoc w procesie decyzyjnym.',
  },
  {
    id: 'bez_zawieszania',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nNie chciałem zostawiać tematu w zawieszeniu — sprawdzam jak idzie z ofertą.',
    psychology: 'Ludzkie, ciepłe. Pokazuje że Ci zależy bez nachalności.',
  },
]

export const PO_OFERCIE_BODY_VARIANTS = [
  {
    id: 'pytanie_o_cennik',
    instruction: 'Sformułuj pytanie diagnostyczne o cennik. Jeśli {kontekst} wskazuje że klient wracał do wyceny: "Widzę że wracałeś do sekcji wyceny — czy któreś z założeń wymaga wyjaśnienia? Możemy razem przez to przejść w 10 minut." Bezpośrednio adresujesz to co go zatrzymało.',
  },
  {
    id: 'pytanie_o_zakres',
    instruction: 'Sformułuj pytanie diagnostyczne o zakres. Jeśli {kontekst} wskazuje że klient analizował zakres: "Czy któryś z elementów oferty wymaga doprecyzowania pod Wasz konkretny proces? Mogę dosłać przykład jak to działa u podobnej firmy."',
  },
  {
    id: 'pytanie_ogolne',
    instruction: 'Sformułuj ogólne pytanie diagnostyczne gdy {kontekst} jest pusty: "Czy jest w ofercie coś, co wymaga wyjaśnienia — na poziomie zakresu, ceny lub harmonogramu? Wolę żebyś zapytał teraz niż żebyś decydował z niejasności."',
  },
]

export const PO_OFERCIE_CLOSING_VARIANTS = [
  {
    id: '15_min_dzis',
    template: 'Mogę dzisiaj zarezerwować 15 minut na omówienie.',
    psychology: 'Konkretne, niski próg czasowy (15 min), proponowane dziś.',
  },
  {
    id: 'pasuje_termin',
    template: 'Daj znać kiedy Ci pasuje krótki call — 15 minut wystarczy.',
    psychology: 'Pozwala klientowi wybrać termin. Bardziej elastyczne.',
  },
  {
    id: 'odpowiem_pisemnie',
    template: 'Możesz odpisać tutaj na pytanie jeśli nie chcesz calla. Też wszystko wyjaśnię.',
    psychology: 'Daje opcję pisemną. Działa dla introwertyków i zajętych.',
  },
  {
    id: 'pomoge_decyzji',
    template: 'Powiedz mi czego brakuje Ci do decyzji — call czy mail, jak Ci wygodniej.',
    psychology: 'Pokazuje że jesteś po stronie klienta. Pomagasz mu, nie sprzedajesz.',
  },
  {
    id: 'nawet_jedno_pytanie',
    template: 'Nawet jeśli to jest jedno małe pytanie — śmiało, odpiszę szybko.',
    psychology: 'Obniża próg do absolutnego minimum. Klient nie czuje że "musi" mieć duże pytanie.',
  },
]
