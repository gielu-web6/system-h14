import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'

export type FeatureType =
  | 'lead_scoring'
  | 'content_generator'
  | 'offer_generator'
  | 'outreach_generator'
  | 'weekly_brief'
  | 'hana'
  | 'other'

const FEATURE_CATEGORIES: Record<FeatureType, string[]> = {
  lead_scoring:        ['icp_profil', 'strategia_sprzedazy', 'opis_uslug', 'konkurencja'],
  content_generator:   ['strategia_marketingu', 'case_studies', 'icp_profil', 'strategia_firmy'],
  offer_generator:     ['opis_uslug', 'cennik', 'case_studies', 'szablony', 'strategia_sprzedazy'],
  outreach_generator:  ['strategia_sprzedazy', 'icp_profil', 'szablony', 'case_studies'],
  weekly_brief:        ['strategia_sprzedazy', 'strategia_firmy', 'finanse'],
  hana:                ['opis_uslug', 'strategia_sprzedazy', 'icp_profil', 'case_studies', 'cennik'],
  other:               ['strategia_firmy', 'opis_uslug'],
}

const FEATURE_CHUNK_COUNT: Record<FeatureType, number> = {
  lead_scoring:       4,
  content_generator:  6,
  offer_generator:    8,
  outreach_generator: 5,
  weekly_brief:       4,
  hana:               6,
  other:              4,
}

export interface ContextChunk {
  id: string
  content: string
  content_summary: string
  category: string
  priority: number
  similarity: number
}

export interface ContextResult {
  dna: Record<string, unknown> | null
  chunks: ContextChunk[]
  contextString: string
  tokenEstimate: number
}

export async function buildContext(
  feature: FeatureType,
  options: {
    query?: string
    extraCategories?: string[]
    minPriority?: number
    maxTokens?: number
  } = {}
): Promise<ContextResult> {
  const supabase = getSupabaseAdmin()
  const { query, extraCategories = [], minPriority = 1 } = options

  const { data: dna } = await supabase
    .from('company_dna')
    .select('*')
    .limit(1)
    .maybeSingle()

  let chunks: ContextChunk[] = []

  if (query) {
    try {
      const embRes = await getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      })
      const queryEmbedding = embRes.data[0].embedding
      const categories = [...FEATURE_CATEGORIES[feature], ...extraCategories]
      const chunkCount = FEATURE_CHUNK_COUNT[feature]

      const { data: results } = await supabase.rpc('semantic_search', {
        query_embedding: queryEmbedding,
        match_count: chunkCount * 2,
        category_filter: null,
        min_priority: minPriority,
      })

      chunks = ((results as ContextChunk[]) ?? [])
        .filter((r) => categories.includes(r.category))
        .slice(0, chunkCount)
    } catch (e) {
      console.error('[CompanyBrain] semantic search failed:', e)
    }
  }

  const contextString = buildContextString(dna, chunks, feature)
  logContextUsage(feature, chunks).catch(() => {})

  return {
    dna,
    chunks,
    contextString,
    tokenEstimate: Math.round(contextString.length / 4),
  }
}

function buildContextString(
  dna: Record<string, unknown> | null,
  chunks: ContextChunk[],
  feature: FeatureType
): string {
  const parts: string[] = []

  if (dna) {
    parts.push(`## KONTEKST FIRMOWY: ${dna.company_name ?? 'AM Automations'}`)
    parts.push('')

    if (dna.company_description) parts.push(`**O firmie:** ${dna.company_description}`)
    if (dna.core_usp) parts.push(`**Główny USP:** ${dna.core_usp}`)
    if (dna.icp_description) parts.push(`**Idealny klient (ICP):** ${dna.icp_description}`)

    if (feature === 'lead_scoring' || feature === 'outreach_generator') {
      const painPoints = dna.icp_pain_points as string[] | undefined
      if (painPoints?.length) parts.push(`**Główne bóle klienta:** ${painPoints.join(', ')}`)

      const redFlags = dna.icp_red_flags as string[] | undefined
      if (redFlags?.length) parts.push(`**Red flags — nie chcemy:** ${redFlags.join(', ')}`)

      if (dna.deal_below_which_skip) {
        parts.push(`**Poniżej tej wartości deala nie rozmawiamy:** ${dna.deal_below_which_skip} PLN`)
      }

      const objections = dna.top_objections as Array<{objection: string; best_response: string}> | undefined
      if (objections?.length) {
        parts.push(`**Najczęstsze objekcje:**`)
        objections.forEach(o => parts.push(`  - "${o.objection}": ${o.best_response}`))
      }
    }

    if (feature === 'content_generator') {
      if (dna.content_archetype) parts.push(`**Archetyp komunikacji:** ${dna.content_archetype}`)
      if (dna.content_tone) parts.push(`**Ton:** ${dna.content_tone}`)

      const vocab = dna.content_vocabulary as string[] | undefined
      if (vocab?.length) parts.push(`**Słownictwo:** ${vocab.join(', ')}`)

      const avoid = dna.content_avoid as string[] | undefined
      if (avoid?.length) parts.push(`**Unikaj słów:** ${avoid.join(', ')}`)

      const pillars = dna.content_pillars as string[] | undefined
      if (pillars?.length) parts.push(`**Filary contentu:** ${pillars.join(', ')}`)

      const cs = dna.case_studies as Array<{client_industry: string; result: string; timeframe: string; can_mention: boolean}> | undefined
      const visibleCs = cs?.filter(c => c.can_mention) ?? []
      if (visibleCs.length) {
        parts.push(`**Dostępne case studies:**`)
        visibleCs.forEach(c => parts.push(`  - ${c.client_industry}: ${c.result} (${c.timeframe})`))
      }
    }

    if (feature === 'offer_generator') {
      const services = dna.services as Array<{name: string; description: string; price_range: string; delivery_time: string}> | undefined
      if (services?.length) {
        parts.push(`**Usługi firmy:**`)
        services.forEach(s => parts.push(`  - ${s.name}: ${s.description} | Cena: ${s.price_range} | Czas: ${s.delivery_time}`))
      }

      const advantages = dna.competitive_advantages as string[] | undefined
      if (advantages?.length) parts.push(`**Przewagi konkurencyjne:** ${advantages.join(', ')}`)
    }
  }

  if (chunks.length > 0) {
    parts.push('')
    parts.push('## RELEVANTNE INFORMACJE Z BAZY WIEDZY FIRMY')
    parts.push('')
    chunks.forEach((chunk, i) => {
      parts.push(`### Fragment ${i + 1} (${chunk.category}, relevance: ${Math.round(chunk.similarity * 100)}%)`)
      if (chunk.content_summary) parts.push(`*${chunk.content_summary}*`)
      parts.push(chunk.content)
      parts.push('')
    })
  }

  if (dna || chunks.length > 0) {
    parts.push('---')
    parts.push('WAŻNE: Bazuj na powyższych informacjach o firmie. Odpowiedzi muszą być SPECYFICZNE dla tej firmy.')
    parts.push('')
  }

  return parts.join('\n')
}

async function logContextUsage(feature: FeatureType, chunks: ContextChunk[]) {
  const supabase = getSupabaseAdmin()
  await supabase.from('ai_context_usage').insert({
    feature,
    dna_used: true,
    chunks_used: chunks.map(c => ({ chunk_id: c.id, similarity: c.similarity, category: c.category })),
    chunks_count: chunks.length,
    total_context_tokens: Math.round(chunks.reduce((s, c) => s + c.content.length, 0) / 4),
  })
}
