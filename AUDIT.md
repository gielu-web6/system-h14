# AUDIT.md — System H14
> Wygenerowano: 2026-06-04 | Claude Sonnet 4.6 | TYLKO ODCZYT

---

## 1. STRUKTURA — Moduły i strony

### Grupy routerów Next.js App Router

```
src/app/
├── (auth)/              — Ekran logowania (localStorage-based, NIE Supabase Auth)
├── (public)/            — Strona publiczna + konfigurator oferty (landing)
├── (dashboard)/         — Główna aplikacja (chroniona, wymaga zalogowania)
├── offer/[slug]/        — Publiczna strona interaktywnej oferty (poza dashboardem)
└── api/                 — Backend API routes
```

### Strony (dashboard) — pełna lista

| Ścieżka | Do czego służy | Status |
|---|---|---|
| `/dashboard` | Główny ekran: KPI, ROI counter, cel przychodowy, zadania, onboarding | DZIAŁA |
| `/leads` | Zarządzanie leadami, import CSV, AI scoring, outreach | DZIAŁA |
| `/ai-scoring` | Masowe uruchamianie AI scoringu dla wszystkich leadów | DZIAŁA |
| `/pipeline` | Kanban CRM z 10 etapami sprzedaży | DZIAŁA |
| `/outreach` | Generator wiadomości LinkedIn/email AI (sekwencja FU) | DZIAŁA |
| `/analytics` | Wykresy pipeline, lead scoring, velocity, win/loss | DZIAŁA |
| `/analytics/forecast` | Do weryfikacji — plik istnieje, treść nie sprawdzona |
| `/analytics/segments` | Do weryfikacji |
| `/analytics/win-loss` | Do weryfikacji |
| `/finance` | Tracker P&L — przychody, koszty, VAT, AI analiza faktur | DZIAŁA (patrz sekcja ATRAPY) |
| `/finance/income` | STUB — redirect('/') | ATRAPA |
| `/finance/expenses` | STUB — redirect('/') | ATRAPA |
| `/knowledge-base` | Formularz profilu firmy (dane dla AI) | DZIAŁA |
| `/company-brain` | Baza wiedzy AI — upload plików, chunking | DZIAŁA |
| `/company-brain/dna` | DNA firmy generowane przez AI z wywiadu | DZIAŁA |
| `/company-brain/files` | Lista i zarządzanie plikami kontekstowymi | DZIAŁA |
| `/company-brain/test` | Testowanie odpowiedzi AI na pytania | DZIAŁA |
| `/content-generator` | Generator postów LinkedIn/Instagram (AI) | DZIAŁA |
| `/content-studio` | Studio treści dla klientów agencji | DZIAŁA |
| `/content-studio/clients/[id]` | Panel klienta: posty, zdjęcia, kalendarz | DZIAŁA |
| `/content-calendar` | Kalendarz zaplanowanych treści | DZIAŁA |
| `/tasks` | Zadania dla Adriana i Maćka (dwie kolumny) | DZIAŁA |
| `/notifications` | Pełna strona powiadomień z grupowaniem po dacie | DZIAŁA |
| `/offer-generator` | Wielokrokowy kreator oferty ze śledzeniem behawioralnym | DZIAŁA |
| `/portal` | Podgląd oferty z hardcoded "Klinika Optima" jako domyślną | CZĘŚCIOWO |
| `/my-stats` | Osobiste statystyki handlowca (deale, outreach) | DZIAŁA |
| `/reply-generator` | Generator odpowiedzi na obiekcje | DZIAŁA |
| `/settings` | STUB — redirect('/') | ATRAPA |
| `/sales` | STUB — redirect('/') | ATRAPA |
| `/sales/leads` | Do weryfikacji — plik istnieje |
| `/sales/outreach` | Do weryfikacji — plik istnieje |
| `/sales/[dealId]` | Szczegóły deala | DZIAŁA |

### API Routes (src/app/api/)

**AI:**
`analyze-invoice`, `analyze-transcript`, `generate-carousel`, `generate-content`,
`generate-hooks`, `generate-image`, `generate-linkedin`, `generate-message`,
`handle-objection`, `match-offer`, `plan-week`, `pre-call-brief`, `reply-generator`,
`repurpose-content`, `score-lead`, `suggest-topics`

**Oferty:** `create`, `list`, `[id]`, `ai-generate`, `ai-variants`, `ai-loss-calculator`,
`accept`, `track`, `pdf-track`

**Company Brain:** `files`, `files/[id]`, `files/[id]/process`, `dna`, `interview`, `search`, `sync`, `test`

**Content Studio:** `onboarding`, `photos/analyze`, `posts/generate`, `scheduler/cron`

**Cron (Vercel):**
| Endpoint | Harmonogram | Co robi |
|---|---|---|
| `morning-brief` | Pon-Pt 7:45 UTC | Poranny brief do Telegrama |
| `evening-reminder` | Pon-Pt 17:30 UTC | Wieczorny reminder |
| `weekly-report` | Pon 8:00 UTC | Raport tygodniowy |
| `monthly-forecast` | 1. dnia miesiąca 9:00 UTC | Prognoza miesięczna |
| `deal-stale-check` | Pon-Pt 8:00 UTC | Sprawdza nieaktywne deale |
| `offer-unopened-check` | Pon-Pt 10:00 UTC | Oferty nieotwarte |
| `brain-check` | Pon 9:00 UTC | Stan Company Brain |
| `follow-up-check` | Codziennie 6:00 UTC | Sprawdza follow-upy |
| `task-reminders` | Codziennie 10:00 UTC | Powiadomienia o zadaniach |

**Inne:** `lead` (webhook z formularza), `deals/notify`, `leads/assign`,
`analyze-url`, `generate-outreach`, `generate-reply`, `webhooks/calendly`, `telegram/test`

---

## 2. DANE vs ATRAPA

### Tryb DEMO (`isDemoMode()` = user.id === 'demo')

Gdy zalogowany jako "Demo", WSZYSTKIE dane poniżej są statyczne — z pliku `src/lib/demo-data.ts`:

| Moduł | Dane demo |
|---|---|
| Dashboard KPI | `DEMO_KPI` — 24 leady, 11 dealów, reply rate 34%, przychód 18 900 PLN |
| Pipeline | `DEMO_DEALS` — 16 hardcoded dealów agencji marketingowych |
| Leady | `DEMO_LEADS` — hardcoded lista leadów z pełnym scoringiem |
| Finanse | `DEMO_INCOMES`, `DEMO_EXPENSES`, `DEMO_PNL` — wymyślone dane P&L |
| Reply rate | '34%' — hardcoded string |
| Cel miesięczny | 25 000 PLN — hardcoded |
| Sugerowane leady | ['Marta Wiśniewska', 'Kamil Nowak', 'Joanna Kowalczyk'] — hardcoded |
| P&L chart | 7 miesięcy: Lis-Maj, rosnące przychody — hardcoded |

**Demo to w 100% atrapa — żadne zapytanie do Supabase nie jest wykonywane.**

### Tryb RZECZYWISTY (adrian / maciek / handlowiec)

| Moduł | Źródło danych | Stan |
|---|---|---|
| Dashboard KPI — Leady/mies. | `leads.count ≥ created_at(monthStart)` | REAL, DB pusta (0 wierszy) |
| Dashboard KPI — Aktywne deale | `deals.count NOT IN wygrana/przegrana/nie_teraz` | REAL, DB pusta |
| Dashboard KPI — Reply rate | Hardcoded `'—'` | **ATRAPA** — brak implementacji |
| Dashboard KPI — Przychód mies. | `deals.value WHERE stage=wygrana AND won_at≥monthStart` | REAL, DB pusta |
| Dashboard ROI — Godziny zaoszcz. | Formuła: (wiad×12min + oferty×45min + scoring×5min)/60 | REAL (obliczane z DB) |
| Dashboard Cel miesięczny | `goalRevenue = 0` dla real users → pasek zawsze 0% | **ATRAPA/DZIURA** |
| Analytics | deals + leads z Supabase | REAL, DB pusta |
| Pipeline | deals z Supabase | REAL, DB pusta |
| Leady | leads z Supabase | REAL, DB pusta |
| Outreach | leads + outreach_messages | REAL |
| Finanse (przychody/koszty) | `app_income` + `app_expenses` | **ATRAPA — TABELE NIE ISTNIEJĄ W DB** |
| Knowledge Base | `company_profile` | REAL, DB pusta |
| Company Brain | `context_files` + `context_chunks` + `company_dna` | REAL, DB puste |
| Tasks | `tasks` (3 wiersze w DB) | REAL — działa |
| Notifications | `notifications` | REAL, DB pusta |
| My Stats | `deals` + `outreach_messages` | REAL |

### Krytyczne dziury — ATRAPY w trybie rzeczywistym

1. **Finanse — ZEPSUTE:** Strona `/finance` odpytuje `app_income` i `app_expenses`.
   Te tabele **NIE ISTNIEJĄ** w bazie. W DB są tabele `income` i `expenses` o innym schemacie.
   Efekt: finanse w trybie rzeczywistym zawsze pokazują puste listy, bez błędu.

2. **Reply Rate — brak danych:** Metryka na dashboardzie zawsze wyświetla `'—'`.
   Brak tabeli ani pola śledzącego odpowiedzi na outreach.

3. **Cel miesięczny — zepsuty:** Pasek postępu zawsze 0% bo `goalRevenue = 0`.
   Brak miejsca do ustawienia celu dla real users.

4. **Portal `/portal`:** Domyślna oferta to hardcoded "Klinika Optima" — jest to tylko podgląd.

---

## 3. SCHEMAT SUPABASE

**Projekt:** `system-h14` (zxgnoemuvsslkaumrrpn, eu-central-1, PostgreSQL 17)

### Tabele — kluczowe kolumny i relacje

#### SPRZEDAŻ

**`leads`** (0 wierszy, RLS: wł.)
```
id, created_at, first_name, last_name, email, company, position,
linkedin_url, company_website, industry, buying_signal, segment,
source (default: 'sales_navigator'), phone, city, instagram_url,
last_contact, scan_data, outreach_history (jsonb),
ai_score (1-10), ai_score_num (0-100), ai_score_label (hot/warm/cold),
ai_icp_score (0-25), ai_signals_score (0-25), ai_activity_score (0-25), ai_potential_score (0-25),
ai_problem, ai_icebreaker, ai_reasoning, ai_scored_at,
app_status (nowy/kontakt/zainteresowany/pipeline/nieaktywny),
status (new/qualified/disqualified/archived), priority (low/standard/high/critical),
assigned_to (text), service_ids (text[]), tags (text[]), notes
```

**`deals`** (0 wierszy, RLS: wł.)
```
id, lead_id → leads.id, stage (10 etapów), stage_changed_at,
title, value, currency (PLN), project_type, expected_close_date,
diagnosis_notes, client_problem, suggested_solution, suggested_price_min/max,
offer_sent_at, offer_opened_at, offer_open_count, offer_pdf_url,
won_at, lost_at, lost_reason, lost_details,
reengagement_date, nurturing_status,
heat_score (0-100), is_hot, hot_reason, engagement_score (0-100),
user_id (text), assigned_to (text), service_ids (text[]), notes
```

Etapy: `nowy_lead → dm_wyslany → odpowiedz → rozmowa_umowiona → diagnoza_zrobiona → oferta_prezentowana → negocjacje → wygrana/przegrana/nie_teraz`

**`outreach_messages`** (0 wierszy, RLS: wł.)
```
id, deal_id → deals.id, lead_id → leads.id,
message_type (connection_request/dm1_icebreaker/fu1_case_study/fu2_calendar/...),
message_content, message_variant, status (draft/sent/replied_positive/...),
sent_at, replied_at, scheduled_for
```

**`meetings`** (0 wierszy, RLS: wł.)
```
id, lead_id → leads.id, deal_id → deals.id,
title, scheduled_at, duration_min (30), status, notes, assigned_to
```

#### OFERTY (śledzenie behawioralne)

**`offer_pages`** (0 wierszy, RLS: wł.)
```
id, deal_id → deals.id, public_slug (unique),
company_name, project_type, solution_description,
daily/monthly/yearly_loss_amount, roi_months,
pricing_variants (jsonb), timeline (jsonb), scope_items (jsonb),
view_count, last_viewed_at, sections_viewed (jsonb),
accepted_at, accepted_variant, is_active
```

**`offer_page_views`** (0 wierszy, RLS: wł.)
```
id, offer_page_id → offer_pages.id, ip_address, user_agent,
duration_seconds, sections_viewed (text[]), slider_interactions,
roi_calculator_used, pricing_variant_viewed
```

**`offer_tracking_events`** (0 wierszy, RLS: wł.)
```
id, deal_id → deals.id, offer_page_id → offer_pages.id,
event_type, data (jsonb)
```

#### FINANSE

**`income`** (0 wierszy, RLS: wł.) — STARY schemat, nieużywany przez UI
```
id, deal_id → deals.id, client_name, project_name, amount, currency,
payment_type (zaliczka/rata/platnosc_koncowa/jednorazowa/abonament),
status (oczekujaca/oplacona/czesciowa/zalegla/anulowana),
invoice_number, invoice_date, due_date, paid_date, paid_amount, project_type, notes
```

**`expenses`** (0 wierszy, RLS: wł.) — STARY schemat, nieużywany przez UI
```
id, amount, currency, description,
category (podatki/ksiegowosc/narzedzia/hosting/marketing/licencje/sprzet/biuro/podroze/szkolenia/inne),
is_recurring, recurring_frequency, expense_date, notes
```

> **UWAGA:** UI `/finance` używa tabel `app_income` i `app_expenses` — te tabele NIE ISTNIEJĄ.
> Tabele `income` i `expenses` mają inny schemat i nie są odpytywane przez stronę Finanse.

#### TREŚCI

**`content_calendar`** (0 wierszy, RLS: wł.)
```
id, scheduled_date, scheduled_time, channel (instagram/linkedin_company/...),
content_type (carousel/single_post/reel_script/story/linkedin_post/article/newsletter),
title, content_body, hook, cta, hashtags, media_urls,
status (idea/draft/ready/scheduled/published/archived),
likes, comments, shares, reach, link_clicks,
topic_category, target_segment, repurposed_from → content_calendar.id, notes
```

**`content_templates`** (10 wierszy, RLS: wł.)
```
id, name, template_type (carousel_slide/linkedin_post/instagram_caption/hook/cta/...),
content, variables (text[]), category, performance_score, times_used, is_active
```

#### CONTENT STUDIO (dla klientów agencji)

**`cs_clients`** (0 wierszy, RLS: wł.) — klienci agencji
**`cs_posts`** (0 wierszy, RLS: wł.) — posty klientów
**`cs_brand_voices`** (0 wierszy, RLS: wł.) — głos marki
**`cs_photos`** (0 wierszy, RLS: wł.) — biblioteka zdjęć
**`cs_calendar_slots`** (0 wierszy, RLS: wł.) — sloty kalendarza
**`cs_onboarding_sessions`** (0 wierszy, RLS: wł.) — onboarding klientów

#### AI / WIEDZA

**`company_profile`** (0 wierszy, RLS: wł.) — profil firmy z formularza Knowledge Base
```
id, company_name, tagline, description, problems_solved, usp,
target_client, icp_industry, icp_company_size, icp_role,
services (jsonb), website_url, linkedin_company_url, linkedin_personal_url,
instagram_url, facebook_url, other_links, tone_of_voice, case_studies, objections
```

**`company_dna`** (0 wierszy, RLS: wł.) — DNA firmy z AI-wywiadu
```
id, company_name, company_tagline, company_description, founded_year, team_size, location,
services (jsonb), core_usp, secondary_usps, price_range_min/max, avg_ticket,
icp_description, icp_company_size, icp_revenue_min, icp_industry (text[]), icp_decision_maker,
icp_pain_points, icp_goals, icp_buying_triggers, icp_red_flags,
sales_process (jsonb), avg_sales_cycle_days, close_rate_percent, avg_followups_to_close,
top_objections (jsonb), competitive_advantages, main_competitors (jsonb),
content_archetype, content_tone, content_vocabulary, content_avoid, content_pillars,
posting_channels, posting_frequency, case_studies (jsonb), testimonials (jsonb),
founder_voice, dna_score (0-100), last_updated_by
```

**`context_files`** (0 wierszy, RLS: wł.) — pliki uploaded do Company Brain
```
id, original_name, filename, file_type, category, description, priority,
tags (text[]), raw_text, file_size_bytes,
processing_status (pending/processing/done/error), processing_error,
chunks_count, processed_at, summary, key_facts, is_active
```

**`context_chunks`** (0 wierszy, RLS: wł.) — chunki plików (dla RAG)
```
id, file_id → context_files.id, category, content, content_summary,
chunk_index, chunk_total, embedding (text — nie vector!), priority
```

> **UWAGA:** `embedding` to kolumna `text`, nie `vector`. Brak pgvector.
> Wyszukiwanie semantyczne prawdopodobnie działa przez pełnotekstowe lub klucz-wartość, nie przez cosine similarity.

**`ai_context_usage`** (0 wierszy, RLS: wł.) — logi użycia AI
```
id, feature, user_id, tokens_used, model, context (jsonb)
```

#### POZOSTAŁE

**`tasks`** (3 wiersze, RLS: wł.)
```
id, title, description, due_date, priority (low/medium/high),
assigned_to (text), user_id (text), completed, completed_at
```

**`notifications`** (0 wierszy, RLS: wł.)
```
id, user_id (text), deal_id → deals.id, lead_id → leads.id,
type, title, body, priority (normal/high/urgent), is_read
```

**`services`** (0 wierszy, RLS: wł.) — usługi firmy (cennik)
**`user_profiles`** (3 wiersze, RLS: wł.) — id (text), name, full_name, company
**`meetings`** — patrz wyżej
**`calendar_events`** (0 wierszy) — title, start_date, end_date, type, user_id
**`configurator_leads`** (0 wierszy) — leady z publicznego konfiguratora

**Tabele konfiguracyjne (RLS WYŁĄCZONE — patrz sekcja bezpieczeństwa):**
- **`pipeline_config`** (10 wierszy) — stage_key, stage_name, stage_order, stage_color
- **`segments_config`** (8 wierszy) — segment_key, segment_name, industry_filter, signals[]

---

## 4. DASHBOARD — Zapytania i metryki

### KPI Grid (4 karty)

| Karta | Zapytanie Supabase | Demo |
|---|---|---|
| Leady / miesiąc | `leads.count(head:true).gte('created_at', monthStart)` | `DEMO_KPI.leadsThisMonth = 24` |
| Aktywne deale | `deals.count(head:true).not('stage', in, 'wygrana/przegrana/nie_teraz')` | `DEMO_KPI.activeDeals = 11` |
| Reply rate | **Hardcoded `'—'`** — brak danych w DB | `DEMO_KPI.replyRate = '34%'` |
| Przychód miesiąc | `deals.select('value').eq('stage','wygrana').gte('won_at', monthStart)` → suma | `DEMO_KPI.revenueThisMonth = 18 900 PLN` |

### "Co H14 zrobiło za Ciebie" (ROI Counter)

4 pod-metryki (tylko dla non-null, wyświetla się warunkowo):

| Metryka | Zapytanie | Opis |
|---|---|---|
| Godziny zaoszczędzone | Obliczane: `(msgs×12 + offers×45 + scored×5)/60` | Formuła szacunkowa |
| Wartość pipeline | `deals.select('value').not('stage', in, ...)` → suma | Aktywne deale |
| Wiadomości wysłane | `outreach_messages.count(head:true)` | Wszystkie wiadomości |
| Oferty wygenerowane | `deals.count(head:true).not('offer_sent_at', is, null)` | Deale z wysłaną ofertą |

### Cel miesięczny

- **Demo:** `DEMO_KPI.monthlyGoal = 25 000 PLN` — pasek postępu działa
- **Real:** `goalRevenue = 0` → pasek zawsze **0%** — brakuje tabeli/pola z celem

### P&L mini-chart (tylko demo)

Wykres słupkowy 7 miesięcy: `DEMO_PNL` — tylko dla `isDemoMode()`.
Real users nie widzą tego wykresu.

### "Sugerowane leady" (tylko demo)

`DEMO_KPI.suggestedLeads` — 3 hardcoded imiona. Real users nie widzą.

---

## 5. ONBOARDING "Zacznij tutaj"

5 kroków — **statyczne linki, bez śledzenia ukończenia**.

| Krok | Ścieżka | Co robi | Warunek ukończenia | Stan |
|---|---|---|---|---|
| 1. Wypełnij Bazę Wiedzy | `/knowledge-base` | Formularz profilu firmy | `company_profile` ma co najmniej 1 wiersz z `company_name != ''` | Brak checkmarków — nie sprawdzane |
| 2. Dodaj pierwszych leadów | `/leads` | Import CSV lub ręcznie | `leads.count > 0` | Brak checkmarków |
| 3. Uruchom AI Scoring | `/ai-scoring` | Scoring leadów przez OpenAI | `leads` z `ai_scored_at IS NOT NULL` co najmniej 1 | Brak checkmarków |
| 4. Otwórz deal w pipeline | `/pipeline` | Kanban CRM | `deals.count > 0` | Brak checkmarków |
| 5. Wygeneruj treści | `/content-generator` | AI generator postów | Brak persystencji (treści nie są zapisywane do `content_calendar`) | Brak checkmarków |

**Wniosek:** Onboarding to 5 zwykłych linków bez jakiegokolwiek mechanizmu weryfikacji postępu.
Żaden krok nie jest "odhaczany". W `localStorage` jest klucz `am_onboarding_completed` (bool)
ale nie jest on połączony z tymi krokami — to osobny, prosty flag.

Gdybyś chciał dodać weryfikację — zapytania które działają:
- Krok 1: `SELECT COUNT(*) FROM company_profile WHERE company_name != ''`
- Krok 2: `SELECT COUNT(*) FROM leads`
- Krok 3: `SELECT COUNT(*) FROM leads WHERE ai_scored_at IS NOT NULL`
- Krok 4: `SELECT COUNT(*) FROM deals`
- Krok 5: Do weryfikacji — generator treści nie zapisuje do DB

---

## 6. KONTA / MULTI-TENANT

### System autentykacji

**NIE ma Supabase Auth.** Używa `localStorage`:
```
localStorage.getItem('am_current_user') → 'adrian' | 'maciek' | 'handlowiec' | 'demo'
```

Konta zakodowane na stałe w `src/lib/userStore.ts`:

| ID | Rola | Hasło | Uwagi |
|---|---|---|---|
| `adrian` | admin | brak (bez hasła) | Właściciel |
| `maciek` | admin | brak (bez hasła) | Współwłaściciel |
| `handlowiec` | sales | `Seba` | Ograniczony dostęp |
| `demo` | admin | `Zyś` | Tryb demo — tylko mock data |

### Separacja danych (RLS)

**Wszystkie tabele mają politykę `"Full access"` z `qual = true`.**

Oznacza to: każdy klient (anon lub authenticated) **widzi i może modyfikować WSZYSTKIE wiersze** w każdej tabeli.

| Tabela | Scoping | Faktyczna izolacja |
|---|---|---|
| `tasks` | `assigned_to` (text) | Częściowa — aplikacja filtruje po assigned_to, ale DB nie wymusza |
| `notifications` | `user_id` (text) | Częściowa — j.w. |
| `leads` | `assigned_to` (text) | Brak — aplikacja nie filtruje per user |
| `deals` | `assigned_to`, `user_id` | Brak — aplikacja nie filtruje per user |
| Wszystkie inne | brak | Brak — dane współdzielone globalnie |

**Wniosek:** To jest system single-tenant. Adrian i Maciek widzą te same dane.
Demo account zamiast tego używa mock data, więc nie "widzi" prawdziwych danych.

---

## 7. INTEGRACJE — Zmienne .env

Z pliku `.env.example`:

| Zmienna | Usługa | Używana do |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Baza danych (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Klucz publiczny (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Admin operacje w API routes / cron |
| `OPENAI_API_KEY` | OpenAI | AI scoring, generator treści, analiza faktury, outreach, Company Brain |
| `TELEGRAM_BOT_TOKEN` | Telegram | Bot do wysyłki powiadomień |
| `TELEGRAM_CHAT_ADMIN` | Telegram | Chat ID dla Adriana + Maćka |
| `TELEGRAM_CHAT_SALES` | Telegram | Chat ID dla handlowca |
| `CRON_SECRET` | Vercel Cron | Autoryzacja endpointów cron (`Authorization: Bearer`) |
| `CALENDLY_WEBHOOK_SECRET` | Calendly | Weryfikacja webhooków spotkań |
| `NEXT_PUBLIC_APP_URL` | — | Własny URL aplikacji |
| `NEXT_PUBLIC_CAL_URL` | Calendly | Publiczny link do kalendarza |
| `NEXT_PUBLIC_LOOM_URL` | Loom | Link do video demo |

Dodatkowo (z kodu, nie z `.env.example`):
| Zmienna | Usługa | Plik |
|---|---|---|
| `CLOUDINARY_*` (do weryfikacji) | Cloudinary | `src/lib/content-studio/cloudinary.ts` — przechowywanie zdjęć klientów |

---

## 8. BEZPIECZENSTWO — Krytyczne uwagi

### KRYTYCZNE: RLS wyłączone na 2 tabelach

Tabele `pipeline_config` i `segments_config` mają **wyłączone Row Level Security**.
Każdy, kto zna `NEXT_PUBLIC_SUPABASE_ANON_KEY` (jest publiczny w przeglądarce), może:
- Odczytać całą konfigurację etapów i segmentów
- Modyfikować lub usunąć konfigurację

Remediation SQL (uruchomić ręcznie, po dodaniu odpowiednich polityk):
```sql
ALTER TABLE public.pipeline_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments_config ENABLE ROW LEVEL SECURITY;
```
> Włączenie RLS bez polityk **zablokuje wszystkie zapytania** — najpierw dodaj READ policy.

### Polityki RLS — faktycznie nie filtrują

Wszystkie tabele z RLS mają politykę `qual = true` co oznacza "wszyscy widzą wszystko".
RLS jest formalnie włączone ale nie robi faktycznej izolacji.

---

## 9. PODSUMOWANIE — Co działa, co jest atrapą, gdzie dziury

### CO DZIAŁA (realne dane z Supabase)
- Leady — CRUD, import CSV, AI scoring przez OpenAI
- Pipeline CRM — kanban, zmiana etapów, szczegóły deala
- Outreach — generator wiadomości AI, zapis do outreach_messages
- Analytics — wykresy pipeline, lead scoring, velocity, win/loss
- Tasks — lista zadań Adriana i Maćka z persystencją
- Notifications — powiadomienia z crona i behavioral tracking ofert
- Company Brain — upload plików, chunking, DNA firmy
- Knowledge Base — profil firmy dla AI
- Offer pages — interaktywne oferty z behavioral tracking (view_count, sections_viewed)
- Content Studio — zarządzanie treściami dla klientów agencji
- Cron jobs — 9 zaplanowanych zadań (Vercel Hobby: raz dziennie)

### CO JEST ATRAPĄ / ZEPSUTE
- **Finanse (real mode)** — tabele `app_income`/`app_expenses` nie istnieją → zawsze puste
- **Reply rate** — hardcoded `'—'` dla real users, brak danych w DB
- **Cel miesięczny** — zawsze 0%, brak pola do ustawienia celu
- **P&L chart** — tylko w trybie demo
- **Sugerowane leady** — tylko w trybie demo
- **settings** — redirect('/')
- **sales** — redirect('/')
- **finance/income** — redirect('/')
- **finance/expenses** — redirect('/')

### GŁÓWNE DZIURY
1. **Finanse** — przepisać żeby używało tabel `income`/`expenses` LUB stworzyć `app_income`/`app_expenses`
2. **Reply rate** — potrzebne pole `replied_at` lub licznik w `outreach_messages` + agregacja
3. **Cel miesięczny** — potrzebna tabela `goals` lub pole w `user_profiles`
4. **RLS** — polityki `qual=true` = brak izolacji między użytkownikami
5. **Embedding** — `context_chunks.embedding` to `text`, nie `vector` → brak semantycznego wyszukiwania
6. **Onboarding** — 5 kroków bez weryfikacji ukończenia
7. **DB pusta** — 0 wierszy w kluczowych tabelach (leads, deals, income, etc.) — brak seedów

---

*Koniec audytu. Wygenerowano automatycznie na podstawie odczytu kodu i zapytań do Supabase MCP.*
