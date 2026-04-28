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
    // Delete old chunks
    await supabase.from('context_chunks').delete().eq('file_id', fileId)

    // Generate summary and key facts
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

    // Chunk and embed
    const chunksCount = await chunkAndEmbed(fileId, file.raw_text, file.category, file.priority ?? 1)

    await supabase.from('context_files').update({
      processing_status: 'done',
      summary: summary ?? null,
      key_facts: key_facts ?? [],
      chunks_count: chunksCount,
      processed_at: new Date().toISOString(),
    }).eq('id', fileId)

    // Optionally update DNA from key documents
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

async function updateDNAFromFile(text: string, category: string) {
  const relevantCategories = ['icp_profil', 'strategia_firmy', 'opis_uslug']
  if (!relevantCategories.includes(category)) return

  try {
    const supabase = getSupabaseAdmin()
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Przeanalizuj ten dokument firmowy (kategoria: ${category}) i wyciągnij informacje.
Wyciągnij TYLKO to co faktycznie jest w dokumencie (nie wymyślaj):
- core_usp (jeśli jest)
- icp_description (jeśli jest)
- icp_pain_points (lista stringów, jeśli są)
- content_archetype (jeśli wnioskujesz jednoznacznie)

Dokument:
${text.slice(0, 3000)}

Odpowiedz jako JSON. Pola których nie ma — ustaw jako null.
{"core_usp": null, "icp_description": null, "icp_pain_points": null, "content_archetype": null}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const updates = JSON.parse(response.choices[0].message.content ?? '{}')
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== null))

    if (Object.keys(filtered).length === 0) return

    const { data: existing } = await supabase.from('company_dna').select('id').limit(1).maybeSingle()
    if (existing?.id) {
      await supabase.from('company_dna').update(filtered).eq('id', existing.id)
    }
  } catch (e) {
    console.error('[CompanyBrain] DNA auto-update failed:', e)
  }
}
