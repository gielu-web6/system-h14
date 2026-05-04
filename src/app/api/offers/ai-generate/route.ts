import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface PricingVariantInput {
  name: string
  price: number
}

const SYSTEM_PROMPT = `Jesteś asystentem AM Automations przygotowującym treści ofert handlowych.
Twoje jedyne zadanie to sformatować podane dane wejściowe do struktury JSON.

KRYTYCZNE ZASADY — NIGDY NIE ŁAMAĆ:
1. Generuj zakres usług (scope_items) WYŁĄCZNIE na podstawie listy "selected_services". Żadnych dodatkowych usług.
2. NIE DODAWAJ żadnych usług AM Automations (Company Brain, HANA, System H14, AI Recepcjonistka itp.) jeśli nie są w "selected_services".
3. NIE wymyślaj wariantów cenowych — opisz TYLKO warianty podane w "pricing_variants". Ich nazwy i ceny są NIEZMIENNE.
4. NIE generuj kwot zaliczek ani harmonogramów płatności.
5. Harmonogram (timeline_items) generuj TYLKO gdy podano "project_start_date". W przeciwnym razie wpisz pusty JSON array [].
6. Pisz po polsku, w tonie profesjonalnym i bezpośrednim. Bez lania wody i korporacyjnych frazesów.
7. Odpowiedz WYŁĄCZNIE poprawnym JSON-em, bez żadnego tekstu przed ani po.`

function buildPrompt(
  clientName: string,
  projectType: string,
  clientProblem: string,
  selectedServices: string[],
  pricingVariants: PricingVariantInput[],
  projectStartDate: string | null,
  additionalNotes: string | null,
  companyDna: Record<string, unknown> | null,
): string {
  const servicesText = selectedServices.map((s) => `- ${s}`).join('\n')
  const variantsText = pricingVariants.map((v) => `{ "name": "${v.name}", "price": ${v.price} }`).join(', ')
  const dnaHint = companyDna?.core_usp ? `\nUSP firmy: ${companyDna.core_usp}` : ''

  return `Klient: ${clientName}
Typ projektu: ${projectType}

Opis problemu klienta (zapisany przez handlowca po rozmowie):
${clientProblem}

Usługi w zakresie (TYLKO te można użyć w scope_items):
${servicesText}

Warianty cenowe (TYLKO te opisz, ceny są NIEZMIENNE):
[${variantsText}]

Data startu projektu: ${projectStartDate ?? 'nie podano'}
Dodatkowe uwagi: ${additionalNotes ?? 'brak'}${dnaHint}

Zwróć WYŁĄCZNIE JSON w tej strukturze:
{
  "diagnoza_bolu": "2-3 zdania opisujące problem klienta na podstawie podanego opisu. Konkretnie, bez ogólników.",
  "solution_description": "2-3 zdania opisujące co wdrożymy i jak rozwiąże to problem klienta.",
  "scope_items": [
    { "text": "Opis elementu zakresu bazujący na wybranej usłudze", "included": true }
  ],
  "timeline_items": [],
  "pricing_variant_features": {
    "NazwaWariantu": ["Feature 1", "Feature 2", "Feature 3"]
  },
  "objekcje": [
    { "zarzut": "Potencjalna obiekcja klienta", "odpowiedz": "Gotowa odpowiedź handlowca" }
  ]
}

UWAGI:
- scope_items: od 4 do 8 pozycji, wyłącznie na podstawie wymienionych usług
- timeline_items: wypełnij TYLKO gdy project_start_date != "nie podano". Format: [{"week": "Tydzień 1–2", "name": "...", "description": "...", "date_start": "YYYY-MM-DD", "date_end": "YYYY-MM-DD"}]
- pricing_variant_features: dla KAŻDEGO wariantu z listy pricing_variants podaj tablicę 3-6 konkretnych cech/elementów
- objekcje: 3–5 najczęstszych obiekcji dopasowanych do tej branży/projektu`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      client_name: string
      project_type: string
      client_problem: string
      selected_services: string[]
      pricing_variants: PricingVariantInput[]
      project_start_date?: string | null
      additional_notes?: string | null
      // legacy fields (backward compat)
      meeting_notes?: string
      modules?: Array<{ id: string; label: string; price: number; desc: string }>
      total_price?: number
    }

    const {
      client_name,
      project_type,
      client_problem,
      selected_services,
      pricing_variants,
      project_start_date = null,
      additional_notes = null,
    } = body

    // Backward compat: if old-style call, adapt
    const effectiveProblem = client_problem || body.meeting_notes || ''
    const effectiveServices = selected_services?.length
      ? selected_services
      : (body.modules ?? []).map((m) => `${m.label}${m.desc ? ` — ${m.desc}` : ''}`)
    const effectiveVariants: PricingVariantInput[] = pricing_variants?.length
      ? pricing_variants
      : body.modules?.length
        ? [{ name: 'Kompletny', price: body.total_price ?? 0 }]
        : []

    if (!effectiveProblem.trim()) {
      return NextResponse.json({ error: 'Opis problemu klienta jest wymagany' }, { status: 400 })
    }
    if (!effectiveServices.length) {
      return NextResponse.json({ error: 'Wybierz co najmniej jedną usługę' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: dna } = await supabase
      .from('company_dna')
      .select('core_usp,company_description')
      .limit(1)
      .maybeSingle()

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildPrompt(
            client_name || 'Klient',
            project_type || 'Projekt',
            effectiveProblem,
            effectiveServices,
            effectiveVariants,
            project_start_date,
            additional_notes,
            dna as Record<string, unknown> | null,
          ),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.25,
      max_tokens: 2500,
    })

    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      diagnoza_bolu?: string
      solution_description?: string
      scope_items?: Array<{ text: string; included: boolean }>
      timeline_items?: Array<{ week: string; name: string; description: string; date_start?: string; date_end?: string }>
      pricing_variant_features?: Record<string, string[]>
      objekcje?: Array<{ zarzut: string; odpowiedz: string }>
    }

    // Merge AI-generated features into the input pricing variants
    const mergedVariants = effectiveVariants.map((v) => ({
      name: v.name,
      price: v.price,
      features: raw.pricing_variant_features?.[v.name] ?? [],
      description: '',
      is_recommended: false,
    }))
    if (mergedVariants.length > 0) {
      mergedVariants[mergedVariants.length - 1].is_recommended = true
    }

    const result = {
      diagnoza_bolu: raw.diagnoza_bolu ?? '',
      solution_description: raw.solution_description ?? '',
      scope_items: raw.scope_items ?? [],
      timeline_items: raw.timeline_items ?? [],
      objekcje: raw.objekcje ?? [],
      pricing_variants: mergedVariants,
      // Legacy fields set to 0 so public page skips loss section
      daily_loss_amount: 0,
      monthly_loss_amount: 0,
      yearly_loss_amount: 0,
      roi_months: null,
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('[ai-generate-offer]', err)
    return NextResponse.json({ error: 'Błąd generowania treści AI' }, { status: 500 })
  }
}
