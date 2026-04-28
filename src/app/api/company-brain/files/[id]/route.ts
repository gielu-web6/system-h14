import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('context_files')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ file: data })
  } catch {
    return NextResponse.json({ error: 'Nie znaleziono pliku' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('context_files')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ file: data })
  } catch (err) {
    console.error('PATCH /api/company-brain/files/[id] error:', err)
    return NextResponse.json({ error: 'Błąd aktualizacji pliku' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('context_files').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/company-brain/files/[id] error:', err)
    return NextResponse.json({ error: 'Błąd usuwania pliku' }, { status: 500 })
  }
}
