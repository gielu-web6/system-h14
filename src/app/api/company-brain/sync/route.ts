import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { updateDNAFromFile } from '@/app/api/company-brain/files/[id]/process/route'

export async function POST() {
  try {
    const supabase = getSupabaseAdmin()

    // Load all successfully processed files, ordered by priority (highest first)
    const { data: files, error } = await supabase
      .from('context_files')
      .select('id, raw_text, category, priority, original_name')
      .eq('processing_status', 'done')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error
    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Brak przetworzonych plików', synced: 0 })
    }

    let synced = 0
    const errors: string[] = []

    // Process each file sequentially so merges stack correctly
    for (const file of files) {
      try {
        if (file.raw_text?.trim()) {
          await updateDNAFromFile(file.raw_text, file.category)
          synced++
        }
      } catch (e) {
        errors.push(`${file.original_name}: ${e instanceof Error ? e.message : 'błąd'}`)
      }
    }

    // Return updated DNA completeness
    const { data: dna } = await supabase
      .from('company_dna')
      .select('completeness_score')
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      synced,
      total: files.length,
      errors,
      completeness: dna?.completeness_score ?? null,
    })
  } catch (err) {
    console.error('POST /api/company-brain/sync error:', err)
    return NextResponse.json({ error: 'Błąd synchronizacji' }, { status: 500 })
  }
}
