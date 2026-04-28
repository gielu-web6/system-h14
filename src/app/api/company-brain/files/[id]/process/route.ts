import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { chunkAndEmbed } from '@/lib/company-brain/chunker'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: fileId } = await params
  const supabase = getSupabaseAdmin()

  const { data: file, error: fileError } = await supabase
    .from('context_files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (fileError || !file) {
    return NextResponse.json({ error: 'Nie znaleziono pliku' }, { status: 404 })
  }

  if (!file.raw_text?.trim()) {
    return NextResponse.json({ error: 'Plik nie ma treści do przetworzenia' }, { status: 400 })
  }

  await supabase.from('context_files').update({ processing_status: 'processing' }).eq('id', fileId)

  try {
    await supabase.from('context_chunks').delete().eq('file_id', fileId)

    const summaryRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Przeanalizuj ten dokument firmowy i wyciągnij:
1. Krótkie podsumowanie (2-3 zdania)
2. 5-10 kluczowych faktów/informacji

Dokument:
${file.raw_text.slice(0, 3000)}

Odpowiedz jako JSON: {"summary": "...", "key_facts": ["...", "..."]}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const { summary, key_facts } = JSON.parse(summaryRes.choices[0].message.content ?? '{}')

    const chunksCount = await chunkAndEmbed(fileId, file.raw_text, file.category, file.priority ?? 1)

    await supabase.from('context_files').update({
      processing_status: 'done',
      summary: summary ?? null,
      key_facts: key_facts ?? [],
      chunks_count: chunksCount,
      processed_at: new Date().toISOString(),
    }).eq('id', fileId)

    await updateDNAFromFile(file.raw_text, file.category)

    return NextResponse.json({ success: true, chunks: chunksCount })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Nieznany błąd'
    await supabase.from('context_files').update({
      processing_status: 'failed',
      processing_error: msg,
    }).eq('id', fileId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── Universal DNA extraction — works regardless of file category ─────────────
// One prompt extracts all possible fields. Category is used as a hint only.

const UNIVERSAL_PROMPT = `Jesteś asystentem który wyciąga informacje z dokumentów firmowych.
Przeanalizuj poniższy dokument i wyciągnij WSZYSTKIE informacje które pasują do poniższych pól profilu firmy.
WAŻNE: wyciągaj TYLKO to co faktycznie jest w tekście — nie wymyślaj. Dla pól których nie ma w dokumencie zwróć null.

Zwróć JSON z TYLKO tymi polami które znalazłeś (resztę pomiń lub ustaw null):
{
  "company_name": string|null,
  "company_tagline": string|null,
  "company_description": string|null,
  "founded_year": number|null,
  "team_size": string|null,
  "location": string|null,
  "core_usp": string|null,
  "secondary_usps": string[]|null,
  "competitive_advantages": string[]|null,
  "brand_words": string[]|null,
  "brand_avoid_words": string[]|null,
  "founder_voice": string|null,
  "services": [{"name": string, "description": string, "price_range": string, "delivery_time": string, "usp": string}]|null,
  "price_range_min": number|null,
  "price_range_max": number|null,
  "avg_ticket": number|null,
  "deal_below_which_skip": number|null,
  "icp_description": string|null,
  "icp_company_size": string|null,
  "icp_revenue_min": number|null,
  "icp_industry": string[]|null,
  "icp_decision_maker": string|null,
  "icp_pain_points": string[]|null,
  "icp_goals": string[]|null,
  "icp_buying_triggers": string[]|null,
  "icp_red_flags": string[]|null,
  "avg_sales_cycle_days": number|null,
  "close_rate_percent": number|null,
  "avg_followups_to_close": number|null,
  "top_objections": [{"objection": string, "best_response": string, "frequency": "high"|"medium"|"low"}]|null,
  "sales_process": [{"step": number, "name": string, "description": string, "avg_days": number}]|null,
  "main_competitors": [{"name": string, "weakness": string, "how_we_win": string}]|null,
  "content_archetype": string|null,
  "content_tone": string|null,
  "content_vocabulary": string[]|null,
  "content_avoid": string[]|null,
  "content_pillars": string[]|null,
  "posting_channels": string[]|null,
  "posting_frequency": string|null,
  "case_studies": [{"client_industry": string, "problem": string, "solution": string, "result": string, "timeframe": string, "can_mention": true}]|null,
  "testimonials": [{"text": string, "author": string, "company": string, "verified": false}]|null,
  "monthly_revenue_target": number|null,
  "monthly_revenue_current": number|null,
  "quarterly_deals_target": number|null,
  "current_clients_count": number|null,
  "target_clients_count": number|null
}`

// ─── Field type helpers for merge strategy ────────────────────────────────────

const ARRAY_OBJECT_FIELDS = new Set([
  'services', 'top_objections', 'sales_process', 'main_competitors', 'case_studies', 'testimonials',
])

const ARRAY_STRING_FIELDS = new Set([
  'secondary_usps', 'competitive_advantages', 'brand_words', 'brand_avoid_words',
  'content_pillars', 'posting_channels', 'content_vocabulary', 'content_avoid',
  'icp_industry', 'icp_pain_points', 'icp_goals', 'icp_buying_triggers', 'icp_red_flags',
])

const NUMBER_FIELDS = new Set([
  'founded_year', 'price_range_min', 'price_range_max', 'avg_ticket', 'deal_below_which_skip',
  'avg_sales_cycle_days', 'close_rate_percent', 'avg_followups_to_close', 'icp_revenue_min',
  'monthly_revenue_target', 'monthly_revenue_current', 'quarterly_deals_target',
  'current_clients_count', 'target_clients_count',
])

// ─── Merge: only fill gaps, never overwrite existing values ───────────────────

export function mergeDNAUpdates(
  extracted: Record<string, unknown>,
  existing: Record<string, unknown> | null,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {}

  for (const [field, value] of Object.entries(extracted)) {
    if (value === null || value === undefined) continue

    const current = existing?.[field]

    if (ARRAY_OBJECT_FIELDS.has(field)) {
      const newItems = Array.isArray(value) ? value : []
      if (newItems.length === 0) continue
      const existingItems = Array.isArray(current) ? current : []
      updates[field] = [...existingItems, ...newItems]
    } else if (ARRAY_STRING_FIELDS.has(field)) {
      const newItems = Array.isArray(value) ? (value as string[]).filter(Boolean) : []
      if (newItems.length === 0) continue
      const existingItems = Array.isArray(current) ? (current as string[]) : []
      const merged = [...existingItems]
      for (const item of newItems) {
        if (!merged.includes(item)) merged.push(item)
      }
      if (merged.length > existingItems.length) updates[field] = merged
    } else if (NUMBER_FIELDS.has(field)) {
      if (current === null || current === undefined || current === 0) {
        updates[field] = value
      }
    } else {
      // Scalar string — fill only if null/empty
      const currentStr = typeof current === 'string' ? current.trim() : ''
      if (!currentStr) {
        updates[field] = value
      }
    }
  }

  return updates
}

// ─── Main: extract all DNA fields from any file ───────────────────────────────

export async function updateDNAFromFile(text: string, _category: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: existing } = await supabase.from('company_dna').select('*').limit(1).maybeSingle()

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `${UNIVERSAL_PROMPT}\n\nDokument:\n${text.slice(0, 5000)}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const extracted = JSON.parse(response.choices[0].message.content ?? '{}') as Record<string, unknown>
    const updates = mergeDNAUpdates(extracted, existing as Record<string, unknown> | null)

    if (Object.keys(updates).length === 0) return

    if (existing?.id) {
      await supabase.from('company_dna').update(updates).eq('id', existing.id as string)
    } else {
      await supabase.from('company_dna').insert(updates)
    }
  } catch (e) {
    console.error('[CompanyBrain] DNA auto-update failed:', e)
  }
}
