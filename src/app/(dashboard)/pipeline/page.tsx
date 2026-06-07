'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Flame, Thermometer, Snowflake, X, Phone, Mail, Calendar,
  FileText, MessageSquare, DollarSign, User, Building2, Tag, CheckCircle2,
  Loader2, AlertCircle, Send, ExternalLink, Check, Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useServices } from '@/hooks/useServices'
import { isDemoMode, isSalesUser, getCurrentUser } from '@/lib/userStore'
import { DEMO_DEALS } from '@/lib/demo-data'
import toast from 'react-hot-toast'

// ─── Stage config (keys match DB values) ─────────────────────────────────────

export type DealStage =
  | 'nowy_lead' | 'dm_wyslany' | 'odpowiedz' | 'rozmowa_umowiona'
  | 'diagnoza_zrobiona' | 'oferta_prezentowana' | 'negocjacje'
  | 'wygrana' | 'przegrana' | 'nie_teraz'

export const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string }> = {
  nowy_lead:            { label: 'Nowy lead',           color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  dm_wyslany:           { label: 'DM wysłany',          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  odpowiedz:            { label: 'Odpowiedź',           color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  rozmowa_umowiona:     { label: 'Rozmowa umówiona',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  diagnoza_zrobiona:    { label: 'Diagnoza zrobiona',   color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  oferta_prezentowana:  { label: 'Oferta prezentowana', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  negocjacje:           { label: 'Negocjacje',          color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  wygrana:              { label: 'WYGRANA',             color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  przegrana:            { label: 'PRZEGRANA',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  nie_teraz:            { label: 'NIE TERAZ',           color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
}

const STAGE_ORDER: DealStage[] = [
  'nowy_lead', 'dm_wyslany', 'odpowiedz', 'rozmowa_umowiona',
  'diagnoza_zrobiona', 'oferta_prezentowana', 'negocjacje',
  'wygrana', 'przegrana', 'nie_teraz',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Deal {
  id: string
  title: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_position: string | null
  contact_segment: string | null
  value: number
  stage: DealStage
  ai_score_label: 'hot' | 'warm' | 'cold'
  ai_score_num: number
  last_contact_date: string
  next_step: string | null
  project_scope: string | null
  notes: string | null
  assigned_to: string | null
  service_ids?: string[]
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: 'hot' | 'warm' | 'cold' | null }) {
  if (score === 'hot')  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9px] font-bold uppercase tracking-wide"><Flame size={8}/>Hot</span>
  if (score === 'warm') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[9px] font-bold uppercase tracking-wide"><Thermometer size={8}/>Warm</span>
  if (score === 'cold') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[9px] font-bold uppercase tracking-wide"><Snowflake size={8}/>Cold</span>
  return null
}

function formatPLN(v: number) {
  return v.toLocaleString('pl-PL') + ' PLN'
}

function relativeDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0) return 'dziś'
  if (days === 1) return 'wczoraj'
  return `${days} dni temu`
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const personName = deal.contact_name || null
  const companyName = deal.title
  const displayName = personName || companyName
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const dateStr = relativeDate((deal as Record<string, unknown>).last_contact_date as string ?? (deal as Record<string, unknown>).created_at as string)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-[10px] bg-[#1a2239] border border-white/[0.07] hover:border-white/15 hover:bg-[#1e2a45] transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-accent/20 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white truncate leading-tight">{displayName}</p>
            {personName && <p className="text-[10px] text-white/40 truncate">{companyName}</p>}
          </div>
        </div>
        <ScoreBadge score={deal.ai_score_label} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] font-semibold text-accent">{formatPLN(deal.value)}</span>
        <span className="text-[10px] text-white/30">{dateStr}</span>
      </div>
    </button>
  )
}

// ─── Deal Detail Modal ────────────────────────────────────────────────────────

type EditForm = {
  contact_name: string
  title: string
  contact_position: string
  stage: DealStage
  ai_score_label: 'hot' | 'warm' | 'cold'
  ai_score_num: number
  value: number
  contact_email: string
  contact_phone: string
  contact_segment: string
  project_scope: string
  next_step: string
  last_contact_date: string
}

function DealModal({
  deal: initialDeal,
  onClose,
  onStageChange,
  onUpdate,
  onDelete,
}: {
  deal: Deal
  onClose: () => void
  onStageChange: (id: string, stage: DealStage) => Promise<void>
  onUpdate: (id: string, updates: Partial<Deal>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [deal, setDeal] = useState(initialDeal)
  const displayName = deal.contact_name || deal.title
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDM, setShowDM] = useState(false)
  const [dmLoading, setDmLoading] = useState(false)
  const [dmVariants, setDmVariants] = useState<Array<{ message: string } | null>>([null, null])
  const [dmCopied, setDmCopied] = useState<number | null>(null)
  const router = useRouter()
  const { services: allServices } = useServices()

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<EditForm>({
    contact_name: initialDeal.contact_name ?? '',
    title: initialDeal.title,
    contact_position: initialDeal.contact_position ?? '',
    stage: initialDeal.stage,
    ai_score_label: initialDeal.ai_score_label,
    ai_score_num: initialDeal.ai_score_num ?? 50,
    value: initialDeal.value ?? 0,
    contact_email: initialDeal.contact_email ?? '',
    contact_phone: initialDeal.contact_phone ?? '',
    contact_segment: initialDeal.contact_segment ?? '',
    project_scope: initialDeal.project_scope ?? '',
    next_step: initialDeal.next_step ?? '',
    last_contact_date: initialDeal.last_contact_date ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const sf = (k: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const sfNum = (k: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: Number(e.target.value) || 0 }))

  const startEdit = () => {
    setForm({
      contact_name: deal.contact_name ?? '',
      title: deal.title,
      contact_position: deal.contact_position ?? '',
      stage: deal.stage,
      ai_score_label: deal.ai_score_label,
      ai_score_num: deal.ai_score_num ?? 50,
      value: deal.value ?? 0,
      contact_email: deal.contact_email ?? '',
      contact_phone: deal.contact_phone ?? '',
      contact_segment: deal.contact_segment ?? '',
      project_scope: deal.project_scope ?? '',
      next_step: deal.next_step ?? '',
      last_contact_date: deal.last_contact_date ?? '',
    })
    setErrors({})
    setEditMode(true)
  }

  const cancelEdit = () => {
    setErrors({})
    setEditMode(false)
  }

  const handleClose = () => {
    if (editMode) { setShowCloseConfirm(true) } else { onClose() }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(deal.id)
    onClose()
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.contact_name.trim()) errs.contact_name = 'Wymagane'
    const email = form.contact_email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.contact_email = 'Nieprawidłowy email'
    if (form.value < 0) errs.value = 'Min 0'
    if (form.ai_score_num < 0 || form.ai_score_num > 100) errs.ai_score_num = 'Zakres 0–100'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const safeUpdates: Partial<Deal> = {
        title:             form.title.trim() || deal.title,
        stage:             form.stage,
        value:             form.value,
        contact_name:      form.contact_name.trim() || null,
        contact_position:  form.contact_position.trim() || null,
        contact_email:     form.contact_email.trim() || null,
        contact_phone:     form.contact_phone.trim() || null,
        contact_segment:   form.contact_segment.trim() || null,
        project_scope:     form.project_scope.trim() || null,
        next_step:         form.next_step.trim() || null,
        last_contact_date: form.last_contact_date || deal.last_contact_date,
      }
      const updates = safeUpdates
      if (form.stage !== deal.stage) {
        await onStageChange(deal.id, form.stage)
      }
      await onUpdate(deal.id, safeUpdates)
      setDeal(d => ({ ...d, ...updates } as Deal))
      setEditMode(false)
    } catch { /* toast shown by onUpdate */ } finally {
      setSaving(false)
    }
  }

  const toggleDealService = async (serviceId: string) => {
    const current = deal.service_ids ?? []
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId]
    const supabase = createClient()
    await supabase.from('deals').update({ service_ids: updated }).eq('id', deal.id)
    setDeal(d => ({ ...d, service_ids: updated }))
  }

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSaving(true)
    await onStageChange(deal.id, e.target.value as DealStage)
    setSaving(false)
    onClose()
  }

  const generateDM = async () => {
    setDmLoading(true)
    setDmVariants([null, null])
    const payload = {
      messageType: 'dm1_icebreaker',
      leadData: {
        first_name: (deal.contact_name ?? deal.title).split(' ')[0] ?? deal.title,
        last_name: (deal.contact_name ?? '').split(' ').slice(1).join(' ') || '',
        company: deal.title,
        position: deal.contact_position ?? '',
        industry: deal.contact_segment ?? '',
        company_website: '',
        buying_signal: deal.project_scope ?? '',
      },
    }
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/ai/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        fetch('/api/ai/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, context: '[wariant alternatywny]' }) }),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setDmVariants([d1.result ?? null, d2.result ?? d1.result ?? null])
    } catch { /* silent */ }
    finally { setDmLoading(false) }
  }

  const copyDM = async (idx: number) => {
    const v = dmVariants[idx]
    if (!v) return
    await navigator.clipboard.writeText(v.message)
    setDmCopied(idx)
    setTimeout(() => setDmCopied(null), 2000)
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-[8px] bg-bg border text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all ${err ? 'border-red-500/50' : 'border-white/[0.1]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full sm:max-w-[480px] h-full bg-sidebar sm:border-l border-white/[0.08] overflow-y-auto shadow-2xl">

        {/* Confirm close with unsaved changes */}
        {showCloseConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-sidebar border border-white/[0.1] rounded-[16px] p-6 max-w-[280px] w-full">
              <p className="text-[14px] font-semibold text-white mb-2">Niezapisane zmiany</p>
              <p className="text-[12px] text-white/50 mb-4">Masz niezapisane zmiany. Zamknąć bez zapisu?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 py-2 rounded-[8px] bg-white/[0.06] text-white/70 text-[12px] font-medium hover:bg-white/[0.1] transition-all">
                  Wróć
                </button>
                <button onClick={onClose}
                  className="flex-1 py-2 rounded-[8px] bg-red-500/20 border border-red-500/30 text-red-400 text-[12px] font-medium hover:bg-red-500/30 transition-all">
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-sidebar/95 backdrop-blur border-b border-white/[0.07] p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-accent/20 flex items-center justify-center text-[14px] font-bold text-accent">
              {initials}
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{displayName}</p>
              <p className="text-[12px] text-white/40">{deal.title} · {deal.contact_position || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!editMode && (
              <button onClick={startEdit}
                className="px-2.5 py-1 rounded-[7px] bg-accent/10 border border-accent/25 text-accent text-[11px] font-medium hover:bg-accent/20 transition-all">
                Edytuj
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {editMode ? (
            /* ─── EDIT MODE ─────────────────────────────────────────────────── */
            <>
              {/* Contact */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Kontakt</p>
                <div className="space-y-2">
                  <div>
                    <input value={form.contact_name} onChange={sf('contact_name')}
                      placeholder="Imię i nazwisko *"
                      className={inputCls(errors.contact_name)} />
                    {errors.contact_name && <p className="text-[10px] text-red-400 mt-1">{errors.contact_name}</p>}
                  </div>
                  <input value={form.title} onChange={sf('title')} placeholder="Firma / projekt"
                    className={inputCls()} />
                  <input value={form.contact_position} onChange={sf('contact_position')} placeholder="Rola / stanowisko"
                    className={inputCls()} />
                </div>
              </div>

              {/* Stage */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Etap pipeline</p>
                <select value={form.stage} onChange={sf('stage')}
                  className="w-full px-3 py-2 rounded-[8px] bg-bg border border-white/[0.1] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all">
                  {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
                </select>
              </div>

              {/* Score + value */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Score i wartość</p>
                <div className="grid grid-cols-3 gap-2">
                  <select value={form.ai_score_label} onChange={sf('ai_score_label')}
                    className="px-3 py-2 rounded-[8px] bg-bg border border-white/[0.1] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all">
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🌡 Warm</option>
                    <option value="cold">❄️ Cold</option>
                  </select>
                  <div>
                    <input type="number" value={form.ai_score_num} onChange={sfNum('ai_score_num')} min={0} max={100}
                      placeholder="0–100" className={inputCls(errors.ai_score_num)} />
                    {errors.ai_score_num && <p className="text-[10px] text-red-400 mt-1">{errors.ai_score_num}</p>}
                  </div>
                  <div>
                    <input type="number" value={form.value} onChange={sfNum('value')} min={0}
                      placeholder="PLN" className={inputCls(errors.value)} />
                    {errors.value && <p className="text-[10px] text-red-400 mt-1">{errors.value}</p>}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Dane kontaktowe</p>
                <div className="space-y-2">
                  <div>
                    <input type="email" value={form.contact_email} onChange={sf('contact_email')} placeholder="Email"
                      className={inputCls(errors.contact_email)} />
                    {errors.contact_email && <p className="text-[10px] text-red-400 mt-1">{errors.contact_email}</p>}
                  </div>
                  <input type="tel" value={form.contact_phone} onChange={sf('contact_phone')} placeholder="Telefon"
                    className={inputCls()} />
                  <select value={form.contact_segment} onChange={sf('contact_segment')}
                    className="w-full px-3 py-2 rounded-[8px] bg-bg border border-white/[0.1] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all">
                    <option value="">— segment —</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Project scope */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Zakres projektu</p>
                <textarea value={form.project_scope} onChange={sf('project_scope')} rows={3}
                  placeholder="Opisz zakres projektu…"
                  className="w-full px-3 py-2 rounded-[8px] bg-bg border border-white/[0.1] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all resize-none" />
              </div>

              {/* Next step */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Następny krok</p>
                <input value={form.next_step} onChange={sf('next_step')} placeholder="Co dalej?"
                  className={inputCls()} />
              </div>

              {/* Last contact */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Ostatni kontakt</p>
                <input type="date" value={form.last_contact_date} onChange={sf('last_contact_date')}
                  className={inputCls()} />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={cancelEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50">
                  Anuluj
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Zapisuję...</> : 'Zapisz zmiany'}
                </button>
              </div>
            </>
          ) : (
            /* ─── VIEW MODE ─────────────────────────────────────────────────── */
            <>
              {/* Stage change */}
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Etap pipeline</p>
                <div className="flex items-center gap-2">
                  <select
                    value={deal.stage}
                    onChange={handleStageChange}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-[8px] bg-bg border border-white/[0.1] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all disabled:opacity-60"
                  >
                    {STAGE_ORDER.map(s => (
                      <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                    ))}
                  </select>
                  {saving && <Loader2 size={15} className="text-accent animate-spin flex-shrink-0" />}
                </div>
              </div>

              {/* Score + value */}
              <div className="flex items-center gap-2">
                <ScoreBadge score={deal.ai_score_label} />
                <span className="text-[11px] text-white/40">Score: {deal.ai_score_num}/100</span>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]">
                <DollarSign size={15} className="text-accent" />
                <div>
                  <p className="text-[10px] text-white/40">Wartość projektu</p>
                  <p className="text-[16px] font-bold text-white">{formatPLN(deal.value)}</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Dane kontaktowe</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: User,      label: deal.contact_position || '—' },
                    { icon: Building2, label: deal.title },
                    { icon: Mail,      label: deal.contact_email || '—' },
                    { icon: Phone,     label: deal.contact_phone || '—' },
                    { icon: Tag,       label: deal.contact_segment || '—' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <item.icon size={13} className="text-white/30 flex-shrink-0" />
                      <span className="text-white/60">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope */}
              {deal.project_scope && (
                <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">Zakres projektu</p>
                  <p className="text-[13px] text-white/75">{deal.project_scope}</p>
                </div>
              )}

              {/* Next step */}
              {deal.next_step && (
                <div className="p-3 rounded-[10px] bg-[#6366f1]/[0.08] border border-accent/20">
                  <p className="text-[10px] font-semibold text-accent/70 uppercase tracking-wide mb-1">Następny krok</p>
                  <p className="text-[13px] text-white/80">{deal.next_step}</p>
                </div>
              )}

              {/* Last contact */}
              <div className="flex items-center gap-2 text-[12px] text-white/40">
                <Calendar size={13} />
                Ostatni kontakt: {new Date(deal.last_contact_date).toLocaleDateString('pl-PL')}
              </div>

              {/* Notes */}
              {deal.notes && (
                <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">Notatki</p>
                  <p className="text-[12px] text-white/65 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              )}

              {/* Services */}
              {allServices.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Przypisane usługi</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allServices.map(s => {
                      const assigned = (deal.service_ids ?? []).includes(s.id)
                      return (
                        <button key={s.id} onClick={() => void toggleDealService(s.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            assigned
                              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                              : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60'
                          }`}>
                          {assigned && <Check size={9} className="inline mr-1" />}{s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => { setShowDM(v => !v); if (!showDM) generateDM() }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/60 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                  <MessageSquare size={13} /> Generuj DM
                </button>
                <button onClick={() => router.push('/offer-generator')}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-accent/15 border border-accent/30 text-accent text-[12px] font-medium hover:bg-accent/25 transition-all">
                  <FileText size={13} /> Generuj ofertę <ExternalLink size={10} />
                </button>
              </div>

              {/* Delete */}
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-[8px] border border-red-500/20 text-red-400/60 text-[11px] font-medium hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all">
                  <Trash2 size={12} /> Usuń deal
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-[8px] border border-white/10 text-white/40 text-[11px] hover:bg-white/[0.04] transition-all">
                    Anuluj
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-red-500/15 border border-red-500/40 text-red-400 text-[11px] font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50">
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Potwierdź usunięcie
                  </button>
                </div>
              )}

              {/* Inline DM panel */}
              {showDM && (
                <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-white">2 warianty DM</p>
                    {dmLoading && <Loader2 size={13} className="animate-spin text-accent" />}
                  </div>
                  {dmVariants.map((v, idx) => v && (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-accent uppercase">Wariant {idx === 0 ? 'A' : 'B'}</span>
                        <button onClick={() => copyDM(idx)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-white/[0.05] text-white/50 text-[10px] hover:text-white transition-all">
                          {dmCopied === idx ? <><CheckCircle2 size={10} className="text-green-400" /> Skopiowano</> : <><Send size={10} /> Kopiuj</>}
                        </button>
                      </div>
                      <div className="p-3 rounded-[8px] bg-[#6366f1]/[0.07] border border-[#6366f1]/15">
                        <pre className="text-[12px] text-white/75 whitespace-pre-wrap font-sans leading-relaxed">{v.message}</pre>
                      </div>
                    </div>
                  ))}
                  {!dmLoading && dmVariants.every(v => v === null) && (
                    <button onClick={generateDM} className="w-full py-2 rounded-[8px] bg-accent text-white text-[12px] font-bold hover:opacity-90 transition-all">
                      Generuj ponownie
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── New Deal Modal ───────────────────────────────────────────────────────────

const SEGMENTS = ['e-commerce', 'usługi', 'gastro', 'beauty', 'b2b', 'nieruchomości', 'zdrowie', 'edukacja']

function NewDealModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (deal: Deal) => void
}) {
  const [form, setForm] = useState({
    contactName: '', company: '', position: '',
    email: '', phone: '', value: '', stage: 'nowy_lead' as DealStage, segment: 'usługi',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const salesUser = isSalesUser() ? getCurrentUser() : null
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.company || 'Nowa Firma',
        contact_name: form.contactName || null,
        contact_email: form.email || null,
        contact_phone: form.phone || null,
        contact_position: form.position || null,
        contact_segment: form.segment || null,
        value: parseInt(form.value) || 10000,
        stage: form.stage,
        ...(salesUser ? { assigned_to: salesUser.id } : {}),
      }),
    })
    const data = await res.json()

    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Błąd zapisu'); return }
    onAdd(data as Deal)

    // Alert 9 — big deal >= 15 000 PLN
    const dealValue = parseInt(form.value) || 0
    if (dealValue >= 15000) {
      fetch('/api/deals/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'big_deal',
          dealId: (data as Deal).id,
          company: form.company,
          value: dealValue,
          stage: form.stage,
        }),
      }).catch(() => {})
    }

    setSaved(true)
    setTimeout(() => onClose(), 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] bg-sidebar border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div>
            <p className="text-[15px] font-bold text-white">Nowy deal</p>
            <p className="text-[11px] text-white/40 mt-0.5">Dodaj deal do pipeline CRM</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={16} />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-green-400" />
            </div>
            <p className="text-[15px] font-semibold text-white">Deal dodany!</p>
            <p className="text-[12px] text-white/40">{form.company} pojawił się w pipeline</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Imię i Nazwisko</label>
                <input value={form.contactName} onChange={set('contactName')} placeholder="Jan Kowalski"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Firma *</label>
                <input value={form.company} onChange={set('company')} required placeholder="Nazwa firmy"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Stanowisko</label>
                <input value={form.position} onChange={set('position')} placeholder="CEO / Marketing Manager"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Wartość (PLN)</label>
                <input value={form.value} onChange={set('value')} type="number" placeholder="15000"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Email</label>
                <input value={form.email} onChange={set('email')} type="email" placeholder="jan@firma.pl"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Telefon</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+48 500 000 000"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Etap pipeline</label>
                <select value={form.stage} onChange={set('stage')}
                  className="w-full px-3 py-2 rounded-[8px] bg-bg border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all">
                  {STAGE_ORDER.filter(s => s !== 'przegrana').map(s => (
                    <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Segment</label>
                <select value={form.segment} onChange={set('segment')}
                  className="w-full px-3 py-2 rounded-[8px] bg-bg border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-accent/50 transition-all">
                  {SEGMENTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                Anuluj
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Zapisuję...</> : 'Dodaj deal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showNewDeal, setShowNewDeal] = useState(false)

  // ── Fetch all deals from Supabase (or demo data) ──────────────────────────
  const fetchDeals = useCallback(async () => {
    if (isDemoMode()) {
      setDeals(DEMO_DEALS as unknown as Deal[])
      setLoading(false)
      return
    }
    const supabase = createClient()
    let query = supabase.from('deals').select('*').order('created_at', { ascending: false })
    if (isSalesUser()) {
      const u = getCurrentUser()
      if (u) query = query.eq('assigned_to', u.id)
    }
    const { data, error: err } = await query

    if (err) { setError(err.message); setLoading(false); return }
    setDeals((data as Deal[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  // ── Change stage ───────────────────────────────────────────────────────────
  const handleStageChange = async (id: string, stage: DealStage) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    setSelectedDeal(prev => prev?.id === id ? { ...prev, stage } : prev)
    if (isDemoMode()) return

    const deal = deals.find(d => d.id === id)
    const supabase = createClient()
    const updatePayload: Record<string, unknown> = { stage, updated_at: new Date().toISOString() }

    if (stage === 'wygrana') updatePayload.won_at = new Date().toISOString()
    if (stage === 'przegrana') updatePayload.lost_at = new Date().toISOString()

    const { error: err } = await supabase
      .from('deals')
      .update(updatePayload)
      .eq('id', id)

    if (err) { console.error(err); return }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    setSelectedDeal(prev => prev?.id === id ? { ...prev, stage } : prev)

    // Auto-create income entry when deal is won
    if (stage === 'wygrana' && deal?.value) {
      const net = deal.value
      const vatRate = 23
      const vatAmount = Math.round(net * vatRate / 100 * 100) / 100
      const grossAmount = Math.round((net + vatAmount) * 100) / 100
      supabase.from('app_income').upsert({
        deal_id: id,
        client: deal.title,
        project: deal.title,
        amount: net,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        gross_amount: grossAmount,
        net_profit: net,
        type: 'faktura',
        status: 'oczekująca',
        date: new Date().toISOString().slice(0, 10),
        from_invoice: false,
      }, { onConflict: 'deal_id', ignoreDuplicates: true }).then()
    }

    // Fire Telegram alerts (fire-and-forget)
    if (deal) {
      if (stage === 'wygrana') {
        fetch('/api/deals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'won',
            dealId: id,
            company: deal.title,
            value: deal.value,
            assignedTo: deal.assigned_to ?? undefined,
          }),
        }).catch(() => {})
      }
      if (stage === 'przegrana') {
        fetch('/api/deals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'lost',
            dealId: id,
            company: deal.title,
            lostReason: null,
          }),
        }).catch(() => {})
      }
    }
  }

  // ── Update deal fields ─────────────────────────────────────────────────────
  const handleDealUpdate = async (id: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    if (isDemoMode()) { toast.success('Zapisano zmiany'); return }
    const res = await fetch('/api/deals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error('Błąd zapisu: ' + (err.error ?? ''))
      throw new Error(err.error)
    }
    toast.success('Zapisano zmiany')
  }

  // ── Delete deal ────────────────────────────────────────────────────────────
  const handleDealDelete = async (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id))
    setSelectedDeal(null)
    if (isDemoMode()) { toast.success('Deal usunięty'); return }
    const supabase = createClient()
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) toast.error('Błąd usuwania: ' + error.message)
    else toast.success('Deal usunięty')
  }

  // ── Add new deal ───────────────────────────────────────────────────────────
  const handleAddDeal = (deal: Deal) => {
    setDeals(prev => [deal, ...prev])
  }

  // ── Group by stage ─────────────────────────────────────────────────────────
  const dealsByStage = STAGE_ORDER.reduce<Record<DealStage, Deal[]>>((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {} as Record<DealStage, Deal[]>)

  const totalValue = deals
    .filter(d => !['przegrana', 'nie_teraz'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value ?? 0), 0)

  const wonValue = deals
    .filter(d => d.stage === 'wygrana')
    .reduce((sum, d) => sum + (d.value ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-400">
        <AlertCircle size={15} /> Błąd ładowania: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 flex-shrink-0">
        <div>
          <h1 className="text-[20px] font-bold text-white">Pipeline CRM</h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            {deals.length} dealów · aktywny:{' '}
            <span className="text-white/60 font-semibold">{totalValue.toLocaleString('pl-PL')} PLN</span>
            <span className="hidden sm:inline">{' · '}wygrane:{' '}
            <span className="text-green-400 font-semibold">{wonValue.toLocaleString('pl-PL')} PLN</span></span>
          </p>
        </div>
        <button
          onClick={() => setShowNewDeal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-medium hover:bg-accent/20 transition-all"
        >
          + Nowy deal
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-3 h-full" style={{ minWidth: `${STAGE_ORDER.length * 230}px` }}>
          {STAGE_ORDER.map((stage) => {
            const config = STAGE_CONFIG[stage]
            const stageDeals = dealsByStage[stage]
            const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0)

            return (
              <div key={stage} className="flex flex-col w-[220px] flex-shrink-0">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-[10px] mb-2 flex-shrink-0"
                  style={{ background: config.bg }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: config.color }}>
                      {config.label}
                    </span>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: config.color + '25', color: config.color }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-[9px] font-semibold" style={{ color: config.color + 'aa' }}>
                      {(stageValue / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onClick={() => setSelectedDeal(deal)} />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-6 text-[11px] text-white/20">Brak dealów</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onStageChange={handleStageChange}
          onUpdate={handleDealUpdate}
          onDelete={handleDealDelete}
        />
      )}

      {showNewDeal && (
        <NewDealModal
          onClose={() => setShowNewDeal(false)}
          onAdd={handleAddDeal}
        />
      )}
    </div>
  )
}
