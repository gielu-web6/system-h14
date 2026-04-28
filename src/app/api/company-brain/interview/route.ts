import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { mergeDNAUpdates } from '@/app/api/company-brain/files/[id]/process/route'

// ─── Field → question mapping ─────────────────────────────────────────────────

const FIELD_QUESTIONS: Array<{
  field: string
  question: string
  hint: string
  category: string
}> = [
  { field: 'company_name',         question: 'Jaka jest nazwa Twojej firmy?',                                              hint: 'np. AM Automations',                                     category: 'Podstawy' },
  { field: 'company_tagline',      question: 'Jaki jest tagline/slogan Twojej firmy?',                                     hint: 'np. Automatyzujemy sprzedaż B2B',                        category: 'Podstawy' },
  { field: 'company_description',  question: 'Opisz swoją firmę w 2–3 zdaniach',                                          hint: 'Co robisz, dla kogo i dlaczego?',                        category: 'Podstawy' },
  { field: 'core_usp',             question: 'Co wyróżnia Twoją firmę od konkurencji? (główny USP)',                       hint: 'np. Prototyp pokazujemy zanim klient zapłaci',           category: 'Podstawy' },
  { field: 'services',             question: 'Jakie usługi oferujesz i w jakim przedziale cenowym?',                       hint: 'Opisz każdą usługę, zakres cen i czas realizacji',       category: 'Oferta' },
  { field: 'price_range_min',      question: 'Jaka jest minimalna wartość projektu z jakim pracujesz (PLN)?',             hint: 'np. 5000',                                               category: 'Oferta' },
  { field: 'deal_below_which_skip',question: 'Poniżej jakiej kwoty nie rozmawiasz z klientem (PLN)?',                     hint: 'np. 3000',                                               category: 'Oferta' },
  { field: 'icp_description',      question: 'Opisz swojego idealnego klienta — kim jest, co robi, czego szuka?',         hint: 'CEO agencji 2–10 osób, aktywny na LinkedIn...',          category: 'ICP' },
  { field: 'icp_pain_points',      question: 'Jakie są główne bóle/problemy Twoich klientów?',                            hint: 'Każdy ból w osobnym zdaniu',                             category: 'ICP' },
  { field: 'icp_goals',            question: 'Jakie cele chcą osiągnąć Twoi klienci?',                                    hint: 'np. skalować sprzedaż bez powiększania zespołu',         category: 'ICP' },
  { field: 'icp_red_flags',        question: 'Kogo NIE chcesz jako klienta? (red flags)',                                 hint: 'np. firmy poniżej 500k PLN przychodu',                  category: 'ICP' },
  { field: 'icp_buying_triggers',  question: 'Jakie sygnały/triggery oznaczają, że ktoś jest gotowy do zakupu?',          hint: 'np. nowy CEO, utrata klientów, świeże finansowanie',     category: 'ICP' },
  { field: 'top_objections',       question: 'Jakie objekcje najczęściej słyszysz i jak na nie odpowiadasz?',             hint: '"Za drogo" → "Zacznijmy od prototypu..."',               category: 'Sprzedaż' },
  { field: 'competitive_advantages',question: 'Jakie masz przewagi nad konkurencją?',                                     hint: 'Co potrafisz co konkurenci nie?',                        category: 'Sprzedaż' },
  { field: 'avg_sales_cycle_days', question: 'Ile dni trwa średnio Twój cykl sprzedaży (od pierwszego kontaktu do umowy)?', hint: 'np. 21 dni',                                          category: 'Sprzedaż' },
  { field: 'close_rate_percent',   question: 'Jaki % leadów zamienia się w klientów?',                                    hint: 'np. 25%',                                                category: 'Sprzedaż' },
  { field: 'case_studies',         question: 'Opisz 1–3 case studies: klient, problem, rozwiązanie, wynik',               hint: 'Z konkretnymi liczbami i timeframe',                     category: 'Dowody' },
  { field: 'content_tone',         question: 'Jak piszesz do klientów? Opisz ton komunikacji',                            hint: 'np. bezpośredni, merytoryczny, bez korporacyjnego żargonu', category: 'Content' },
  { field: 'content_pillars',      question: 'Jakie są Twoje główne tematy/filary contentu?',                             hint: 'np. automatyzacja, sprzedaż B2B, case studies',          category: 'Content' },
  { field: 'content_archetype',    question: 'Jaki jest archetyp komunikacji Twojej marki?',                              hint: 'Ekspert / Prowokator / Budowniczy / Edukator / Innowator', category: 'Content' },
  { field: 'founder_voice',        question: 'Jak brzmi głos foundera w contencie? Co charakteryzuje Twój styl pisania?', hint: 'np. Piszę jak praktyk który sam to przerobił...',        category: 'Content' },
  { field: 'main_competitors',     question: 'Kto jest Twoją główną konkurencją? Jak wygrywasz z nimi?',                  hint: 'Nazwa, ich słabość, jak Ty to robisz lepiej',            category: 'Rynek' },
]

// ─── Check if DNA field is empty ─────────────────────────────────────────────

function isFieldEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return value === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

// ─── GET: return questions for empty DNA fields ───────────────────────────────

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data: dna } = await supabase.from('company_dna').select('*').limit(1).maybeSingle()
    const { data: files } = await supabase
      .from('context_files')
      .select('category, processing_status')
      .eq('is_active', true)

    const fileCategories = new Set((files ?? []).map(f => f.category))
    const processedCategories = new Set(
      (files ?? []).filter(f => f.processing_status === 'done').map(f => f.category)
    )

    const dnaRecord = (dna ?? {}) as Record<string, unknown>

    const questions = FIELD_QUESTIONS
      .filter(({ field }) => isFieldEmpty(dnaRecord[field]))
      .map(q => ({
        ...q,
        has_related_file: fileCategories.size > 0,
        was_attempted: processedCategories.size > 0,
      }))

    return NextResponse.json({
      questions,
      total_empty: questions.length,
      dna_exists: !!dna,
      files_count: files?.length ?? 0,
    })
  } catch (err) {
    console.error('GET /api/company-brain/interview error:', err)
    return NextResponse.json({ error: 'Błąd pobierania pytań' }, { status: 500 })
  }
}

// ─── POST: answer a question → update DNA ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { field, question, answer } = await req.json()

    if (!field || !answer?.trim()) {
      return NextResponse.json({ error: 'Brak pola lub odpowiedzi' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: existing } = await supabase.from('company_dna').select('*').limit(1).maybeSingle()

    // Use AI to parse the natural language answer into correct DNA field structure
    const parseRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Użytkownik odpowiedział na pytanie dotyczące profilu firmy.

Pytanie: "${question}"
Pole DNA: "${field}"
Odpowiedź użytkownika: "${answer}"

Przekształć odpowiedź w poprawną strukturę JSON dla pola "${field}".
Zwróć JSON w formacie: {"${field}": <wartość>}

Zasady:
- Dla pól tekstowych (company_name, company_description, core_usp, icp_description, content_tone, founder_voice, content_archetype): zwróć string
- Dla list stringów (icp_pain_points, icp_goals, icp_red_flags, icp_buying_triggers, competitive_advantages, content_pillars): zwróć string[]
- Dla liczb (price_range_min, deal_below_which_skip, avg_sales_cycle_days, close_rate_percent): zwróć number
- Dla services: zwróć [{name, description, price_range, delivery_time, usp}]
- Dla top_objections: zwróć [{objection, best_response, frequency: "high"|"medium"|"low"}]
- Dla case_studies: zwróć [{client_industry, problem, solution, result, timeframe, can_mention: true}]
- Dla main_competitors: zwróć [{name, weakness, how_we_win}]`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const parsed = JSON.parse(parseRes.choices[0].message.content ?? '{}') as Record<string, unknown>
    const updates = mergeDNAUpdates(parsed, existing as Record<string, unknown> | null)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'Brak zmian do zapisania' })
    }

    if (existing?.id) {
      const { error } = await supabase.from('company_dna').update(updates).eq('id', existing.id as string)
      if (error) throw error
    } else {
      const { error } = await supabase.from('company_dna').insert(updates)
      if (error) throw error
    }

    return NextResponse.json({ success: true, updated_fields: Object.keys(updates) })
  } catch (err) {
    console.error('POST /api/company-brain/interview error:', err)
    return NextResponse.json({ error: 'Błąd zapisu odpowiedzi' }, { status: 500 })
  }
}
