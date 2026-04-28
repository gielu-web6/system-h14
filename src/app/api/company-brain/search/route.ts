import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { query, category_filter, match_count = 5, min_priority = 1 } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Brak zapytania' }, { status: 400 })
    }

    const embRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    const queryEmbedding = embRes.data[0].embedding

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('semantic_search', {
      query_embedding: queryEmbedding,
      match_count,
      category_filter: category_filter ?? null,
      min_priority,
    })

    if (error) throw error
    return NextResponse.json({ results: data ?? [] })
  } catch (err) {
    console.error('POST /api/company-brain/search error:', err)
    return NextResponse.json({ error: 'Błąd semantic search' }, { status: 500 })
  }
}
