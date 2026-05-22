export const PO_OFERCIE_OPENING_VARIANTS = [
  {
    id: 'bez_zawieszania',
    template: 'Cześć {decydent_imie},\n\nWysłałem Ci ofertę 2 dni temu i nie chciałem zostawić tematu w zawieszeniu.',
    psychology: 'Profesjonalne, biznesowe. Pokazuje że Ci zależy ale nie naciskasz.',
  },
  {
    id: 'sprawdzam',
    template: 'Cześć {decydent_imie},\n\nSprawdzam czy oferta dotarła i czy wszystko w niej jest jasne.',
    psychology: 'Pretekst pragmatyczny ("dotarła?") obniża próg odpowiedzi.',
  },
  {
    id: 'krotko_o_ofercie',
    template: 'Cześć {decydent_imie},\n\nKrótko o ofercie, którą dostałeś — chcę być pewien że nic nie wymaga doprecyzowania.',
    psychology: 'Sugeruje że jest miejsce na pytania. Klient czuje że może coś dopytać.',
  },
  {
    id: 'gdzie_jestesmy',
    template: 'Cześć {decydent_imie},\n\nGdzie jesteśmy z tematem oferty? Chcę wiedzieć czy potrzebujesz czegoś ode mnie.',
    psychology: 'Pytanie zarządcze, nie sprzedażowe. Stawia Cię w roli partnera.',
  },
]

export const PO_OFERCIE_BODY_VARIANTS = [
  {
    id: 'pytanie_o_cennik',
    instruction: 'Sformułuj pytanie diagnostyczne o cennik: "Czy któreś z założeń cenowych wymaga wyjaśnienia? Możemy razem przez to przejść w 10 minut." Użyj tego wariantu gdy kontekst wskazuje zainteresowanie ceną lub klient wracał do sekcji cennika.',
  },
  {
    id: 'pytanie_o_zakres',
    instruction: 'Sformułuj pytanie diagnostyczne o zakres: "Czy któryś z modułów w ofercie wymaga doprecyzowania pod Wasz konkretny proces? Mogę dosłać przykład jak to wygląda u podobnej firmy." Użyj gdy kontekst wskazuje analizę modułów lub zakresu.',
  },
  {
    id: 'pytanie_ogolne',
    instruction: 'Sformułuj ogólne pytanie diagnostyczne: "Czy jest w ofercie coś, co wymaga wyjaśnienia — na poziomie zakresu, ceny lub harmonogramu? Wolę żebyś zapytał teraz, niż żebyś podejmował decyzję z niejasności." Użyj gdy brak szczegółowego kontekstu.',
  },
]

export const PO_OFERCIE_CLOSING_VARIANTS = [
  {
    id: '15_min_dzis',
    template: 'Mogę dzisiaj zarezerwować 15 minut na omówienie.',
    psychology: 'Bardzo konkretne, niski próg czasowy (15 min). Zaproponowany dziś.',
  },
  {
    id: 'pasuje_termin',
    template: 'Daj znać kiedy Ci pasuje krótki call — 15 minut wystarczy.',
    psychology: 'Pozwala klientowi wybrać termin. Bardziej elastyczne.',
  },
  {
    id: 'odpowiem_pisemnie',
    template: 'Możesz odpisać tutaj na pytanie, jeśli nie chcesz calla. Też wszystko wyjaśnię.',
    psychology: 'Daje opcję pisemną. Działa dla introwertyków lub zajętych.',
  },
  {
    id: 'pomoge_decyzji',
    template: 'Powiedz mi czego brakuje Ci do decyzji — call czy mail, jak Ci wygodniej.',
    psychology: 'Pokazuje że jesteś po stronie klienta. Pomagasz mu, nie sprzedajesz.',
  },
]
