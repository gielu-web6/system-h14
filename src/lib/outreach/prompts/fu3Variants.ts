export const FU3_OPENING_VARIANTS = [
  {
    id: 'duzo_pyta',
    template: 'Cześć {decydent_imie},\n\nWracam z jedną konkretną rzeczą, bo dużo agencji o to pyta.',
    psychology: 'Sugeruje że jesteś ekspertem (ludzie do Ciebie wracają z pytaniami). Buduje autorytet.',
  },
  {
    id: 'edukacyjne',
    template: 'Cześć {decydent_imie},\n\nDziś coś bardziej technicznego — chcę wyjaśnić różnicę, która często umyka w rozmowach o AI.',
    psychology: 'Obietnica nauki czegoś. Klient otwiera, bo chce zrozumieć temat.',
  },
  {
    id: 'mit_do_obalenia',
    template: 'Cześć {decydent_imie},\n\nJest jeden mit o AI, który warto obalić — szczególnie w kontekście tego co robimy.',
    psychology: 'Hook przez ciekawość. "Mit do obalenia" intryguje.',
  },
  {
    id: 'nie_kazdy_wie',
    template: 'Cześć {decydent_imie},\n\nNie każdy o tym wie — ale jest fundamentalna różnica między AI z plikami a AI z bazą wektorową.',
    psychology: 'Pochlebia inteligencji klienta ("nie każdy wie, ale Ty zrozumiesz").',
  },
]

export const FU3_BODY_VARIANTS = [
  {
    id: 'chatgpt_vs_company_brain',
    instruction: 'Wyjaśnij różnicę: ChatGPT z plikami pamięta je tylko w jednej rozmowie, potem zapomina. Company Brain trzyma wiedzę w wektorowej bazie i używa jej codziennie, miesiącami — w każdym mailu, ofercie, scoringu. Użyj analogii: praktykant z notatkami na biurku vs pracownik z dwuletnim stażem z wiedzą w głowie.',
  },
  {
    id: 'generyczne_vs_kontekstowe',
    instruction: 'Wyjaśnij różnicę: generyczne AI (ChatGPT, Copilot) pisze maila jak student bez kontekstu. Company Brain pisze maila jak handlowiec który zna każdą wygraną z poprzedniego roku. Skup się na efekcie końcowym (jakość wiadomości), nie technologii.',
  },
  {
    id: 'jednorazowe_vs_trwale',
    instruction: 'Wyjaśnij różnicę: większość firm "wdraża AI" jako jednorazowy projekt — wypełniają jednym promptem, używają miesiąc, zapominają. Company Brain to żywy system — uczy się dalej, im więcej tam wrzucisz, tym mądrzejszy się staje. Analogia: kupujesz inwestycję, nie subskrypcję.',
  },
]

export const FU3_CLOSING_VARIANTS = [
  {
    id: 'wideo_z_scarcity',
    template: 'Wczesna cena dla pierwszych klientów nadal obowiązuje. Mam 7-minutowe wideo które pokazuje to w działaniu — wysłać?',
    psychology: 'Łączy edukację z scarcity i CTA. Naturalne przejście po wyjaśnieniu różnicy.',
  },
  {
    id: 'pokaz_na_zywo',
    template: 'Mogę Ci to pokazać na żywo na Twoich danych w 5 minut. Wystarczy że wrzucisz mi 3 pliki o swojej firmie. Robimy?',
    psychology: 'Super konkretne — propozycja demo na ich danych. Pokazuje pewność produktu.',
  },
  {
    id: 'dla_ciekawosci',
    template: 'Jeśli to Cię ciekawi — mam krótkie wideo, daj znać. Jeśli już wiesz wszystko, to też spoko.',
    psychology: 'Niskociśnieniowe. Pozwala klientowi nie czuć się przyciskanym.',
  },
  {
    id: 'pytanie_zwrotne',
    template: 'Powiedz mi — czy to jest dla Ciebie nowa wiedza, czy znałeś już tę różnicę?',
    psychology: 'Pytanie diagnostyczne otwiera dialog. Klient odpowiada, zaczyna rozmowę.',
  },
]
