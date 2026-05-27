// fu2Variants.ts — v2 hotfix
// Frazy "Dziś nic od Ciebie nie chcę" i "9 na 10" FIZYCZNIE NIE ISTNIEJĄ w tym pliku.
// Były problemem v1 gdzie LLM kopiował zakazaną frazę z promptu.

export const FU2_OPENING_VARIANTS = [
  {
    id: 'pytanie_bez_celu',
    szkola: 'PYTANIE',
    template: 'Cześć {decydent_imie},\n\nMogę Ci coś powiedzieć bez żadnej ukrytej agendy?',
    psychology: 'Pytanie aktywuje mózg. "Bez ukrytej agendy" rozbraja czujność.',
    pierwsze_slowa: ['mogę', 'ci', 'coś', 'powiedzieć', 'bez'],
  },
  {
    id: 'teza_bez_cta',
    szkola: 'TEZA',
    template: 'Cześć {decydent_imie},\n\nNajlepsze rzeczy w sprzedaży B2B nie mają wezwania do działania na końcu.',
    psychology: 'Prowokacyjna teza. Klient czyta żeby zweryfikować — i sam siebie przekonuje że to nie sprzedaż.',
    pierwsze_slowa: ['najlepsze', 'rzeczy', 'w', 'sprzedaży', 'b2b'],
  },
  {
    id: 'liczba_setka_rozmow',
    szkola: 'LICZBA',
    template: 'Cześć {decydent_imie},\n\nPo setce rozmów z firmami z {branza} zauważyłem rzecz, której prawie nikt nie nazywa głośno.',
    psychology: 'Autorytet ("setce rozmów") + intryga ("nikt nie nazywa głośno").',
    pierwsze_slowa: ['po', 'setce', 'rozmów', 'z', 'firmami'],
  },
  {
    id: 'u_was_testowali',
    szkola: 'SYTUACJA',
    template: 'Cześć {decydent_imie},\n\nW {nazwa_firmy} prawdopodobnie testowaliście już różne narzędzia — i pewnie widzieliście dokładnie to samo.',
    psychology: 'Sugeruje że klient zna już ten ból. Klient czyta żeby zweryfikować "czy to o nas".',
    pierwsze_slowa: ['w', 'nazwa', 'firmy', 'prawdopodobnie', 'testowaliście'],
  },
  {
    id: 'chodzi_po_glowie',
    szkola: 'OBSERWACJA',
    template: 'Cześć {decydent_imie},\n\nCoś mi chodzi po głowie odkąd patrzyłem na profil {nazwa_firmy} — i nie wymaga to żadnej Twojej reakcji.',
    psychology: 'Pamięć konkretnej firmy + zwolnienie z presji odpowiedzi.',
    pierwsze_slowa: ['coś', 'mi', 'chodzi', 'po', 'głowie'],
  },
]

export const FU2_BODY_VARIANTS = [
  {
    id: 'tempo_vs_liczba',
    instruction: `Wyjaśnij ten konkretny insight: firmy myślą że problem to za mało leadów. Realny problem to TEMPO ich obsługi — lead pisze w środę, firma odpisuje w piątek, lead już rozmawia z konkurencją.

Wprowadź insight zwrotem z poniższej listy (wybierz JEDEN, nie powtarzaj między wariantami):
- "patrzyłem ostatnio na to u kilku firm"
- "to typowy schemat który widzę"
- "z mojego doświadczenia tak działa"
- "wraca to u prawie każdej firmy która do nas trafia"
- "rzadko ktoś o tym mówi, ale tak to wygląda"

Zakończ obserwację zdaniem: "To nie problem liczby. To problem tempa."

NIE wspominaj o {nazwa_produktu_klienta}. NIE proponuj rozwiązania. To wiadomość edukacyjna.`,
    zakazane_zwroty_dla_llm: ['u 9 na 10', 'dziewięciu na dziesięć', '9/10', 'większość firm'],
  },
  {
    id: 'wlasciciel_blokuje',
    instruction: `Wyjaśnij ten insight: firma rośnie tylko tak szybko jak właściciel zdąży wszystko ogarnąć. Każda decyzja, każda oferta, każdy ważniejszy mail przechodzi przez jego głowę.

Wprowadź insight zwrotem z poniższej listy (wybierz JEDEN):
- "widzę to u właścicieli małych i średnich firm"
- "to typowy schemat przy skalowaniu"
- "z czego nieraz nawet właściciele nie zdają sobie sprawy"
- "obserwuję to u firm które próbują rosnąć"

Zakończ: "Skalowanie nie blokuje się na rynku. Blokuje się na właścicielu."

NIE wspominaj o {nazwa_produktu_klienta}.`,
    zakazane_zwroty_dla_llm: ['u 9 na 10', 'dziewięciu na dziesięć', '9/10', 'większość firm'],
  },
  {
    id: 'oferty_template',
    instruction: `Wyjaśnij insight: większość ofert które klienci dostają wygląda jak template. Klient czyta "to samo dostałem od 5 innych firm" i wybiera po cenie.

Wprowadź insight zwrotem z poniższej listy (wybierz JEDEN):
- "to typowy błąd który widzę"
- "wraca to u wielu firm"
- "z mojego doświadczenia to częsta przyczyna"
- "rzadko się o tym mówi głośno"

Zakończ obserwacją: "Generyczna oferta to drogi sposób na to żeby przegrać z tańszą konkurencją."

NIE wspominaj o {nazwa_produktu_klienta}.`,
    zakazane_zwroty_dla_llm: ['u 9 na 10', 'dziewięciu na dziesięć', '9/10', 'większość firm'],
  },
]

// KRYTYCZNE: żadne z tych zakończeń NIE może zawierać znaku zapytania ani CTA.
export const FU2_CLOSING_VARIANTS = [
  {
    id: 'niezaleznie_pracowac',
    template: 'Pomyślałem że Ci się to może przydać — niezależnie od tego, czy kiedykolwiek będziemy pracować razem.',
    psychology: 'Klasyk Godina (w innej formie). Brak prośby, czysta wartość.',
  },
  {
    id: 'bez_agendy',
    template: 'Po prostu warto było to powiedzieć. Bez agendy.',
    psychology: 'Krótkie. "Bez agendy" rozbraja podejrzenie sprzedaży.',
  },
  {
    id: 'do_przemyslenia',
    template: 'Zostawiam to do przemyślenia. Niczego nie musisz z tym robić.',
    psychology: 'Najbardziej luźne. Zero presji.',
  },
  {
    id: 'jesli_oczywiste',
    template: 'Jeśli to dla Ciebie oczywiste — przepraszam za zawracanie głowy. Wolałem mieć pewność że o tym wiesz.',
    psychology: 'Pochlebia inteligencji klienta. Niski próg ego.',
  },
  {
    id: 'wiesz_gdzie_znalezc',
    template: 'Jeśli kiedyś coś z tego wyniknie — wiesz gdzie mnie znaleźć.',
    psychology: 'Subtelne "drzwi otwarte" bez nachalności.',
  },
]
