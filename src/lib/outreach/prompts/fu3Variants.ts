export const FU3_OPENING_VARIANTS = [
  {
    id: 'pytanie_o_roznice',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nCzy widzisz różnicę między AI które pisze "jak student" a AI które pisze "jak pracownik z dwuletnim stażem"?',
    psychology: 'Pytanie konfrontacyjne — klient musi sprawdzić czy rozumie różnicę.',
  },
  {
    id: 'teza_techniczna',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nWiększość firm myli "AI" z "ChatGPT z wgranymi plikami". Te dwie rzeczy działają zupełnie inaczej.',
    psychology: 'Teza która prowokuje. CEO czyta dalej bo nie chce być w "większości firm".',
  },
  {
    id: 'liczba_zapominania',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nChatGPT zapomina o Twojej firmie po każdej rozmowie. Po 30 dniach masz 0% jego pamięci. To dlatego generyczne AI nie buduje wiedzy.',
    psychology: 'Twardy fakt techniczny. CEO weryfikuje na własnym doświadczeniu.',
  },
  {
    id: 'u_was_chatgpt',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nJeśli {nazwa_firmy} testowało już ChatGPT do pisania maili, pewnie widzieliście tę różnicę — pierwsza wiadomość świetna, dziesiąta wygląda jak template.',
    psychology: 'Personalizacja przez założenie ich doświadczenia. Klient się utożsamia.',
  },
  {
    id: 'duzo_pyta',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nWracam z jedną konkretną rzeczą, bo dużo osób z {branza} mnie o to pyta.',
    psychology: 'Sugeruje status eksperta (ludzie do Ciebie wracają z pytaniami).',
  },
]

export const FU3_BODY_VARIANTS = [
  {
    id: 'chatgpt_vs_wiedza',
    instruction: 'Wyjaśnij różnicę technologii: generyczne AI (ChatGPT, Copilot) pamięta pliki tylko w jednej rozmowie. {nazwa_produktu_klienta} trzyma wiedzę w wektorowej bazie i używa jej codziennie, miesiącami — w każdej wiadomości, ofercie, scoringu. Analogia: praktykant z notatkami vs pracownik z głową pełną wiedzy.',
  },
  {
    id: 'generyczne_vs_kontekstowe',
    instruction: 'Wyjaśnij różnicę efektu: generyczne AI pisze jak student bez kontekstu. {nazwa_produktu_klienta} pisze jak handlowiec który zna każdą wygraną z poprzedniego roku. Skup się na końcowym efekcie (jakości wiadomości), nie technologii.',
  },
  {
    id: 'inwestycja_vs_subskrypcja',
    instruction: 'Wyjaśnij różnicę modelu: większość firm "wdraża AI" jednorazowo — wypełniają jednym promptem, używają miesiąc, zapominają. {nazwa_produktu_klienta} to żywy system — uczy się dalej. Im więcej tam wrzucisz, tym mądrzejszy. Analogia: kupujesz inwestycję, nie subskrypcję.',
  },
]

export const FU3_CLOSING_VARIANTS = [
  {
    id: 'asset_z_scarcity',
    template: '{scarcity_lub_oferta} nadal obowiązuje. Mam {asset_cta} które pokazuje to w działaniu — wysłać?',
    psychology: 'Łączy edukację z scarcity i CTA. Naturalne przejście.',
  },
  {
    id: 'pokaz_na_zywo',
    template: 'Mogę pokazać Ci to na żywo na Twoich danych w 5 minut. Wrzucasz 3 pliki o {nazwa_firmy}, ja pokazuję różnicę. Robimy?',
    psychology: 'Super konkretne — propozycja demo na ich danych. Pokazuje pewność.',
  },
  {
    id: 'dla_ciekawosci',
    template: 'Jeśli to Cię ciekawi — mam {asset_cta}, daj znać. Jeśli już znasz tę różnicę, to też spoko.',
    psychology: 'Niskociśnieniowe. Pozwala klientowi nie czuć się przyciskanym.',
  },
  {
    id: 'pytanie_o_wiedze',
    template: 'Powiedz mi — czy to jest dla Ciebie nowa wiedza, czy znałeś już tę różnicę?',
    psychology: 'Pytanie diagnostyczne otwiera dialog.',
  },
  {
    id: 'jesli_ciekawi',
    template: 'Jeśli to Ci coś rozjaśnia — daj znać. Jeśli nie — odpiszę następnym razem z czymś innym.',
    psychology: 'Pokazuje że nie naciskasz. Klient czuje że szanujesz jego ciszę.',
  },
]
