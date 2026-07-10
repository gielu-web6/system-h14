'use client'

import { useState, useEffect, useCallback } from 'react'
import { Warehouse, Plus, Pencil, ExternalLink, Loader2, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type SupplierStatus = 'do_kontaktu' | 'napisano' | 'zatwierdzona' | 'odrzucona' | 'wstrzymana'

interface Supplier {
  id: string
  name: string
  url: string | null
  branch: string | null
  status: SupplierStatus
  contact_email: string | null
  contact_info: string | null
  min_order: number | null
  dropshipping: boolean
  notes: string | null
  created_at: string
}
type SupplierDraft = Omit<Supplier, 'id' | 'created_at'>

const STATUS_OPTIONS: SupplierStatus[] = ['do_kontaktu','napisano','zatwierdzona','odrzucona','wstrzymana']
const STATUS_LABELS: Record<SupplierStatus, string> = {
  do_kontaktu: 'Do kontaktu', napisano: 'Napisano', zatwierdzona: 'Zatwierdzona',
  odrzucona: 'Odrzucona', wstrzymana: 'Wstrzymana',
}
const STATUS_BADGE: Record<SupplierStatus, string> = {
  do_kontaktu: 'bg-fg/[0.06] text-muted',
  napisano:    'bg-blue-500/10 text-blue-400',
  zatwierdzona:'bg-green-500/10 text-green-400',
  odrzucona:   'bg-red-500/10 text-red-400',
  wstrzymana:  'bg-amber-500/10 text-amber-400',
}

function defaultDraft(): SupplierDraft {
  return {
    name: '', url: null, branch: null, status: 'do_kontaktu',
    contact_email: null, contact_info: null, min_order: null,
    dropshipping: false, notes: null,
  }
}

type Segment = 'all' | SupplierStatus
const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'do_kontaktu', label: 'Do kontaktu' },
  { id: 'napisano', label: 'Napisano' },
  { id: 'zatwierdzona', label: 'Zatwierdzone' },
  { id: 'odrzucona', label: 'Odrzucone' },
  { id: 'wstrzymana', label: 'Wstrzymane' },
]

// ─── Modal ──────────────────────────────────────────────────────────────
function SupplierModal({ initial, editingId, onClose, onSaved }: {
  initial: SupplierDraft; editingId: string | null; onClose: () => void; onSaved: () => void
}) {
  const [draft, setDraft] = useState<SupplierDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const patch = (p: Partial<SupplierDraft>) => setDraft(prev => ({ ...prev, ...p }))
  const isEdit = !!editingId

  async function handleSave() {
    if (!draft.name.trim()) { toast.error('Podaj nazwę hurtowni'); return }
    setSaving(true)
    const supabase = createClient()
    let error
    if (isEdit) {
      ;({ error } = await supabase.from('allegro_suppliers')
          .update({ ...draft, updated_at: new Date().toISOString() }).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('allegro_suppliers').insert({ ...draft }))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(isEdit ? 'Zapisano zmiany' : 'Hurtownia dodana')
    onSaved()
  }
  async function handleDelete() {
    if (!editingId) return
    const { error } = await createClient().from('allegro_suppliers').delete().eq('id', editingId)
    if (error) { toast.error(error.message); return }
    toast.success('Hurtownia usunięta'); onSaved()
  }

  const lbl = 'block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5'
  const inp = 'w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[600px] my-6 card-elevated rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <p className="text-[14px] font-bold text-fg">{isEdit ? 'Edytuj hurtownię' : 'Dodaj hurtownię'}</p>
          <button onClick={onClose} className="p-1.5 rounded-[7px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all"><X size={15} /></button>
        </div>
        <div className="px-6 py-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div>
            <label className={lbl}>Nazwa hurtowni *</label>
            <input value={draft.name} onChange={e => patch({ name: e.target.value })} placeholder="np. Hurtownia XYZ" className={inp} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Branża</label>
              <input value={draft.branch ?? ''} onChange={e => patch({ branch: e.target.value || null })} placeholder="np. Dom i ogród, wielobranżowa" className={inp} />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={draft.status} onChange={e => patch({ status: e.target.value as SupplierStatus })} className={inp + ' cursor-pointer'}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Strona / URL</label>
            <input value={draft.url ?? ''} onChange={e => patch({ url: e.target.value || null })} placeholder="https://..." className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>E-mail kontaktowy</label>
              <input value={draft.contact_email ?? ''} onChange={e => patch({ contact_email: e.target.value || null })} placeholder="kontakt@hurtownia.pl" className={inp} />
            </div>
            <div>
              <label className={lbl}>Min. zamówienie (PLN)</label>
              <input type="number" value={draft.min_order ?? ''} onChange={e => patch({ min_order: e.target.value === '' ? null : parseFloat(e.target.value) || null })} placeholder="0.00" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Kontakt / warunki</label>
            <input value={draft.contact_info ?? ''} onChange={e => patch({ contact_info: e.target.value || null })} placeholder="osoba, telefon, warunki współpracy" className={inp} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input type="checkbox" checked={draft.dropshipping} onChange={e => patch({ dropshipping: e.target.checked })} className="w-4 h-4 rounded accent-[var(--group-allegro)]" />
            <span className="text-[13px] text-fg">Oferuje dropshipping</span>
          </label>
          <div>
            <label className={lbl}>Notatki</label>
            <textarea value={draft.notes ?? ''} rows={3} onChange={e => patch({ notes: e.target.value || null })} placeholder="Dodatkowe uwagi…" className={inp + ' resize-none'} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            {isEdit && (confirmDelete ? (
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="text-[12px] font-semibold text-red-400">Usuń na pewno</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[12px] text-muted">Anuluj</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-[12px] text-subtle hover:text-red-400 transition-colors">Usuń hurtownię</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-[9px] text-[13px] text-muted hover:text-fg transition-colors">Anuluj</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-[9px] text-[13px] font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Zapisywanie…</> : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function AllegroHurtowniePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [segment, setSegment] = useState<Segment>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInit, setModalInit] = useState<SupplierDraft>(defaultDraft)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await createClient()
      .from('allegro_suppliers').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuppliers((data ?? []) as Supplier[])
  }, [])
  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  function openAdd() { setEditingId(null); setModalInit(defaultDraft()); setModalOpen(true) }
  function openEdit(s: Supplier) { setEditingId(s.id); setModalInit({ ...s }); setModalOpen(true) }
  function onSaved() { setModalOpen(false); setEditingId(null); fetchSuppliers() }

  const filtered = segment === 'all' ? suppliers : suppliers.filter(s => s.status === segment)
  const total = suppliers.length
  const approved = suppliers.filter(s => s.status === 'zatwierdzona').length
  const toContact = suppliers.filter(s => s.status === 'do_kontaktu').length
  const dropCount = suppliers.filter(s => s.dropshipping).length

  return (
    <div className="max-w-[1200px] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--group-allegro)', boxShadow: '0 0 18px color-mix(in srgb, var(--group-allegro) 40%, transparent)' }}>
            <Warehouse size={18} style={{ color: 'var(--nav-pill-text)' }} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-fg">Hurtownie</h1>
            <p className="text-[12px] text-muted">Twoi dostawcy — kontakt, status współpracy i warunki w jednym miejscu.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}>
          <Plus size={14} /> Dodaj hurtownię
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Hurtownie', value: total > 0 ? total : '—' },
          { label: 'Zatwierdzone', value: total > 0 ? approved : '—' },
          { label: 'Do kontaktu', value: total > 0 ? toContact : '—' },
          { label: 'Dropshipping', value: total > 0 ? dropCount : '—' },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card p-4" style={{ '--card-accent': 'var(--group-allegro)' } as React.CSSProperties}>
            <p className="section-label mb-1">{kpi.label}</p>
            <p className="num text-[18px] font-bold text-fg">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {SEGMENTS.map(seg => {
          const count = seg.id === 'all' ? suppliers.length : suppliers.filter(s => s.status === seg.id).length
          const active = segment === seg.id
          return (
            <button key={seg.id} onClick={() => setSegment(seg.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${active ? 'border' : 'bg-fg/[0.04] text-muted border border-transparent hover:text-fg'}`}
              style={active ? { background: 'color-mix(in srgb, var(--group-allegro) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--group-allegro) 35%, transparent)', color: 'var(--group-allegro)' } : undefined}>
              {seg.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-fg/[0.08]' : 'bg-fg/[0.06] text-subtle'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-muted" /></div>
      ) : error ? (
        <div className="card-elevated rounded-[14px] p-6 flex items-center gap-3"><AlertCircle size={18} className="text-danger flex-shrink-0" /><p className="text-[13px] text-danger">{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated rounded-[14px] flex flex-col items-center justify-center h-52 text-center gap-3">
          <Warehouse size={36} className="text-subtle" />
          <div>
            <p className="text-[14px] font-semibold text-fg">{segment === 'all' ? 'Brak hurtowni' : 'Brak hurtowni w tym segmencie'}</p>
            {segment === 'all' && <p className="text-[12px] text-muted mt-1">Kliknij „+ Dodaj hurtownię" aby zacząć.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="list-row flex items-center gap-4 px-4 py-3 rounded-[12px]">
              <div className="w-10 h-10 rounded-[8px] flex-shrink-0 flex items-center justify-center bg-fg/[0.06] border border-border">
                <Warehouse size={16} className="text-subtle" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13.5px] font-semibold text-fg truncate">{s.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                  {s.dropshipping && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-fg/[0.06] text-muted">dropshipping</span>}
                </div>
                <p className="text-[11.5px] text-muted mt-0.5 truncate">
                  {[s.branch, s.contact_email, s.min_order ? `min. ${s.min_order} zł` : null].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11.5px] text-muted hover:text-fg border border-border hover:border-fg/20 transition-all">
                    <ExternalLink size={12} /> Strona
                  </a>
                )}
                <button onClick={() => openEdit(s)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11.5px] text-muted hover:text-fg border border-border hover:border-fg/20 transition-all">
                  <Pencil size={12} /> Edytuj
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <SupplierModal initial={modalInit} editingId={editingId} onClose={() => { setModalOpen(false); setEditingId(null) }} onSaved={onSaved} />}
    </div>
  )
}
