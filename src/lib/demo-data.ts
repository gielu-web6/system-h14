// ─── Demo data for the Demo account ──────────────────────────────────────────
// Each export matches the exact local type used by the corresponding page.

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export const DEMO_KPI = {
  leadsThisMonth: 24,
  activeDeals: 11,
  replyRate: '34%',
  revenueThisMonth: 18900,
  monthlyGoal: 25000,
  suggestedLeads: ['Marta Wiśniewska', 'Kamil Nowak', 'Joanna Kowalczyk'],
}

export const DEMO_PNL = [
  { month: 'Lis', revenue: 8400,  costs: 4100, profit: 4300  },
  { month: 'Gru', revenue: 10200, costs: 4600, profit: 5600  },
  { month: 'Sty', revenue: 11800, costs: 5000, profit: 6800  },
  { month: 'Lut', revenue: 13500, costs: 5200, profit: 8300  },
  { month: 'Mar', revenue: 15200, costs: 5800, profit: 9400  },
  { month: 'Kwi', revenue: 18900, costs: 6200, profit: 12700 },
]

// ─── Pipeline deals (matches pipeline/page.tsx Deal interface) ────────────────
// Fields: id, title, contact_name, contact_email, contact_phone,
//         contact_position, contact_segment, value, stage, ai_score_label,
//         ai_score_num, last_contact_date, next_step, project_scope, notes, assigned_to

export type DemoStage =
  | 'nowy_lead' | 'dm_wyslany' | 'odpowiedz' | 'rozmowa_umowiona'
  | 'diagnoza_zrobiona' | 'oferta_prezentowana' | 'negocjacje'
  | 'wygrana' | 'przegrana' | 'nie_teraz'

export interface DemoDeal {
  id: string
  title: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_position: string | null
  contact_segment: string | null
  value: number
  stage: DemoStage
  ai_score_label: 'hot' | 'warm' | 'cold'
  ai_score_num: number
  last_contact_date: string
  next_step: string | null
  project_scope: string | null
  notes: string | null
  assigned_to: string | null
}

export const DEMO_DEALS: DemoDeal[] = [
  // nowy_lead
  { id: 'dd1',  title: 'Pulse Marketing',      contact_name: 'Katarzyna Witek',   contact_email: 'k.witek@pulsemarketing.pl',   contact_phone: '+48 601 111 222', contact_position: 'CEO',         contact_segment: 'agencje',   value: 9600,  stage: 'nowy_lead',          ai_score_label: 'warm', ai_score_num: 62, last_contact_date: '2026-04-20', next_step: 'Wysłać zaproszenie LinkedIn',              project_scope: 'CRM + Outreach',           notes: null,                                         assigned_to: null },
  { id: 'dd2',  title: 'Studio Nord',           contact_name: 'Paweł Jabłoński',   contact_email: 'pawel@studionord.pl',          contact_phone: '+48 602 333 444', contact_position: 'Founder',     contact_segment: 'agencje',   value: 7200,  stage: 'nowy_lead',          ai_score_label: 'cold', ai_score_num: 45, last_contact_date: '2026-04-19', next_step: 'Sprawdzić stronę i IG',                    project_scope: 'Generator Treści',         notes: null,                                         assigned_to: null },
  { id: 'dd3',  title: 'GreenWave Agency',      contact_name: 'Natalia Lis',       contact_email: 'n.lis@greenwave.pl',           contact_phone: '+48 603 555 666', contact_position: 'CMO',         contact_segment: 'agencje',   value: 12000, stage: 'nowy_lead',          ai_score_label: 'warm', ai_score_num: 58, last_contact_date: '2026-04-18', next_step: 'Przesłać case study beauty',               project_scope: 'Pełne wdrożenie',          notes: null,                                         assigned_to: null },
  // dm_wyslany
  { id: 'dd4',  title: 'Digital Sharks',        contact_name: 'Tomasz Wrona',      contact_email: 't.wrona@digitalsharks.pl',    contact_phone: '+48 604 777 888', contact_position: 'Dyrektor',    contact_segment: 'agencje',   value: 14400, stage: 'dm_wyslany',         ai_score_label: 'hot',  ai_score_num: 83, last_contact_date: '2026-04-22', next_step: 'Follow-up po 3 dniach',                    project_scope: 'CRM + AI Scoring + Finanse', notes: 'Wysłano icebreaker o kampaniach B2B',          assigned_to: null },
  { id: 'dd5',  title: 'Creativo Sp. z o.o.',   contact_name: 'Alicja Zawadzka',   contact_email: 'a.zawadzka@creativo.pl',      contact_phone: '+48 605 999 000', contact_position: 'Właścicielka', contact_segment: 'agencje',  value: 8400,  stage: 'dm_wyslany',         ai_score_label: 'warm', ai_score_num: 67, last_contact_date: '2026-04-21', next_step: 'Czekać na odpowiedź',                      project_scope: 'Generator Treści + Portal', notes: null,                                          assigned_to: null },
  // odpowiedz
  { id: 'dd6',  title: 'Agencja Forma',         contact_name: 'Marcin Krawczyk',   contact_email: 'm.krawczyk@agencjaforma.pl', contact_phone: '+48 606 123 456', contact_position: 'Partner',     contact_segment: 'agencje',   value: 16800, stage: 'odpowiedz',          ai_score_label: 'hot',  ai_score_num: 88, last_contact_date: '2026-04-22', next_step: 'Umówić demo call',                         project_scope: 'Pełne wdrożenie AM Platform', notes: 'Bardzo zainteresowany. Pyta o czas wdrożenia', assigned_to: null },
  { id: 'dd7',  title: 'Medianova',             contact_name: 'Ewa Stępień',       contact_email: 'e.stepien@medianova.pl',      contact_phone: '+48 607 234 567', contact_position: 'CEO',         contact_segment: 'agencje',   value: 9600,  stage: 'odpowiedz',          ai_score_label: 'warm', ai_score_num: 71, last_contact_date: '2026-04-21', next_step: 'Potwierdzić zakres',                        project_scope: 'CRM + Outreach Queue',     notes: null,                                         assigned_to: null },
  // rozmowa_umowiona
  { id: 'dd8',  title: 'TopLine Agency',        contact_name: 'Bartosz Kowalski',  contact_email: 'b.kowalski@topline.pl',       contact_phone: '+48 608 345 678', contact_position: 'CEO',         contact_segment: 'agencje',   value: 19200, stage: 'rozmowa_umowiona',   ai_score_label: 'hot',  ai_score_num: 92, last_contact_date: '2026-04-22', next_step: 'Rozmowa 24 kwi godz. 10:00',               project_scope: 'Pełne wdrożenie + abonament', notes: 'Rozmowa umówiona na wtorek',                  assigned_to: null },
  { id: 'dd9',  title: 'Sigma Marketing',       contact_name: 'Zofia Maj',         contact_email: 'z.maj@sigmamarketing.pl',     contact_phone: '+48 609 456 789', contact_position: 'Founder',     contact_segment: 'agencje',   value: 11400, stage: 'rozmowa_umowiona',   ai_score_label: 'hot',  ai_score_num: 79, last_contact_date: '2026-04-23', next_step: 'Rozmowa 25 kwi godz. 14:00',               project_scope: 'CRM + AI + Generator',     notes: null,                                         assigned_to: null },
  // diagnoza_zrobiona
  { id: 'dd10', title: 'Kreacja Premium',       contact_name: 'Łukasz Dąbrowski',  contact_email: 'l.dabrowski@kreacja.pl',      contact_phone: '+48 610 567 890', contact_position: 'Dyrektor Kreatywny', contact_segment: 'agencje', value: 21600, stage: 'diagnoza_zrobiona', ai_score_label: 'hot',  ai_score_num: 91, last_contact_date: '2026-04-20', next_step: 'Przygotować ofertę',                       project_scope: 'Pełne wdrożenie AM Platform', notes: 'Problem: chaos w leadach i 0 śledzenia ofert', assigned_to: null },
  // oferta_prezentowana
  { id: 'dd11', title: 'MediaHouse Warsaw',     contact_name: 'Karolina Wróbel',   contact_email: 'k.wrobel@mediahouse.pl',      contact_phone: '+48 611 678 901', contact_position: 'Właścicielka', contact_segment: 'agencje',  value: 18000, stage: 'oferta_prezentowana', ai_score_label: 'hot',  ai_score_num: 87, last_contact_date: '2026-04-21', next_step: 'Follow-up po ofercie',                     project_scope: 'CRM + Portal Klienta + AI', notes: 'Oferta otwarta 3x. Ostatnio wczoraj 14:23',   assigned_to: null },
  // negocjacje
  { id: 'dd12', title: 'Nova Agency',           contact_name: 'Piotr Kubiak',      contact_email: 'p.kubiak@nova.pl',            contact_phone: '+48 612 789 012', contact_position: 'Co-founder',  contact_segment: 'agencje',   value: 15600, stage: 'negocjacje',         ai_score_label: 'hot',  ai_score_num: 85, last_contact_date: '2026-04-22', next_step: 'Wysłać revidowaną ofertę -10%',            project_scope: 'Pełne wdrożenie',          notes: 'Prosi o rabat. Decyzja w ciągu tygodnia.',    assigned_to: null },
  // wygrana
  { id: 'dd13', title: 'Buzz Digital',          contact_name: 'Aleksandra Nowak',  contact_email: 'a.nowak@buzzdigital.pl',      contact_phone: '+48 613 890 123', contact_position: 'CEO',         contact_segment: 'agencje',   value: 12000, stage: 'wygrana',            ai_score_label: 'hot',  ai_score_num: 95, last_contact_date: '2026-04-15', next_step: 'Start wdrożenia 28 kwi',                   project_scope: 'CRM + Outreach + Generator', notes: 'Podpisana umowa. Zaliczka opłacona.',          assigned_to: null },
  { id: 'dd14', title: 'GrowthLab',             contact_name: 'Mikołaj Szymański', contact_email: 'm.szymanski@growthlab.pl',    contact_phone: '+48 614 901 234', contact_position: 'Founder',     contact_segment: 'agencje',   value: 9600,  stage: 'wygrana',            ai_score_label: 'hot',  ai_score_num: 89, last_contact_date: '2026-04-10', next_step: 'Onboarding call',                          project_scope: 'CRM + AI Scoring',         notes: 'Klient polecony przez TopLine.',              assigned_to: null },
  // przegrana
  { id: 'dd15', title: 'Pivot Studio',          contact_name: 'Rafał Wojciech',    contact_email: 'r.wojciech@pivotstudio.pl',   contact_phone: '+48 615 012 345', contact_position: 'CEO',         contact_segment: 'agencje',   value: 7200,  stage: 'przegrana',          ai_score_label: 'cold', ai_score_num: 38, last_contact_date: '2026-04-05', next_step: null,                                       project_scope: 'Generator Treści',         notes: 'Powód: za drogo. Wybrali tańszą alternatywę.', assigned_to: null },
  // nie_teraz
  { id: 'dd16', title: 'Blaze Communications',  contact_name: 'Monika Zając',      contact_email: 'm.zajac@blaze.pl',            contact_phone: '+48 616 123 456', contact_position: 'CMO',         contact_segment: 'agencje',   value: 8400,  stage: 'nie_teraz',          ai_score_label: 'warm', ai_score_num: 55, last_contact_date: '2026-03-28', next_step: 'Wróć za 3 miesiące',                       project_scope: 'Pełne wdrożenie',          notes: 'Teraz zajęci dużym projektem. Wrócić w lipcu.', assigned_to: null },
]

// ─── Leads (matches leads/page.tsx Lead interface) ────────────────────────────

export interface DemoLead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
  email: string
  phone: string
  city: string
  segment: string
  aiScore: number
  aiLabel: 'hot' | 'warm' | 'cold'
  aiIcpScore: number
  aiSignalsScore: number
  aiActivityScore: number
  aiPotentialScore: number
  aiReasoning: string
  aiScoredAt: string | null
  status: 'nowy' | 'kontakt' | 'zainteresowany' | 'pipeline' | 'nieaktywny'
  lastContact: string
  problem: string
  icebreaker: string
  website?: string
  linkedin?: string
  notes?: string | null
  outreachHistory: { date: string; type: string; content: string }[]
}

export const DEMO_LEADS: DemoLead[] = [
  { id: 'dl1',  firstName: 'Marta',    lastName: 'Wiśniewska',  company: 'Glow Clinic',         position: 'Owner',          email: 'marta.w@glowclinic.pl',       phone: '+48 601 234 567', city: 'Warszawa', segment: 'beauty',    aiScore: 91, aiLabel: 'hot',  aiIcpScore: 24, aiSignalsScore: 23, aiActivityScore: 22, aiPotentialScore: 22, aiReasoning: 'Idealnie pasuje do ICP – klinika z aktywnym IG i Meta Ads, właścicielka decyduje samodzielnie.', aiScoredAt: '2026-04-20T08:00:00Z', status: 'zainteresowany', lastContact: '2026-04-20', problem: 'Brak systemu do śledzenia leadów z Meta Ads – tracimy potencjalnych klientów', icebreaker: 'Widziałam że prowadzicie kampanie dla klinik estetycznych – mam coś co może was bardzo zainteresować', website: 'glowclinic.pl', linkedin: 'linkedin.com/in/martaw', notes: 'Bardzo zainteresowana. Budżet ok. 2k/mc.', outreachHistory: [{ date: '2026-04-10', type: 'LinkedIn DM', content: 'Pierwsze zaproszenie – zaakceptowane.' }, { date: '2026-04-14', type: 'DM #1', content: 'Icebreaker o systemie – odpowiedziała po 2h.' }, { date: '2026-04-20', type: 'DM #2', content: 'Follow-up z case study. Prosi o demo.' }] },
  { id: 'dl2',  firstName: 'Kamil',    lastName: 'Nowak',       company: 'FitZone Kraków',      position: 'Founder',        email: 'k.nowak@fitzone.pl',          phone: '+48 602 345 678', city: 'Kraków',   segment: 'fitness',   aiScore: 84, aiLabel: 'hot',  aiIcpScore: 22, aiSignalsScore: 21, aiActivityScore: 20, aiPotentialScore: 21, aiReasoning: 'Kilka lokalizacji = większy projekt. Founder decyduje, aktywny Instagram.', aiScoredAt: '2026-04-20T08:01:00Z', status: 'kontakt',        lastContact: '2026-04-22', problem: 'Follow-upy prowadzone ręcznie w Excelu – dużo leadów ginie po pierwszym kontakcie', icebreaker: 'Widzę że macie kilka lokalizacji i aktywny profil na IG – mam system który może zautomatyzować waszą sprzedaż', website: 'fitzone.pl', linkedin: 'linkedin.com/in/kamiln', notes: null, outreachHistory: [{ date: '2026-04-19', type: 'LinkedIn', content: 'Zaproszenie zaakceptowane.' }, { date: '2026-04-22', type: 'DM #1', content: 'Icebreaker wysłany.' }] },
  { id: 'dl3',  firstName: 'Joanna',   lastName: 'Kowalczyk',   company: 'Lexar Kancelaria',    position: 'Partner',        email: 'j.kowalczyk@lexar.pl',        phone: '+48 603 456 789', city: 'Wrocław',  segment: 'kancelarie', aiScore: 78, aiLabel: 'hot', aiIcpScore: 20, aiSignalsScore: 20, aiActivityScore: 18, aiPotentialScore: 20, aiReasoning: 'Kancelaria to ICP – brak CRM i ręczny Excel to klasyczny problem dla naszego rozwiązania.', aiScoredAt: '2026-04-20T08:02:00Z', status: 'nowy',           lastContact: '2026-04-22', problem: 'Zarządzanie klientami przez Excela i e-maile – brak widoczności nad potokiem spraw', icebreaker: 'Pracujecie z kilkudziesięcioma klientami jednocześnie – pokazałbym jak możecie śledzić każdy case w jednym miejscu', website: 'lexar.pl', linkedin: 'linkedin.com/in/jkowalczyk', notes: null, outreachHistory: [] },
  { id: 'dl4',  firstName: 'Piotr',    lastName: 'Adamski',     company: 'AdVance Media',       position: 'CEO',            email: 'p.adamski@advancemedia.pl',   phone: '+48 604 567 890', city: 'Gdańsk',   segment: 'agencje',   aiScore: 73, aiLabel: 'warm', aiIcpScore: 19, aiSignalsScore: 18, aiActivityScore: 17, aiPotentialScore: 19, aiReasoning: 'Agencja w ICP, CEO to decydent. Brak sygnałów zakupowych – nie pilne.', aiScoredAt: '2026-04-20T08:03:00Z', status: 'nowy',           lastContact: '2026-04-21', problem: 'Pięć różnych narzędzi do zarządzania agencją – Trello, Slack, HubSpot, Sheets, Canva', icebreaker: 'Widzę że prowadzicie kampanie dla e-commerce – mam coś co mogłoby wyeliminować połowę tych narzędzi', website: 'advancemedia.pl', linkedin: 'linkedin.com/in/padamski', notes: null, outreachHistory: [] },
  { id: 'dl5',  firstName: 'Karolina', lastName: 'Bąk',         company: 'Bliss Beauty Studio', position: 'Właścicielka',   email: 'k.bak@blissbeauty.pl',        phone: '+48 605 678 901', city: 'Poznań',   segment: 'beauty',    aiScore: 69, aiLabel: 'warm', aiIcpScore: 18, aiSignalsScore: 17, aiActivityScore: 19, aiPotentialScore: 15, aiReasoning: 'Studio beauty to ICP, ale mniejszy ticket niż klinika. Aktywna na IG – łatwiejszy kontakt.', aiScoredAt: '2026-04-20T08:04:00Z', status: 'kontakt',        lastContact: '2026-04-18', problem: 'Brak śledzenia skąd przychodzą klienci – nie wiedzą które reklamy działają', icebreaker: 'Prowadzicie studio z kilkoma zabiegami premium – wiem jak można śledzić każdego leada z reklamy do wizyty', website: 'blissbeauty.pl', linkedin: 'linkedin.com/in/karolinabak', notes: 'Aktywna na IG. Dużo Reelsów.', outreachHistory: [{ date: '2026-04-15', type: 'LinkedIn', content: 'Zaproszenie.' }, { date: '2026-04-18', type: 'DM #1', content: 'Icebreaker wysłany.' }] },
  { id: 'dl6',  firstName: 'Michał',   lastName: 'Zielński',    company: 'TechGrowth B2B',      position: 'Sales Director', email: 'm.zielinski@techgrowth.pl',   phone: '+48 606 789 012', city: 'Warszawa', segment: 'it',        aiScore: 65, aiLabel: 'warm', aiIcpScore: 16, aiSignalsScore: 17, aiActivityScore: 16, aiPotentialScore: 16, aiReasoning: 'IT B2B to niszowe ICP. Brak wyraźnych sygnałów zakupowych, ale dobre dopasowanie problemu.', aiScoredAt: '2026-04-20T08:05:00Z', status: 'nowy',           lastContact: '2026-04-17', problem: 'Brak spójnego pipeline dla handlowców – każdy ma swoje notatki', icebreaker: 'Widzę że Wasza firma rośnie – mam system który mógłby ujednolicić pracę waszych handlowców', website: 'techgrowth.pl', linkedin: 'linkedin.com/in/mzielinski', notes: null, outreachHistory: [] },
  { id: 'dl7',  firstName: 'Agnieszka', lastName: 'Woźniak',    company: 'Interior Works',      position: 'CEO',            email: 'a.wozniak@interiorworks.pl',  phone: '+48 607 890 123', city: 'Kraków',   segment: 'usługi',    aiScore: 61, aiLabel: 'warm', aiIcpScore: 15, aiSignalsScore: 15, aiActivityScore: 15, aiPotentialScore: 16, aiReasoning: 'Studio projektowe poza ICP, ale podobny problem. Niski ticket per projekt.', aiScoredAt: '2026-04-20T08:06:00Z', status: 'nowy',           lastContact: '2026-04-16', problem: 'Projekty rozliczane ręcznie, faktury w innym systemie niż CRM', icebreaker: 'Prowadzicie studio projektowe – mam narzędzie które łączy CRM z fakturowaniem', website: 'interiorworks.pl', linkedin: 'linkedin.com/in/agnieszkaw', notes: null, outreachHistory: [] },
  { id: 'dl8',  firstName: 'Radosław', lastName: 'Czajka',      company: 'Mobilni Trenerzy',    position: 'Founder',        email: 'r.czajka@mobilnitrenerzy.pl', phone: '+48 608 901 234', city: 'Wrocław',  segment: 'fitness',   aiScore: 55, aiLabel: 'warm', aiIcpScore: 14, aiSignalsScore: 13, aiActivityScore: 16, aiPotentialScore: 12, aiReasoning: 'Fitness ICP, ale mały ticket. Aktywny IG zwiększa szansę odpowiedzi na DM.', aiScoredAt: '2026-04-20T08:07:00Z', status: 'nowy',           lastContact: '2026-04-15', problem: 'Klienci z social media nie trafiają do żadnego CRM – wszystko w głowie', icebreaker: 'Widzę że trenerów jest u was kilku – mam system który ogarnie całą sprzedaż', website: 'mobilnitrenerzy.pl', linkedin: 'linkedin.com/in/rczajka', notes: null, outreachHistory: [] },
  { id: 'dl9',  firstName: 'Dorota',   lastName: 'Pawlak',      company: 'Edukacja Pro',        position: 'Dyrektor',       email: 'd.pawlak@edukacjapro.pl',     phone: '+48 609 012 345', city: 'Gdańsk',   segment: 'szkolenia', aiScore: 48, aiLabel: 'cold', aiIcpScore: 11, aiSignalsScore: 12, aiActivityScore: 13, aiPotentialScore: 12, aiReasoning: 'Szkolenia B2B poza ICP. Dyrektor może nie być decydentem budżetowym.', aiScoredAt: '2026-04-20T08:08:00Z', status: 'nowy',           lastContact: '2026-04-14', problem: 'Brak automatyzacji rekrutacji uczestników na szkolenia', icebreaker: 'Prowadzicie szkolenia dla firm – mam system który może zautomatyzować zapisy', website: 'edukacjapro.pl', linkedin: 'linkedin.com/in/dorotap', notes: null, outreachHistory: [] },
  { id: 'dl10', firstName: 'Szymon',   lastName: 'Lewandowski', company: 'AutoFlota Polska',    position: 'CEO',            email: 's.lewandowski@autoflota.pl',  phone: '+48 610 123 456', city: 'Warszawa', segment: 'transport', aiScore: 44, aiLabel: 'cold', aiIcpScore: 10, aiSignalsScore: 10, aiActivityScore: 12, aiPotentialScore: 12, aiReasoning: 'Transport poza ICP. CEO jest decydentem, ale produkt słabo pasuje do branży logistycznej.', aiScoredAt: '2026-04-20T08:09:00Z', status: 'nieaktywny',     lastContact: '2026-04-08', problem: 'Brak systemu ofertowania dla flotowych klientów B2B', icebreaker: 'Zarządzacie flotą kilkudziesięciu aut – mam narzędzie które ułatwi sprzedaż flocie B2B', website: 'autoflota.pl', linkedin: 'linkedin.com/in/szymonl', notes: 'Nie odpowiedział na 2 DM.', outreachHistory: [{ date: '2026-04-01', type: 'LinkedIn', content: 'Zaproszenie.' }, { date: '2026-04-08', type: 'DM #1', content: 'Icebreaker.' }] },
]

// ─── Finance income (matches finance/page.tsx IncomeEntry interface) ──────────

export interface DemoIncomeEntry {
  id: string
  client: string
  project: string
  amount: number
  vatRate: number
  vatAmount: number
  grossAmount: number
  netProfit: number
  type: 'zaliczka' | 'rata' | 'końcowa' | 'abonament' | 'faktura'
  status: 'opłacona' | 'oczekująca' | 'zaległa'
  date: string
  invoiceNumber?: string
}

export interface DemoExpenseEntry {
  id: string
  name: string
  category: string
  amount: number
  vatRate: number
  vatAmount: number
  grossAmount: number
  recurring: boolean
  date: string
  invoiceNumber?: string
}

export const DEMO_INCOMES: DemoIncomeEntry[] = [
  { id: 'di1',  client: 'MediaHouse Warsaw',  project: 'Wdrożenie AM Platform',          amount: 7296,  vatRate: 23, vatAmount: 1678, grossAmount: 8974,  netProfit: 7296,  type: 'zaliczka',  status: 'opłacona',   date: '2026-04-05', invoiceNumber: 'FV/2026/04/01' },
  { id: 'di2',  client: 'TopLine Agency',     project: 'CRM + Generator Treści + Portal', amount: 3600,  vatRate: 23, vatAmount: 828,  grossAmount: 4428,  netProfit: 3600,  type: 'zaliczka',  status: 'opłacona',   date: '2026-04-02', invoiceNumber: 'FV/2026/04/02' },
  { id: 'di3',  client: 'Kreacja Premium',    project: 'Pełne wdrożenie AM Platform',    amount: 3600,  vatRate: 23, vatAmount: 828,  grossAmount: 4428,  netProfit: 3600,  type: 'zaliczka',  status: 'opłacona',   date: '2026-03-28', invoiceNumber: 'FV/2026/03/12' },
  { id: 'di4',  client: 'Sigma Marketing',    project: 'Abonament wsparcia – kwiecień',  amount: 1500,  vatRate: 23, vatAmount: 345,  grossAmount: 1845,  netProfit: 1500,  type: 'abonament', status: 'opłacona',   date: '2026-04-01', invoiceNumber: 'FV/2026/04/03' },
  { id: 'di5',  client: 'Nova Agency',        project: 'Abonament – kwiecień',           amount: 990,   vatRate: 23, vatAmount: 228,  grossAmount: 1218,  netProfit: 990,   type: 'abonament', status: 'opłacona',   date: '2026-04-01', invoiceNumber: 'FV/2026/04/04' },
  { id: 'di6',  client: 'TopLine Agency',     project: 'CRM + Generator – rata 2',       amount: 4800,  vatRate: 23, vatAmount: 1104, grossAmount: 5904,  netProfit: 4800,  type: 'rata',      status: 'opłacona',   date: '2026-04-10', invoiceNumber: 'FV/2026/04/05' },
  { id: 'di7',  client: 'Buzz Digital',       project: 'Wdrożenie AM Platform',          amount: 5400,  vatRate: 23, vatAmount: 1242, grossAmount: 6642,  netProfit: 5400,  type: 'zaliczka',  status: 'opłacona',   date: '2026-04-15', invoiceNumber: 'FV/2026/04/06' },
  { id: 'di8',  client: 'MediaHouse Warsaw',  project: 'Rata końcowa',                   amount: 6000,  vatRate: 23, vatAmount: 1380, grossAmount: 7380,  netProfit: 6000,  type: 'końcowa',   status: 'oczekująca', date: '2026-04-30', invoiceNumber: 'FV/2026/04/07' },
  { id: 'di9',  client: 'GrowthLab',          project: 'Abonament – kwiecień',           amount: 990,   vatRate: 23, vatAmount: 228,  grossAmount: 1218,  netProfit: 990,   type: 'abonament', status: 'oczekująca', date: '2026-04-28', invoiceNumber: 'FV/2026/04/08' },
  { id: 'di10', client: 'Kreacja Premium',    project: 'Rata 2 z 3',                     amount: 3600,  vatRate: 23, vatAmount: 828,  grossAmount: 4428,  netProfit: 3600,  type: 'rata',      status: 'zaległa',    date: '2026-04-12', invoiceNumber: 'FV/2026/04/09' },
]

export const DEMO_EXPENSES: DemoExpenseEntry[] = [
  { id: 'de1',  name: 'OpenAI API',          category: 'narzędzia',     amount: 420,  vatRate: 0,  vatAmount: 0,   grossAmount: 420,  recurring: true,  date: '2026-04-01' },
  { id: 'de2',  name: 'Vercel Pro',           category: 'hosting',       amount: 240,  vatRate: 23, vatAmount: 55,  grossAmount: 295,  recurring: true,  date: '2026-04-01' },
  { id: 'de3',  name: 'Supabase Pro',         category: 'hosting',       amount: 200,  vatRate: 0,  vatAmount: 0,   grossAmount: 200,  recurring: true,  date: '2026-04-01' },
  { id: 'de4',  name: 'Canva Teams',          category: 'narzędzia',     amount: 180,  vatRate: 23, vatAmount: 41,  grossAmount: 221,  recurring: true,  date: '2026-04-01' },
  { id: 'de5',  name: 'Biuro – kwiecień',     category: 'biuro',         amount: 1800, vatRate: 23, vatAmount: 414, grossAmount: 2214, recurring: true,  date: '2026-04-05' },
  { id: 'de6',  name: 'Księgowość',           category: 'księgowość',    amount: 500,  vatRate: 23, vatAmount: 115, grossAmount: 615,  recurring: true,  date: '2026-04-08' },
  { id: 'de7',  name: 'LinkedIn Sales Nav',   category: 'narzędzia',     amount: 600,  vatRate: 0,  vatAmount: 0,   grossAmount: 600,  recurring: true,  date: '2026-04-10' },
  { id: 'de8',  name: 'Szkolenie Google Ads', category: 'szkolenia',     amount: 800,  vatRate: 23, vatAmount: 184, grossAmount: 984,  recurring: false, date: '2026-04-12' },
  { id: 'de9',  name: 'Sprzęt – microport',   category: 'sprzęt',        amount: 650,  vatRate: 23, vatAmount: 150, grossAmount: 800,  recurring: false, date: '2026-04-16' },
  { id: 'de10', name: 'Meta Ads własne',      category: 'marketing',     amount: 1200, vatRate: 23, vatAmount: 276, grossAmount: 1476, recurring: false, date: '2026-04-18' },
]

// ─── Outreach queue (matches outreach/page.tsx OutreachItem interface) ────────

export interface DemoOutreachItem {
  id: string
  type: 'zaproszenie' | 'dm-pierwszy' | 'follow-up-1' | 'follow-up-2'
  firstName: string
  lastName: string
  company: string
  position: string
  score: 'hot' | 'warm' | 'cold'
  scoreNum: number
  message: string
  generating: boolean
  done: boolean
}

export const DEMO_OUTREACH: DemoOutreachItem[] = [
  { id: 'do1', type: 'dm-pierwszy',  firstName: 'Marta',    lastName: 'Wiśniewska',  company: 'Glow Clinic',         position: 'Owner',          score: 'hot',  scoreNum: 91, message: 'Widziałam że prowadzicie kampanie dla klinik estetycznych – mam coś co może was bardzo zainteresować. Czy mogę pokazać w 15 min?', generating: false, done: false },
  { id: 'do2', type: 'dm-pierwszy',  firstName: 'Kamil',    lastName: 'Nowak',       company: 'FitZone Kraków',      position: 'Founder',        score: 'hot',  scoreNum: 84, message: 'Widzę że macie kilka lokalizacji – mam system który automatyzuje follow-upy i nigdy nie traci leada. Czy masz 15 minut?',          generating: false, done: false },
  { id: 'do3', type: 'dm-pierwszy',  firstName: 'Joanna',   lastName: 'Kowalczyk',   company: 'Lexar Kancelaria',    position: 'Partner',        score: 'hot',  scoreNum: 78, message: 'Widzę że zarządzacie wieloma sprawami jednocześnie – mogę pokazać jak śledzić każdego klienta bez Excela?',                          generating: false, done: false },
  { id: 'do4', type: 'zaproszenie',  firstName: 'Piotr',    lastName: 'Adamski',     company: 'AdVance Media',       position: 'CEO',            score: 'warm', scoreNum: 73, message: 'Cześć Piotr, rozwijam narzędzia dla agencji marketingowych które łączą CRM, content i finanse w jednym miejscu. Zapraszam do sieci!', generating: false, done: false },
  { id: 'do5', type: 'zaproszenie',  firstName: 'Karolina', lastName: 'Bąk',         company: 'Bliss Beauty Studio', position: 'Właścicielka',   score: 'warm', scoreNum: 69, message: 'Cześć Karolina, pomagam studiom beauty śledzić skąd przychodzą klienci. Mam coś co może cię zainteresować. Zapraszam!',              generating: false, done: false },
  { id: 'do6', type: 'follow-up-1',  firstName: 'Tomasz',   lastName: 'Wrona',       company: 'Digital Sharks',      position: 'Dyrektor',       score: 'hot',  scoreNum: 83, message: 'Tomku, nawiązuję do wiadomości sprzed 3 dni. Przygotowałem krótkie case study agencji B2B która dzięki naszemu systemowi zamknęła 3x więcej deali. Przesłać?', generating: false, done: false },
  { id: 'do7', type: 'follow-up-1',  firstName: 'Alicja',   lastName: 'Zawadzka',    company: 'Creativo Sp. z o.o.', position: 'Właścicielka',  score: 'warm', scoreNum: 67, message: 'Alicjo, widzę że byłaś aktywna na LinkedIn w tym tygodniu. Czy miałaś chwilę spojrzeć na moją poprzednią wiadomość?',                generating: false, done: false },
  { id: 'do8', type: 'follow-up-2',  firstName: 'Michał',   lastName: 'Zieliński',   company: 'TechGrowth B2B',      position: 'Sales Director', score: 'warm', scoreNum: 65, message: 'Michał, ostatni follow-up z mojej strony – link do kalendarza: calendly.com/amautomations. 20 minut i pokażę czy to ma sens dla waszego teamu.',   generating: false, done: false },
]

// ─── Analytics data (matches analytics/page.tsx local types) ─────────────────

export const DEMO_SEGMENT_PERFORMANCE = [
  { segment: 'beauty',    leads: 18, replyRate: 52, closeRate: 28, avgTicket: 14400, revenue: 72000  },
  { segment: 'agencje',   leads: 32, replyRate: 38, closeRate: 22, avgTicket: 13200, revenue: 92400  },
  { segment: 'fitness',   leads: 14, replyRate: 44, closeRate: 18, avgTicket: 9600,  revenue: 28800  },
  { segment: 'kancelarie', leads: 9, replyRate: 31, closeRate: 14, avgTicket: 16800, revenue: 33600  },
  { segment: 'it',        leads: 11, replyRate: 29, closeRate: 12, avgTicket: 18000, revenue: 36000  },
]

export const DEMO_PIPELINE_VELOCITY = [
  { stage: 'Nowy lead → DM',        avgDays: 1  },
  { stage: 'DM → Odpowiedź',        avgDays: 4  },
  { stage: 'Odpowiedź → Rozmowa',   avgDays: 3  },
  { stage: 'Rozmowa → Diagnoza',    avgDays: 2  },
  { stage: 'Diagnoza → Oferta',     avgDays: 5  },
  { stage: 'Oferta → Decyzja',      avgDays: 9  },
]

export const DEMO_WIN_LOSS_REASONS = [
  { reason: 'Za drogo',             percentage: 34, color: '#ef4444' },
  { reason: 'Wybrali konkurencję',  percentage: 28, color: '#f97316' },
  { reason: 'Nie teraz',            percentage: 22, color: '#eab308' },
  { reason: 'Brak budżetu',         percentage: 10, color: '#6366f1' },
  { reason: 'Inne',                 percentage: 6,  color: '#64748b' },
]

export const DEMO_REVENUE_FORECAST = [
  { period: '30 dni', amount: 23400, deals: 4,  probability: '68%' },
  { period: '60 dni', amount: 41200, deals: 7,  probability: '51%' },
  { period: '90 dni', amount: 68800, deals: 11, probability: '39%' },
]

export const DEMO_OUTREACH_FUNNEL = [
  { stage: 'Zaproszenia wysłane', count: 124, color: '#6366f1' },
  { stage: 'Zaakceptowane',       count: 89,  color: '#8b5cf6' },
  { stage: 'Odpowiedzi',          count: 34,  color: '#f59e0b' },
  { stage: 'Rozmowy',             count: 14,  color: '#22c55e' },
  { stage: 'Oferty',              count: 6,   color: '#06b6d4' },
  { stage: 'Wygrane deale',       count: 2,   color: '#10b981' },
]
