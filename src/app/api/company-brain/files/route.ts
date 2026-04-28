import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('context_files')
      .select('id, original_name, file_type, category, description, priority, is_active, processing_status, processing_error, chunks_count, processed_at, created_at, summary, key_facts, file_size_bytes')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ files: data ?? [] })
  } catch (err) {
    console.error('GET /api/company-brain/files error:', err)
    return NextResponse.json({ error: 'Błąd pobierania plików' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { original_name, file_type, category, description, priority, tags, raw_text } = body

    if (!original_name || !file_type || !category) {
      return NextResponse.json({ error: 'Brak wymaganych pól' }, { status: 400 })
    }
    if (!raw_text?.trim()) {
      return NextResponse.json({ error: 'Brak treści pliku' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('context_files')
      .insert({
        original_name,
        filename: original_name,
        file_type,
        category,
        description: description || null,
        priority: priority ?? 1,
        tags: tags ?? [],
        raw_text,
        file_size_bytes: raw_text.length,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ file: data })
  } catch (err) {
    console.error('POST /api/company-brain/files error:', err)
    return NextResponse.json({ error: 'Błąd tworzenia pliku' }, { status: 500 })
  }
}
