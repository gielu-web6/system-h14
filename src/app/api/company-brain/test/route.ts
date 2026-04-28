import { NextRequest, NextResponse } from 'next/server'
import { buildContext, FeatureType } from '@/lib/company-brain/context-builder'
import { getOpenAI } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { feature, query } = await req.json()
    if (!feature || !query?.trim()) {
      return NextResponse.json({ error: 'Brak featury lub zapytania' }, { status: 400 })
    }

    const context = await buildContext(feature as FeatureType, { query })

    // Ask AI what context is missing
    const gapRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Przejrzyj ten kontekst firmowy wstrzyknięty do AI i oceń co brakuje lub co można uzupełnić.
Napisz 3-5 konkretnych sugestii co warto dodać aby kontekst był bardziej użyteczny dla featury "${feature}".

Kontekst:
${context.contextString.slice(0, 2000)}

Odpowiedz jako JSON: {"gaps": ["sugestia 1", "sugestia 2", ...]}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const { gaps } = JSON.parse(gapRes.choices[0].message.content ?? '{}')

    return NextResponse.json({
      context_string: context.contextString,
      chunks: context.chunks,
      token_estimate: context.tokenEstimate,
      dna_present: !!context.dna,
      chunks_count: context.chunks.length,
      gaps: gaps ?? [],
    })
  } catch (err) {
    console.error('POST /api/company-brain/test error:', err)
    return NextResponse.json({ error: 'Błąd testu kontekstu' }, { status: 500 })
  }
}
