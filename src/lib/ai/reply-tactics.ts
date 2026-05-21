import { AM_CONTEXT, TONE_RULES } from './icp-context'

export type ReplyCategory =
  | 'ZAINTERESOWANY_GORACY'
  | 'ZAINTERESOWANY_CHLODNY'
  | 'OBIEKCJA_CENA'
  | 'OBIEKCJA_CZAS'
  | 'OBJEKCJA_ZAUFANIE'
  | 'OBJEKCJA_WEWNETRZNA'
  | 'ZIMNA_ODMOWA'

export interface CategoryConfig {
  label: string
  color: string
  bg: string
  emoji: string
}

export const CATEGORY_CONFIG: Record<ReplyCategory, CategoryConfig> = {
  ZAINTERESOWANY_GORACY:   { label: 'Zainteresowany gorący',  color: '#22C55E', bg: 'rgba(34,197,94,0.12)',    emoji: '🔥' },
  ZAINTERESOWANY_CHLODNY:  { label: 'Zainteresowany chłodny', color: '#EAB308', bg: 'rgba(234,179,8,0.12)',    emoji: '🌡️' },
  OBIEKCJA_CENA:           { label: 'Objekcja: cena',         color: '#F97316', bg: 'rgba(249,115,22,0.12)',   emoji: '💰' },
  OBIEKCJA_CZAS:           { label: 'Objekcja: czas',         color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',   emoji: '⏰' },
  OBJEKCJA_ZAUFANIE:       { label: 'Objekcja: zaufanie',     color: '#A855F7', bg: 'rgba(168,85,247,0.12)',   emoji: '🤔' },
  OBJEKCJA_WEWNETRZNA:     { label: 'Objekcja: wewnętrzna',   color: '#6B7280', bg: 'rgba(107,114,128,0.12)',  emoji: '🏢' },
  ZIMNA_ODMOWA:            { label: 'Zimna odmowa',            color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    emoji: '❌' },
}

export interface Tactic {
  expert: string
  name: string
  description: string
  systemPrompt: string
  isSilence?: boolean
}

const BASE_REPLY_PROMPT = `${AM_CONTEXT}

${TONE_RULES}

Jesteś ekspertem sprzedaży B2B specjalizującym się w follow-upach
dla polskiego rynku agencji i firm usługowych.
Piszesz repliki w imieniu AM Automations.

Twoja replika musi:
1. Nawiązać bezpośrednio do tego co napisał prospekt
2. Nie powtarzać argumentów z pierwszej wiadomości słowo w słowo
3. Przesunąć rozmowę do przodu — masz konkretny cel
4. Być krótka — maks. 4-5 zdań na LinkedIn, do 120 słów na email
5. Pisać jak człowiek, nie jak automat sprzedażowy

Odpowiedz TYLKO gotową wiadomością do wysłania. Żadnych komentarzy.`

export const TACTICS: Record<ReplyCategory, Tactic[]> = {
  ZAINTERESOWANY_GORACY: [
    {
      expert: 'Jordan Belfort',
      name: 'Konkretny termin',
      description: 'Zamknij przez zaproponowanie dokładnego terminu rozmowy',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Straight Line Close (Belfort)
Prospekt jest zainteresowany — nie trać pędu. Zaproponuj dwa konkretne terminy rozmowy
(np. "jutro o 11 lub w czwartek o 15"). Nie pytaj "kiedy ma Pan czas" — to słabe.
Daj mu wybór między dwiema opcjami. Krótko, pewnie, konkretnie.`,
    },
    {
      expert: 'Russell Brunson',
      name: 'Funnel do demo',
      description: 'Wyślij link do kreatora H14 z personalizowanym kontekstem',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Funnel Value (Brunson)
Prospekt jest zainteresowany — zamiast od razu umawiać rozmowę, daj mu
coś konkretnego do zobaczenia. Wspomnij o kreatorze H14 lub demo które
pokazuje jak system działałby w jego konkretnej branży. Zakończ pytaniem
"Czy link do 10-minutowego przejścia przez system byłby pomocny?"`,
    },
    {
      expert: 'Grant Cardone',
      name: '10x Eskalacja',
      description: 'Natychmiastowa eskalacja do rozmowy telefonicznej',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: 10x Escalation (Cardone)
Prospekt jest gorący — eskaluj natychmiast. Zaproponuj rozmowę telefoniczną
dzisiaj lub jutro. Ton pewny, bez przepraszania. "Masz 15 minut dziś po 17?
Pokażę Ci prototyp zanim ktokolwiek inny to zobaczy."`,
    },
  ],

  ZAINTERESOWANY_CHLODNY: [
    {
      expert: 'Dan Kennedy',
      name: 'Konkretna oferta FOMO',
      description: 'Ogranicz dostęp: zostało 5 miejsc pilotażowych w tym kwartale',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Scarcity Offer (Kennedy)
Prospekt jest chłodny — potrzebuje powodu żeby działać teraz, nie "kiedyś".
Stwórz konkretną ramę: mamy 5 miejsc pilotażowych w tym kwartale, 3 już zajęte.
Jeden konkretny fakt o ich sytuacji. Jedno jasne CTA z datą.`,
    },
    {
      expert: 'Alex Hormozi',
      name: 'Matematyka ROI',
      description: 'Policz na jego liczbach ile traci każdy miesiąc bez systemu',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: ROI Math (Hormozi)
Prospekt nie odczuwa pilności — pokaż mu matematykę. Szacuj jaki ma miesięczny
obrót, ile % leadów wypada bez follow-upu (branżowa średnia: 47%), policz ile
to pieniędzy rocznie. Porównaj z kosztem 10k PLN pilotażu. Zakończ spokojnie:
"Liczby mają sens? Możemy to omówić."`,
    },
    {
      expert: 'Gary Vee',
      name: 'Nurturing bez presji',
      description: 'Daj wartość bez oczekiwań, zostaw otwarte drzwi',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Long-game Nurturing (Gary Vee)
Prospekt nie jest gotowy — nie trać go. Daj mu coś wartościowego bez proszenia
o nic w zamian: konkretny insight o jego branży, pytanie które zainspiruje do
refleksji, lub link do materiału który mu pomoże niezależnie od H14.
Zakończ otwartym: "Pisz jak będzie coś aktualnego z mojej strony."`,
    },
  ],

  OBIEKCJA_CENA: [
    {
      expert: 'Alex Hormozi',
      name: 'ROI na miesiące',
      description: 'Rozłóż inwestycję i pokaż zwrot przy 2 dodatkowych dealach/mc',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: ROI Math (Hormozi)
Cena to obiekcja — nie broń jej, rozbroją ją liczby. 10k PLN podzielone na
12 miesięcy to 833 PLN/mc. Przy 2 dodatkowych dealach miesięcznie dzięki
systemowi (a taki jest wynik u naszych klientów) zwrot następuje w ciągu
3-4 miesięcy. Pytanie: ile kosztuje jeden stracony deal u tego klienta?`,
    },
    {
      expert: 'Dan Kennedy',
      name: 'Koszt niedziałania',
      description: 'Reframe: ile kosztuje każdy miesiąc bez systemu?',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Cost of Inaction (Kennedy)
Nie wchodź w negocjacje cenowe. Zmień perspektywę: ile kosztuje miesiąc
bez systemu? 47% leadów bez follow-upu = ile pieniędzy wylatuje przez komin?
Cena 10k PLN to koszt jednorazowy. Koszt braku systemu to koszt każdego miesiąca.
Jeden fakt, jedno pytanie zwrotne.`,
    },
    {
      expert: 'Jordan Belfort',
      name: 'Izolacja objekcji',
      description: 'Sprawdź czy cena to jedyna przeszkoda przed działaniem',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Objection Isolation (Belfort)
Zanim walczysz z ceną, sprawdź czy to jedyna przeszkoda. Zapytaj wprost:
"Gdyby kwestia budżetu nie była problemem, czy byłby Pan gotowy startować?"
Jeśli odpowie tak — masz otwartą drogę do rozmowy o wartości i warunkach.
Jeśli nie — odkryjesz prawdziwą objekcję. Krótko, bez presji.`,
    },
  ],

  OBIEKCJA_CZAS: [
    {
      expert: 'Grant Cardone',
      name: 'Koszt czekania',
      description: 'Policz ile kosztuje każdy miesiąc odkładania decyzji',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Urgency Math (Cardone)
"Teraz nie ma czasu" = odkładanie kosztuje. Policz: ile nowych leadów wpada
miesięcznie, ile z nich odpada bez follow-upu (47%), ile to warte w PLN.
Każdy miesiąc odkładania to konkretna kwota zostawiona na stole. Zaproponuj
15 minut żeby to liczyć razem.`,
    },
    {
      expert: 'Russell Brunson',
      name: '15-minutowy mikro-krok',
      description: 'Zaproponuj rozmowę bez zobowiązań jako pierwszy malutki krok',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Micro-step (Brunson)
Czas jest cenny — nie proś o dużo. Poproś o 15 minut, bez prezentacji,
bez presji. "Chcę tylko zrozumieć jak wygląda Wasz pipeline dziś i powiedzieć
Ci szczerze czy H14 ma sens w Waszym przypadku. 15 minut, zero sprzedaży."`,
    },
    {
      expert: 'Dan Kennedy',
      name: 'Zasiej i wróć',
      description: 'Daj wartościowy materiał i zaplanuj follow-up za 6 tygodni',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Plant and Return (Kennedy)
Nie walcz z timingiem — akceptuj go i zapisz klienta na przyszłość.
"Rozumiem, Q4 to ciężki czas. Wyślę Ci jedno zestawienie które pomoże
w planowaniu Q1 niezależnie od tego czy zdecydujecie się na H14.
Wracam do Ciebie w [konkretna data za 6 tygodni] — jest okej?"`,
    },
  ],

  OBJEKCJA_ZAUFANIE: [
    {
      expert: 'Seth Godin',
      name: 'Dowód społeczny',
      description: 'Case study Foodly Labs + konkretne liczby z wdrożenia',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Social Proof (Godin)
Zaufanie buduje się dowodem, nie obietnicami. Podaj konkretny przykład:
"Foodly Labs (agencja marketingowa, 12 osób) wdrożyła H14 w 14 dni.
W pierwszym miesiącu: 3 leady które wcześniej by odpadły zamienili się w deale."
Zaproponuj rozmowę z osobą z tej firmy lub demo na ich danych.`,
    },
    {
      expert: 'Russell Brunson',
      name: 'Demo bez ryzyka',
      description: 'Zaproś do prototypu — niech zobaczą zanim cokolwiek podpiszą',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Demo First (Brunson)
Nie proś o zaufanie — pozwól im je zbudować samodzielnie. Zaproponuj
prototyp bez podpisywania czegokolwiek: "Zbuduję Ci w 3 dni mini-wersję
H14 z Waszymi danymi. Zero kosztów, zero zobowiązań. Jak to wygląda?"`,
    },
    {
      expert: 'Jordan Belfort',
      name: 'Gwarancja modelu 20/80',
      description: 'Wyjaśnij że ryzyko jest minimalne — płacą głównie po wdrożeniu',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Risk Reversal (Belfort)
Obiekcja zaufania = za duże ryzyko. Odwróć ryzyko przez model płatności.
"80% płatności następuje dopiero po wdrożeniu — Wy oceniacie czy system
spełnia oczekiwania. Jeśli nie spełnia, nie płacicie reszty. Jak wygląda
ryzyko z Waszej perspektywy?"`,
    },
  ],

  OBJEKCJA_WEWNETRZNA: [
    {
      expert: 'Jordan Belfort',
      name: 'Termin po decyzji',
      description: 'Zaplanuj konkretny następny krok po rozmowie z przełożonym',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Lock the next step (Belfort)
Decyzja wymaga konsultacji — akceptuj to i od razu zaplanuj następny krok.
"Kiedy Wasza rozmowa się odbędzie?" — ustal konkretną datę i zaproponuj
follow-up nazajutrz. Nie zostawiaj tematu otwartego bez daty. Krótko, konkretnie.`,
    },
    {
      expert: 'Dan Kennedy',
      name: 'Materiał dla decydenta',
      description: 'Daj gotowy PDF lub link który zamknie za Ciebie w zarządzie',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Decision-maker Package (Kennedy)
Zamiast czekać na wynik rozmowy wewnętrznej — wyposażonej ją. Zaproponuj
że przygotujesz krótkie podsumowanie (1 strona) dla decydenta: problem,
rozwiązanie, koszt, zwrot z inwestycji, gwarancja 20/80. Coś co możesz
wziąć na zarząd i pokazać bez Ciebie.`,
    },
    {
      expert: 'Grant Cardone',
      name: 'Włącz decydenta',
      description: 'Poproś o trójstronną rozmowę lub intro do zarządu',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Include the decision maker (Cardone)
Nie czekaj na wynik rozmowy wewnętrznej — wejdź do niej. Poproś wprost:
"Czy moglibyśmy zorganizować 20-minutową rozmowę razem z Twoim wspólnikiem/
CEO? Chcę odpowiedzieć na jego pytania bezpośrednio, bez głuchego telefonu."
Pewnie, bez przepraszania.`,
    },
  ],

  ZIMNA_ODMOWA: [
    {
      expert: 'Gary Vee',
      name: 'Graceful Exit',
      description: 'Krótko, bez presji, zostaw drzwi otwarte na przyszłość',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Graceful Exit (Gary Vee)
Odmowa — uszanuj ją. Krótka wiadomość, zero presji, zero defensywności.
"Rozumiem, nie ma problemu. Gdyby cokolwiek się zmieniło — piszcie.
Życzę powodzenia z projektami." I nic więcej. Profesjonalnie, ludzko.`,
    },
    {
      expert: 'Seth Godin',
      name: 'Ostatnia wartość',
      description: 'Zostaw coś przydatnego — insight o ich branży bez sprzedaży',
      systemPrompt: `${BASE_REPLY_PROMPT}

TAKTYKA: Last Value (Godin)
Odchodź z czymś wartościowym. Wyślij jeden krótki insight który pomoże
im niezależnie od H14: statystyka branżowa, prosty framework, obserwacja
z rynku. Bez proszenia o cokolwiek. Zapamiętają Cię pozytywnie gdy zmienią zdanie.`,
    },
    {
      expert: 'Cisza',
      name: 'Brak odpowiedzi',
      description: 'Nie pisz nic — czasem brak reakcji jest najlepszą taktyką',
      systemPrompt: '',
      isSilence: true,
    },
  ],
}

export const CLASSIFICATION_PROMPT = `Jesteś ekspertem sprzedaży B2B. Klasyfikujesz odpowiedzi prospektów.

Kategorie:
- ZAINTERESOWANY_GORACY: "Tak, pokaż mi więcej", "Chętnie pogadam", konkretne pytania
- ZAINTERESOWANY_CHLODNY: "Może kiedyś", "Wyślij info", brak konkretu
- OBIEKCJA_CENA: "Za drogo", "Nie mamy budżetu", "Ile to kosztuje"
- OBIEKCJA_CZAS: "Teraz nie", "Po kwartale", "Mamy ważniejsze projekty"
- OBJEKCJA_ZAUFANIE: "Skąd mam wiedzieć że zadziała", "Chcę zobaczyć przykłady"
- OBJEKCJA_WEWNETRZNA: "Muszę zapytać wspólnika/zarząd/prawnika"
- ZIMNA_ODMOWA: "Nie jesteśmy zainteresowani", "Proszę nie pisać"

Odpowiedz TYLKO JSON-em:
{"category": "<jedna z 7 kategorii>", "reason": "<1 zdanie po polsku dlaczego ta kategoria>"}`
