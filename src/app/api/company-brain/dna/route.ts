import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('company_dna')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ dna: data })
  } catch (err) {
    console.error('GET /api/company-brain/dna error:', err)
    return NextResponse.json({ error: 'Błąd pobierania DNA' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('company_dna')
      .select('id')
      .limit(1)
      .maybeSingle()

    let result
    if (existing?.id) {
      const { data, error } = await supabase
        .from('company_dna')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('company_dna')
        .insert(body)
        .select()
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ dna: result })
  } catch (err) {
    console.error('PUT /api/company-brain/dna error:', err)
    return NextResponse.json({ error: 'Błąd zapisu DNA' }, { status: 500 })
  }
}
