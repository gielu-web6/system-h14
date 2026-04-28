import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { updateDNAFromFile } from '@/app/api/company-brain/files/[id]/process/route'

export function calculateDNACompleteness(dna: Record<string, unknown>): number {
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const checks = [
    !!(str(dna.company_name) && str(dna.company_description)),
    arr(dna.services).length > 0,
    !!str(dna.core_usp),
    !!str(dna.icp_description),
    arr(dna.icp_pain_points).length >= 3,
    arr(dna.icp_red_flags).length > 0,
    arr(dna.top_objections).length >= 2,
    arr(dna.case_studies).length >= 1,
    !!str(dna.content_archetype),
    arr(dna.content_pillars).length > 0,
    arr(dna.sales_process).length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin()

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

    // Recalculate and persist completeness_score
    const { data: dna } = await supabase
      .from('company_dna')
      .select('*')
      .limit(1)
      .maybeSingle()

    let completeness = 0
    if (dna?.id) {
      completeness = calculateDNACompleteness(dna as Record<string, unknown>)
      await supabase
        .from('company_dna')
        .update({ completeness_score: completeness })
        .eq('id', dna.id)
    }

    return NextResponse.json({ synced, total: files.length, errors, completeness })
  } catch (err) {
    console.error('POST /api/company-brain/sync error:', err)
    return NextResponse.json({ error: 'Błąd synchronizacji' }, { status: 500 })
  }
}
