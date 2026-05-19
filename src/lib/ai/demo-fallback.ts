import { EXPERTS } from './experts'
import { TACTICS, type ReplyCategory } from './reply-tactics'

// ─── Outreach demo ────────────────────────────────────────────────────────────

function outreachDemo(companyName: string, decisionMakerName: string | undefined) {
  const name = decisionMakerName ? ` ${decisionMakerName}` : ''
  const firm = companyName || 'Wasza firma'

  return {
    kennedy: `${name ? name + ',' : firm + ','} widziałem że ${firm} nie ma żadnego systemu kwalifikacji leadów na stronie. Przy obecnym ruchu to co najmniej 3-4 potencjalnych klientów miesięcznie którzy po prostu znikają. Wdrożyłem system który to naprawia w 14 dni — bez ryzyka, bo 80% płatności dopiero po efektach. Masz 20 minut w tym tygodniu żeby to zobaczyć?`,

    belfort: `Cześć${name},\n\nTrafiłem na ${firm} podczas researchu agencji które mogłyby skorzystać z automatyzacji sprzedaży. Widzę że macie solidne portfolio — zastanawiam się jak wygląda u Was zarządzanie leadami i follow-upami?\n\nBuduję z partnerem system który pozwala agencjom odzyskać nawet 8 godzin tygodniowo i nie tracić klientów przez brak kontaktu. Wdrożenie zajmuje 2 tygodnie, prototyp gotowy w 3 dni.\n\nCzy warto zamienić 15 minut żeby sprawdzić czy ma to sens w Waszym przypadku?`,

    hormozi: `${firm} traci statystycznie 47% potencjalnych klientów przez brak follow-upu. To nie opinia — to branżowa liczba.\n\nPrzy założeniu że macie 10 leadów miesięcznie i średni deal 5000 PLN, to 23 500 PLN rocznie które wychodzą przez komin.\n\nMój system kosztuje 10 000 PLN. Zwraca się przy 2 dodatkowych dealach — czyli w ciągu 1-2 miesięcy.\n\nJeśli te liczby mają sens — napisz, wyślę link do demo.`,

    icp: {
      score: 7,
      fit: 'warm' as const,
      reason: `${firm} pasuje do ICP AM Automations jako firma usługowa B2B z potencjalnym problemem zarządzania leadami.`,
      pain_point: 'Brak systematycznego follow-upu i ręczna kwalifikacja leadów — typowe dla firm 5-25 osób bez dedykowanego CRM.',
    },
  }
}

export function getDemoOutreach(
  companyName: string,
  decisionMakerName?: string,
) {
  const demo = outreachDemo(companyName, decisionMakerName)
  return {
    variants: {
      kennedy: { message: demo.kennedy, expert: EXPERTS[0] },
      belfort: { message: demo.belfort, expert: EXPERTS[1] },
      hormozi: { message: demo.hormozi, expert: EXPERTS[2] },
    },
    icp: demo.icp,
    _demo: true,
  }
}

// ─── Reply demo ───────────────────────────────────────────────────────────────

const DEMO_REPLY_MAP: Record<ReplyCategory, (string | null)[]> = {
  ZAINTERESOWANY_GORACY: [
    'Super, mam wolne jutro o 11:00 lub w czwartek o 15:00. Który termin pasuje?',
    'Świetnie! Wysyłam Ci link do 10-minutowego przejścia przez system — zobaczysz jak to działa na żywych danych agencji podobnej do Waszej.',
    'Doskonale. Masz dziś po 17? Pokażę Ci prototyp zanim ktokolwiek inny to zobaczy.',
  ],
  ZAINTERESOWANY_CHLODNY: [
    'Mam dla Ciebie konkret: zostały nam 3 miejsca pilotażowe w tym kwartale w cenie 10k PLN. Kolejne ruszają dopiero w Q1 w wyższej cenie. Kiedy moglibyśmy porozmawiać o szczegółach?',
    'Policzmy szybko: jeśli macie 8 leadów miesięcznie i tracicie 47% bez follow-upu, to ok. 20k PLN rocznie które nie wracają. System kosztuje 10k, zwrot w 2 miesiące. Czy ta matematyka ma sens u Was?',
    'Rozumiem, nie ma presji. Zostawiam Ci jeden materiał który może być przydatny niezależnie od decyzji — krótki raport o tym jak agencje 5-20 osób zarządzają pipeline w 2025. Pisz jeśli cokolwiek się zmieni.',
  ],
  OBIEKCJA_CENA: [
    '10k PLN podzielone na 12 miesięcy = 833 PLN/mc. Przy jednym dodatkowym dealzie miesięcznie zwrot następuje w pierwszym miesiącu. Ile wynosi u Was średni kontrakt?',
    'Rozumiem. Pytanie zwrotne: ile kosztuje Waszą firmę jeden miesiąc w którym 3-4 leady odpadają bez odpowiedzi? Bo ten koszt ponoszono każdego miesiąca, niezależnie od decyzji o systemie.',
    'Czy gdybyśmy znaleźli rozwiązanie finansowe które Ci odpowiada, cena byłaby jedyną przeszkodą przed startem?',
  ],
  OBIEKCJA_CZAS: [
    'Jasne — każdy miesiąc odkładania to jednak konkretna kwota. Przy 8 leadach/mc i 47% odpadu to ok. 1500-2000 PLN miesięcznie zostawionych na stole. Czy 15 minut rozmowy żeby to policzyć razem nie jest warte tej kwoty?',
    'Rozumiem, szanuję to. Może 15-minutowa rozmowa bez żadnych zobowiązań? Chcę tylko zrozumieć jak wygląda Wasz pipeline dziś i powiedzieć szczerze czy H14 w ogóle ma sens w Waszym przypadku.',
    'Bez problemu. Wrócę do Ciebie za 6 tygodni. W między czasie wysyłam jedno zestawienie które może się przydać przy planowaniu Q1 — całkowicie niezależnie od H14.',
  ],
  OBJEKCJA_ZAUFANIE: [
    'Rozumiem sceptycyzm. Foodly Labs — agencja marketingowa, 12 osób — wdrożyła H14 w 14 dni. W pierwszym miesiącu 3 leady które normalnie by odpadły zamieniły się w deale. Mogę Cię połączyć z ich CEO jeśli chcesz porozmawiać bezpośrednio.',
    'Żadnego ryzyka z mojej strony: zbuduję Ci w 3 dni prototyp z Waszymi danymi, zero kosztów, zero zobowiązań. Sam ocenisz czy to działa zanim cokolwiek podpiszesz.',
    'Dlatego mamy model 20/80 — 20% płacisz z góry za prototyp, 80% dopiero gdy system działa i jesteś zadowolony. Ryzyko jest minimalne po Waszej stronie. Jak wygląda to z Twojej perspektywy?',
  ],
  OBJEKCJA_WEWNETRZNA: [
    'Jasne, rozumiem. Kiedy ta rozmowa się odbędzie? Chciałbym zaplanować follow-up na dzień po niej — będę miał wtedy wszystkie odpowiedzi gotowe.',
    'Przygotowuję dla Ciebie jednostronicowe podsumowanie dla decydenta: problem, rozwiązanie, koszt, zwrot z inwestycji, gwarancja 20/80. Coś co możesz zabrać na zarząd bez mnie. Wysłać jutro?',
    'Czy moglibyśmy zorganizować krótką trójstronną rozmowę — Ty, ja i Twój wspólnik/CEO? 20 minut, odpowiem na wszystkie pytania bezpośrednio. Kiedy macie okienko w tym tygodniu?',
  ],
  ZIMNA_ODMOWA: [
    'Rozumiem, żadnego problemu. Gdyby kiedykolwiek coś się zmieniło — pisz. Powodzenia z projektami.',
    'Rozumiem. Zostawiam Ci jeden insight z rynku który może być przydatny niezależnie od H14: agencje które wdrażają jakikolwiek system follow-upu (nawet prosty) notują średnio 23% wyższy conversion z leadów. Może przyda się przy planowaniu. Powodzenia.',
    null,
  ],
}

export function getDemoReply(classification: ReplyCategory) {
  const tactics = TACTICS[classification]
  const messages = DEMO_REPLY_MAP[classification]

  return {
    classification,
    classificationReason: 'Klasyfikacja na podstawie treści wiadomości (tryb demo).',
    replies: tactics.map((tactic, i) => ({
      expert: tactic.expert,
      name: tactic.name,
      description: tactic.description,
      message: messages[i] ?? null,
      isSilence: tactic.isSilence ?? false,
    })),
    _demo: true,
  }
}

export function guessCategory(text: string): ReplyCategory {
  const t = text.toLowerCase()
  if (/nie|odmaw|nie jestem|proszę nie|stop/i.test(t)) return 'ZIMNA_ODMOWA'
  if (/drogo|budżet|kosztuje|cena|za dużo/i.test(t)) return 'OBIEKCJA_CENA'
  if (/teraz nie|po kwartale|później|za miesiąc|inne projekty/i.test(t)) return 'OBIEKCJA_CZAS'
  if (/zarząd|wspólnik|dyrektor|prawnik|muszę zapytać/i.test(t)) return 'OBJEKCJA_WEWNETRZNA'
  if (/przykład|zadziała|skąd wiem|dowód|case/i.test(t)) return 'OBJEKCJA_ZAUFANIE'
  if (/tak|chętnie|pokaż|powiedzcie więcej|kiedy/i.test(t)) return 'ZAINTERESOWANY_GORACY'
  return 'ZAINTERESOWANY_CHLODNY'
}
