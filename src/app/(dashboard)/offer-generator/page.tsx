'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  FileText, ChevronRight, ChevronLeft, Loader2, Sparkles,
  Check, Copy, ExternalLink, AlertCircle, Plus, X, Trash2,
  Pencil, Eye, Clock, Send, ArrowLeft, RefreshCw,
  Building2, Tag, Calendar, CreditCard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

// ─── Constants ────────────────────────────────────────────────────────────────

const AM_SERVICES = [
  { id: 'mobile_app', label: 'Aplikacja mobilna (iOS + Android)' },
  { id: 'website_landing', label: 'Strona internetowa / Landing page' },
  { id: 'website_corporate', label: 'Strona firmowa z CMS' },
  { id: 'internal_system', label: 'System wewnętrzny (CRM / ERP / Dashboard)' },
  { id: 'ai_chatbot', label: 'Chatbot AI (obsługa klienta)' },
  { id: 'ai_receptionist', label: 'AI Recepcjonistka (telefon + SMS)' },
  { id: 'automation', label: 'Automatyzacja procesów (Make / n8n)' },
  { id: 'api_integrations', label: 'Integracje z systemami zewnętrznymi (API)' },
  { id: 'admin_panel', label: 'Panel administracyjny' },
  { id: 'ecommerce', label: 'E-commerce / sklep online' },
  { id: 'company_brain', label: 'Company Brain (baza wiedzy AI)' },
  { id: 'training', label: 'Szkolenia i onboarding zespołu' },
  { id: 'support_sla', label: 'Wsparcie techniczne (SLA)' },
  { id: 'data_migration', label: 'Migracja danych i wdrożenie' },
]

const PROJECT_TYPES = [
  'Aplikacja mobilna',
  'Strona www',
  'System wewnętrzny',
  'AI Chatbot',
  'AI Recepcjonistka',
  'Automatyzacja',
  'E-commerce',
  'Inne',
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Szkic',         color: 'bg-white/[0.07] text-white/50' },
  sent:       { label: 'Wysłana',        color: 'bg-blue-500/15 text-blue-400' },
  viewed:     { label: 'Otwarta',        color: 'bg-amber-500/15 text-amber-400' },
  cta_clicked:{ label: 'CTA kliknięte', color: 'bg-orange-500/15 text-orange-400' },
  accepted:   { label: 'Zaakceptowana', color: 'bg-green-500/15 text-green-400' },
  rejected:   { label: 'Odrzucona',     color: 'bg-red-500/15 text-red-400' },
  expired:    { label: 'Wygasła',       color: 'bg-white/[0.05] text-white/30 line-through' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingVariantDraft {
  id: string
  name: string
  price: number
  features: string[]
  description: string
  is_recommended: boolean
}

interface ScopeItemDraft  { id: string; text: string }
interface TimelineItemDraft { id: string; week: string; name: string; description: string }
interface ObjekcjaDraft    { id: string; zarzut: string; odpowiedz: string }

interface OfferDraft {
  // Wizard inputs
  client_name: string
  contact_name: string
  project_type: string
  client_logo_url: string
  selected_service_ids: string[]
  pricing_variants_input: { name: string; price: string }[]
  valid_until: string
  payment_terms: string
  client_problem: string
  project_start_date: string
  additional_notes: string
  // AI generated + editable
  diagnoza_bolu: string
  solution_description: string
  scope_items: ScopeItemDraft[]
  timeline_items: TimelineItemDraft[]
  objekcje: ObjekcjaDraft[]
  pricing_variants: PricingVariantDraft[]
}

interface OfferListItem {
  id: string
  public_slug: string
  company_name: string
  contact_name?: string
  project_type?: string
  status?: string
  effective_status: string
  created_at: string
  expires_at?: string
  view_count: number
  last_viewed_at?: string
  cta_clicked: boolean
  time_on_pricing: number
  pricing_variants?: Array<{ name: string; price: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lbl = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5'
const inp = 'w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#E8A838]/50 transition-all'
const btn = 'flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all'

function uid() { return Math.random().toString(36).slice(2) }

function fmt(n: number) { return n.toLocaleString('pl-PL') }

function fmtTime(secs: number) {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
}

function defaultDraft(): OfferDraft {
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 21)
  return {
    client_name: '', contact_name: '', project_type: '', client_logo_url: '',
    selected_service_ids: [],
    pricing_variants_input: [{ name: 'Kompletny', price: '' }],
    valid_until: validUntil.toISOString().split('T')[0],
    payment_terms: '20% zaliczka, 80% po wdrożeniu',
    client_problem: '', project_start_date: '', additional_notes: '',
    diagnoza_bolu: '', solution_description: '',
    scope_items: [], timeline_items: [], objekcje: [], pricing_variants: [],
  }
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Klient', 'Zakres & Wycena', 'Brief']
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const s = i + 1
        const done = s < step
        const active = s === step
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              done ? 'bg-[#E8A838] text-black' : active ? 'bg-[#E8A838]/20 border border-[#E8A838]/60 text-[#E8A838]' : 'bg-white/[0.05] text-white/25'
            }`}>
              {done ? <Check size={11} /> : s}
            </div>
            <span className={`text-[11px] font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-white/40' : 'text-white/20'}`}>{label}</span>
            {s < 3 && <ChevronRight size={12} className="text-white/15 mx-0.5" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── EditableSection wrapper ──────────────────────────────────────────────────

function EditableSection({
  title, icon, editing, onToggle, display, editor,
}: {
  title: string
  icon: React.ReactNode
  editing: boolean
  onToggle: () => void
  display: React.ReactNode
  editor: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-white/40">{icon}</span>
          <span className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">{title}</span>
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all ${
            editing ? 'bg-[#E8A838]/20 text-[#E8A838]' : 'bg-white/[0.05] text-white/35 hover:text-white/60'
          }`}
        >
          {editing ? <><Check size={10} /> Gotowe</> : <><Pencil size={10} /> Edytuj</>}
        </button>
      </div>
      <div className="px-5 py-4">
        {editing ? editor : display}
      </div>
    </div>
  )
}

// ─── Offer List View ──────────────────────────────────────────────────────────

function OfferList({
  offers, loading, onNew, onEdit, onDuplicate,
}: {
  offers: OfferListItem[]
  loading: boolean
  onNew: () => void
  onEdit: (o: OfferListItem) => void
  onDuplicate: (o: OfferListItem) => void
}) {
  const [filter, setFilter] = useState<string>('all')
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = filter === 'all' ? offers : offers.filter(o => o.effective_status === filter)

  function copyLink(slug: string) {
    const url = `${window.location.origin}/offer/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Link skopiowany!')
  }

  const FILTERS = [
    { key: 'all', label: 'Wszystkie' },
    { key: 'draft', label: 'Szkice' },
    { key: 'sent', label: 'Wysłane' },
    { key: 'viewed', label: 'Otwarte' },
    { key: 'cta_clicked', label: 'Zainteresowane' },
    { key: 'accepted', label: 'Zaakceptowane' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2.5">
            <FileText size={18} className="text-[#E8A838]" /> Generator Ofert AI
          </h1>
          <p className="text-[12px] text-white/35 mt-0.5">Oferty z trackingiem otwarć i czasu na sekcjach</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#E8A838] hover:bg-[#d4952e] text-black text-[13px] font-bold transition-all"
        >
          <Plus size={14} /> Nowa oferta
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
              filter === f.key ? 'bg-[#E8A838]/20 text-[#E8A838] border border-[#E8A838]/30' : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {offers.filter(o => o.effective_status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={22} className="animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <FileText size={32} className="text-white/10 mb-3" />
          <p className="text-[13px] text-white/30">
            {filter === 'all' ? 'Brak ofert — kliknij "Nowa oferta" aby zacząć' : 'Brak ofert w tym filtrze'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(offer => {
            const st = getStatusCfg(offer.effective_status)
            const total = offer.pricing_variants?.[offer.pricing_variants.length - 1]?.price ?? 0
            return (
              <div
                key={offer.id}
                className="bg-[#0f1a30] border border-white/[0.07] rounded-[14px] px-5 py-4 flex items-center gap-4 hover:border-white/[0.12] transition-all group"
              >
                {/* Client */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <p className="text-[14px] font-bold text-white truncate">{offer.company_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/35">
                    {offer.project_type && <span>{offer.project_type}</span>}
                    {total > 0 && <span className="text-[#E8A838]/70 font-semibold">{fmt(total)} PLN</span>}
                    <span>{new Date(offer.created_at).toLocaleDateString('pl-PL')}</span>
                    {offer.expires_at && (
                      <span className={new Date(offer.expires_at) < new Date() ? 'text-red-400/60' : ''}>
                        Ważna do {new Date(offer.expires_at).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tracking stats */}
                <div className="hidden lg:flex items-center gap-5">
                  {/* Views */}
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <Eye size={13} className="text-white/25" />
                    <span className={offer.view_count > 0 ? 'text-white/70 font-semibold' : 'text-white/25'}>
                      {offer.view_count}×
                    </span>
                  </div>

                  {/* Last viewed */}
                  <div className="flex items-center gap-1.5 text-[12px] w-24">
                    <Clock size={13} className="text-white/25" />
                    <span className="text-white/40 truncate">
                      {offer.last_viewed_at
                        ? formatDistanceToNow(new Date(offer.last_viewed_at), { locale: pl, addSuffix: true })
                        : '—'}
                    </span>
                  </div>

                  {/* Pricing time */}
                  <div className={`flex items-center gap-1.5 text-[12px] w-16 ${offer.time_on_pricing >= 120 ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                    <CreditCard size={13} className="opacity-60 flex-shrink-0" />
                    <span>{offer.time_on_pricing > 0 ? fmtTime(offer.time_on_pricing) : '—'}</span>
                  </div>

                  {/* CTA */}
                  <div className="w-5 flex justify-center">
                    {offer.cta_clicked
                      ? <Check size={14} className="text-green-400" />
                      : <X size={14} className="text-white/20" />}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyLink(offer.public_slug)}
                    className="p-2 rounded-[8px] bg-white/[0.05] text-white/40 hover:text-white transition-all"
                    title="Kopiuj link"
                  >
                    {copied === offer.public_slug ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                  <a
                    href={`/offer/${offer.public_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-[8px] bg-white/[0.05] text-white/40 hover:text-white transition-all"
                    title="Podgląd oferty"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => onEdit(offer)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white/[0.05] text-white/50 hover:text-white text-[11px] font-semibold transition-all"
                  >
                    <Pencil size={11} /> Edytuj
                  </button>
                  <button
                    onClick={() => onDuplicate(offer)}
                    className="p-2 rounded-[8px] bg-white/[0.05] text-white/30 hover:text-white/60 transition-all"
                    title="Duplikuj"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Offer Editor (after generation / editing existing) ───────────────────────

function OfferEditor({
  draft, onChange, onSave, saving, savedUrl, onBack,
}: {
  draft: OfferDraft
  onChange: (patch: Partial<OfferDraft>) => void
  onSave: () => void
  saving: boolean
  savedUrl: string | null
  onBack: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tempText, setTempText] = useState('')

  function toggleEdit(section: string) {
    if (editing === section) {
      setEditing(null)
    } else {
      setEditing(section)
      setTempText('')
    }
  }

  function copyLink() {
    if (!savedUrl) return
    navigator.clipboard.writeText(savedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link skopiowany!')
  }

  const isEditing = (s: string) => editing === s

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-all">
            <ArrowLeft size={14} /> Lista ofert
          </button>
          <span className="text-white/20">·</span>
          <div>
            <p className="text-[15px] font-bold text-white">{draft.client_name || 'Oferta'}</p>
            {draft.project_type && <p className="text-[11px] text-white/35">{draft.project_type}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {savedUrl ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-green-500/10 border border-green-500/25">
                <code className="text-[11px] text-green-400/80 truncate max-w-[180px]">{savedUrl}</code>
                <button onClick={copyLink} className="text-green-400 hover:text-green-300 transition-all flex-shrink-0">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="text-green-400/60 hover:text-green-400 transition-all flex-shrink-0">
                  <ExternalLink size={13} />
                </a>
              </div>
            </>
          ) : (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#E8A838] hover:bg-[#d4952e] disabled:opacity-50 text-black text-[13px] font-bold transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {saving ? 'Zapisuję…' : 'Wyślij ofertę'}
            </button>
          )}
        </div>
      </div>

      {/* ── Diagnoza ── */}
      <EditableSection
        title="Diagnoza problemu"
        icon={<AlertCircle size={13} />}
        editing={isEditing('diagnoza')}
        onToggle={() => toggleEdit('diagnoza')}
        display={
          <p className="text-[13px] text-white/65 leading-relaxed">
            {draft.diagnoza_bolu || <span className="text-white/25 italic">Brak opisu</span>}
          </p>
        }
        editor={
          <textarea
            className={`${inp} resize-none`}
            rows={4}
            value={draft.diagnoza_bolu}
            onChange={e => onChange({ diagnoza_bolu: e.target.value })}
          />
        }
      />

      {/* ── Rozwiązanie ── */}
      <EditableSection
        title="Nasze rozwiązanie"
        icon={<Sparkles size={13} />}
        editing={isEditing('solution')}
        onToggle={() => toggleEdit('solution')}
        display={
          <p className="text-[13px] text-white/65 leading-relaxed">
            {draft.solution_description || <span className="text-white/25 italic">Brak opisu</span>}
          </p>
        }
        editor={
          <textarea
            className={`${inp} resize-none`}
            rows={4}
            value={draft.solution_description}
            onChange={e => onChange({ solution_description: e.target.value })}
          />
        }
      />

      {/* ── Zakres ── */}
      <EditableSection
        title="Zakres wdrożenia"
        icon={<Check size={13} />}
        editing={isEditing('scope')}
        onToggle={() => toggleEdit('scope')}
        display={
          <div className="space-y-1.5">
            {draft.scope_items.length === 0
              ? <p className="text-[12px] text-white/25 italic">Brak elementów zakresu</p>
              : draft.scope_items.map(item => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <Check size={12} className="text-[#E8A838] flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-white/65">{item.text}</p>
                  </div>
                ))
            }
          </div>
        }
        editor={
          <div className="space-y-2">
            {draft.scope_items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  value={item.text}
                  onChange={e => onChange({
                    scope_items: draft.scope_items.map((s, j) => j === i ? { ...s, text: e.target.value } : s),
                  })}
                  placeholder="Element zakresu"
                  className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                />
                <button
                  onClick={() => onChange({ scope_items: draft.scope_items.filter((_, j) => j !== i) })}
                  className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ scope_items: [...draft.scope_items, { id: uid(), text: '' }] })}
              className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-all"
            >
              <Plus size={11} /> Dodaj element zakresu
            </button>
          </div>
        }
      />

      {/* ── Harmonogram ── */}
      <EditableSection
        title="Harmonogram realizacji"
        icon={<Calendar size={13} />}
        editing={isEditing('timeline')}
        onToggle={() => toggleEdit('timeline')}
        display={
          <div className="space-y-3">
            {draft.timeline_items.length === 0
              ? <p className="text-[12px] text-white/25 italic">Harmonogram do ustalenia po akceptacji oferty</p>
              : draft.timeline_items.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#E8A838]/20 border border-[#E8A838]/30 flex items-center justify-center text-[11px] font-bold text-[#E8A838] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#E8A838]/70 mb-0.5">{item.week}</p>
                      <p className="text-[13px] font-semibold text-white/80">{item.name}</p>
                      {item.description && <p className="text-[12px] text-white/45 mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                ))
            }
          </div>
        }
        editor={
          <div className="space-y-3">
            {draft.timeline_items.map((item, i) => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase">Etap {i + 1}</span>
                  <button
                    onClick={() => onChange({ timeline_items: draft.timeline_items.filter((_, j) => j !== i) })}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={item.week}
                    onChange={e => onChange({ timeline_items: draft.timeline_items.map((t, j) => j === i ? { ...t, week: e.target.value } : t) })}
                    placeholder="Tydzień 1–2"
                    className="px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                  />
                  <input
                    value={item.name}
                    onChange={e => onChange({ timeline_items: draft.timeline_items.map((t, j) => j === i ? { ...t, name: e.target.value } : t) })}
                    placeholder="Nazwa etapu"
                    className="px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                  />
                </div>
                <textarea
                  value={item.description}
                  onChange={e => onChange({ timeline_items: draft.timeline_items.map((t, j) => j === i ? { ...t, description: e.target.value } : t) })}
                  placeholder="Opis etapu (opcjonalnie)"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all resize-none"
                />
              </div>
            ))}
            <button
              onClick={() => onChange({ timeline_items: [...draft.timeline_items, { id: uid(), week: '', name: '', description: '' }] })}
              className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-all"
            >
              <Plus size={11} /> Dodaj etap
            </button>
          </div>
        }
      />

      {/* ── FAQ / Objekcje ── */}
      <EditableSection
        title="FAQ dla klienta"
        icon={<Tag size={13} />}
        editing={isEditing('faq')}
        onToggle={() => toggleEdit('faq')}
        display={
          <div className="space-y-3">
            {draft.objekcje.length === 0
              ? <p className="text-[12px] text-white/25 italic">Brak pytań FAQ</p>
              : draft.objekcje.map(item => (
                  <div key={item.id}>
                    <p className="text-[12px] font-semibold text-white/75 mb-0.5">❓ {item.zarzut}</p>
                    <p className="text-[12px] text-white/45 ml-4">💬 {item.odpowiedz}</p>
                  </div>
                ))
            }
          </div>
        }
        editor={
          <div className="space-y-3">
            {draft.objekcje.map((item, i) => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => onChange({ objekcje: draft.objekcje.filter((_, j) => j !== i) })}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <input
                  value={item.zarzut}
                  onChange={e => onChange({ objekcje: draft.objekcje.map((o, j) => j === i ? { ...o, zarzut: e.target.value } : o) })}
                  placeholder="Pytanie / obiekcja klienta"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                />
                <textarea
                  value={item.odpowiedz}
                  onChange={e => onChange({ objekcje: draft.objekcje.map((o, j) => j === i ? { ...o, odpowiedz: e.target.value } : o) })}
                  placeholder="Odpowiedź"
                  rows={2}
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all resize-none"
                />
              </div>
            ))}
            <button
              onClick={() => onChange({ objekcje: [...draft.objekcje, { id: uid(), zarzut: '', odpowiedz: '' }] })}
              className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-all"
            >
              <Plus size={11} /> Dodaj pytanie
            </button>
          </div>
        }
      />

      {/* ── Warianty cenowe ── */}
      <EditableSection
        title="Warianty cenowe"
        icon={<CreditCard size={13} />}
        editing={isEditing('pricing')}
        onToggle={() => toggleEdit('pricing')}
        display={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {draft.pricing_variants.map(v => (
              <div key={v.id} className={`rounded-[12px] p-4 border ${v.is_recommended ? 'border-[#E8A838]/40 bg-[#E8A838]/5' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                {v.is_recommended && (
                  <div className="text-[10px] font-bold text-[#E8A838] mb-2">★ POLECANY</div>
                )}
                <p className="text-[13px] font-bold text-white mb-1">{v.name}</p>
                <p className="text-[20px] font-black text-[#E8A838] mb-3">{fmt(v.price)} PLN</p>
                <div className="space-y-1">
                  {v.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Check size={11} className="text-[#E8A838]/60 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-white/55">{f}</span>
                    </div>
                  ))}
                  {v.features.length > 4 && (
                    <p className="text-[10px] text-white/25 ml-4">+{v.features.length - 4} więcej</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        }
        editor={
          <div className="space-y-4">
            {draft.pricing_variants.map((v, vi) => (
              <div key={v.id} className="bg-white/[0.03] border border-white/[0.07] rounded-[12px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/40 uppercase">Wariant {vi + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_recommended}
                        onChange={e => onChange({
                          pricing_variants: draft.pricing_variants.map((pv, j) =>
                            j === vi ? { ...pv, is_recommended: e.target.checked } : { ...pv, is_recommended: false }
                          ),
                        })}
                        className="accent-[#E8A838]"
                      />
                      Polecany
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={v.name}
                    onChange={e => onChange({
                      pricing_variants: draft.pricing_variants.map((pv, j) => j === vi ? { ...pv, name: e.target.value } : pv),
                    })}
                    placeholder="Nazwa wariantu"
                    className="px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                  />
                  <input
                    type="number"
                    value={v.price || ''}
                    onChange={e => onChange({
                      pricing_variants: draft.pricing_variants.map((pv, j) => j === vi ? { ...pv, price: parseFloat(e.target.value) || 0 } : pv),
                    })}
                    placeholder="Cena PLN netto"
                    className="px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                  />
                </div>
                {/* Features */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/25 font-semibold uppercase">Co zawiera</p>
                  {v.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <input
                        value={f}
                        onChange={e => onChange({
                          pricing_variants: draft.pricing_variants.map((pv, j) => j === vi ? {
                            ...pv,
                            features: pv.features.map((feat, fj) => fj === fi ? e.target.value : feat),
                          } : pv),
                        })}
                        placeholder="Cecha wariantu"
                        className="flex-1 px-2.5 py-1.5 rounded-[7px] bg-white/[0.03] border border-white/[0.06] text-white text-[11px] focus:outline-none focus:border-[#E8A838]/40 transition-all"
                      />
                      <button
                        onClick={() => onChange({
                          pricing_variants: draft.pricing_variants.map((pv, j) => j === vi ? {
                            ...pv,
                            features: pv.features.filter((_, fj) => fj !== fi),
                          } : pv),
                        })}
                        className="text-white/15 hover:text-red-400 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onChange({
                      pricing_variants: draft.pricing_variants.map((pv, j) => j === vi ? { ...pv, features: [...pv.features, ''] } : pv),
                    })}
                    className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-all"
                  >
                    <Plus size={10} /> Dodaj cechę
                  </button>
                </div>
              </div>
            ))}
          </div>
        }
      />

      {/* ── Warunki ── */}
      <EditableSection
        title="Warunki i termin ważności"
        icon={<FileText size={13} />}
        editing={isEditing('terms')}
        onToggle={() => toggleEdit('terms')}
        display={
          <div className="flex items-start gap-6">
            <div>
              <p className="text-[10px] text-white/25 font-semibold uppercase mb-1">Warunki płatności</p>
              <p className="text-[13px] text-white/65">{draft.payment_terms || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25 font-semibold uppercase mb-1">Ważna do</p>
              <p className="text-[13px] text-white/65">{draft.valid_until ? new Date(draft.valid_until).toLocaleDateString('pl-PL') : '—'}</p>
            </div>
          </div>
        }
        editor={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Warunki płatności</label>
              <input
                value={draft.payment_terms}
                onChange={e => onChange({ payment_terms: e.target.value })}
                placeholder="np. 20% zaliczka, 80% po wdrożeniu"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Termin ważności oferty</label>
              <input
                type="date"
                value={draft.valid_until}
                onChange={e => onChange({ valid_until: e.target.value })}
                className={inp}
              />
            </div>
          </div>
        }
      />
    </div>
  )
}

// ─── Main Generator Page ──────────────────────────────────────────────────────

export default function OfferGeneratorPage() {
  type View = 'list' | 'create' | 'edit'
  const [view, setView] = useState<View>('list')
  const [step, setStep] = useState(1)

  // List
  const [offers, setOffers] = useState<OfferListItem[]>([])
  const [loadingOffers, setLoadingOffers] = useState(true)

  // Draft (new offer being built)
  const [draft, setDraft] = useState<OfferDraft>(defaultDraft)

  // Generation
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // Saving
  const [saving, setSaving] = useState(false)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)

  // Editing existing offer
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  // Logo upload ref
  const logoRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // ── Load offers ──────────────────────────────────────────────────────────
  const fetchOffers = useCallback(async () => {
    setLoadingOffers(true)
    try {
      const res = await fetch('/api/offers/list')
      const data = await res.json()
      if (data.offers) setOffers(data.offers)
    } catch {
      toast.error('Błąd pobierania ofert')
    } finally {
      setLoadingOffers(false)
    }
  }, [])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  // ── Realtime notifications ───────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('offer-tracking')
      .on('broadcast', { event: 'offer_viewed' }, (payload: { payload: { clientName: string } }) => {
        toast(`📧 ${payload.payload.clientName} właśnie otworzyła Twoją ofertę!`, {
          duration: 6000,
          style: { background: '#1a2940', color: '#fff', border: '1px solid rgba(232,168,56,0.3)' },
        })
        fetchOffers()
      })
      .on('broadcast', { event: 'cta_clicked' }, (payload: { payload: { clientName: string } }) => {
        toast.success(`🔥 ${payload.payload.clientName} kliknął "Akceptuję ofertę"!`, {
          duration: 10000,
        })
        fetchOffers()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchOffers])

  // ── Helpers ──────────────────────────────────────────────────────────────
  function patchDraft(patch: Partial<OfferDraft>) {
    setDraft(prev => ({ ...prev, ...patch }))
  }

  function setPricingVariantInput(idx: number, field: 'name' | 'price', value: string) {
    const arr = [...draft.pricing_variants_input]
    arr[idx] = { ...arr[idx], [field]: value }
    patchDraft({ pricing_variants_input: arr })
  }

  function handleLogoUpload(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        patchDraft({ client_logo_url: canvas.toDataURL('image/png', 0.85) })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  function startNewOffer() {
    setDraft(defaultDraft())
    setSavedUrl(null)
    setEditingSlug(null)
    setStep(1)
    setGenError('')
    setView('create')
  }

  function handleDuplicate(offer: OfferListItem) {
    setDraft({
      ...defaultDraft(),
      client_name: offer.company_name,
      contact_name: offer.contact_name ?? '',
      project_type: offer.project_type ?? '',
    })
    setSavedUrl(null)
    setEditingSlug(null)
    setStep(1)
    setView('create')
    toast('Otwarto duplikat. Uzupełnij dane i wygeneruj nową ofertę.')
  }

  async function handleEditExisting(offer: OfferListItem) {
    // Load full offer data
    try {
      const res = await fetch(`/api/offers/${offer.id}`)
      const data = await res.json()
      const o = data.offer

      const loadedDraft: OfferDraft = {
        client_name: o.company_name ?? '',
        contact_name: o.contact_name ?? '',
        project_type: o.project_type ?? '',
        client_logo_url: o.client_logo_url ?? '',
        selected_service_ids: o.selected_service_ids ?? [],
        pricing_variants_input: (o.pricing_variants ?? []).map((v: { name: string; price: number }) => ({ name: v.name, price: String(v.price) })),
        valid_until: o.expires_at ? o.expires_at.split('T')[0] : defaultDraft().valid_until,
        payment_terms: o.payment_terms ?? '20% zaliczka, 80% po wdrożeniu',
        client_problem: o.client_problem ?? '',
        project_start_date: o.project_start_date ?? '',
        additional_notes: o.additional_notes ?? '',
        diagnoza_bolu: o.diagnoza_bolu ?? '',
        solution_description: o.solution_description ?? '',
        scope_items: (o.scope_items ?? []).map((s: { text: string }) => ({ id: uid(), text: s.text })),
        timeline_items: (o.timeline_items ?? []).map((t: { week: string; name: string; description?: string }) => ({
          id: uid(), week: t.week, name: t.name, description: t.description ?? '',
        })),
        objekcje: (o.objekcje ?? []).map((ob: { zarzut: string; odpowiedz: string }) => ({ id: uid(), zarzut: ob.zarzut, odpowiedz: ob.odpowiedz })),
        pricing_variants: (o.pricing_variants ?? []).map((v: { name: string; price: number; features: string[]; is_recommended: boolean }) => ({
          id: uid(), name: v.name, price: v.price, features: v.features ?? [], description: '', is_recommended: v.is_recommended,
        })),
      }

      setDraft(loadedDraft)
      setEditingSlug(offer.public_slug)
      setSavedUrl(`${window.location.origin}/offer/${offer.public_slug}`)
      setView('edit')
    } catch {
      toast.error('Nie udało się załadować oferty')
    }
  }

  // ── AI Generation ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!draft.client_problem.trim()) { toast.error('Wpisz opis problemu klienta'); return }
    if (draft.selected_service_ids.length === 0) { toast.error('Zaznacz co najmniej jedną usługę'); return }
    if (draft.pricing_variants_input.some(v => !v.name.trim() || !v.price)) { toast.error('Uzupełnij nazwy i ceny wariantów'); return }

    setGenerating(true)
    setGenError('')

    const selectedServiceLabels = AM_SERVICES
      .filter(s => draft.selected_service_ids.includes(s.id))
      .map(s => s.label)

    const pricingVariantsForAI = draft.pricing_variants_input
      .filter(v => v.name.trim())
      .map(v => ({ name: v.name, price: parseFloat(v.price.replace(/\s/g, '')) || 0 }))

    try {
      const res = await fetch('/api/offers/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: draft.client_name,
          project_type: draft.project_type,
          client_problem: draft.client_problem,
          selected_services: selectedServiceLabels,
          pricing_variants: pricingVariantsForAI,
          project_start_date: draft.project_start_date || null,
          additional_notes: draft.additional_notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Błąd AI')

      const result = data.result

      // Merge AI output into draft
      patchDraft({
        diagnoza_bolu: result.diagnoza_bolu ?? '',
        solution_description: result.solution_description ?? '',
        scope_items: (result.scope_items ?? []).map((s: { text: string }) => ({ id: uid(), text: s.text })),
        timeline_items: (result.timeline_items ?? []).map((t: { week: string; name: string; description?: string }) => ({
          id: uid(), week: t.week, name: t.name, description: t.description ?? '',
        })),
        objekcje: (result.objekcje ?? []).map((o: { zarzut: string; odpowiedz: string }) => ({ id: uid(), zarzut: o.zarzut, odpowiedz: o.odpowiedz })),
        pricing_variants: (result.pricing_variants ?? []).map((v: { name: string; price: number; features: string[]; is_recommended: boolean }) => ({
          id: uid(), name: v.name, price: v.price, features: v.features ?? [], description: '', is_recommended: v.is_recommended,
        })),
      })

      setView('edit')
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Błąd generowania')
      toast.error(e instanceof Error ? e.message : 'Błąd generowania')
    } finally {
      setGenerating(false)
    }
  }, [draft])

  // ── Save offer ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!draft.client_name.trim()) { toast.error('Brak nazwy klienta'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: draft.client_name,
          contact_name: draft.contact_name || undefined,
          client_logo_url: draft.client_logo_url || undefined,
          project_type: draft.project_type || undefined,
          selected_service_ids: draft.selected_service_ids,
          client_problem: draft.client_problem,
          project_start_date: draft.project_start_date || null,
          additional_notes: draft.additional_notes || null,
          diagnoza_bolu: draft.diagnoza_bolu,
          solution_description: draft.solution_description,
          scope_items: draft.scope_items.map(s => ({ text: s.text, included: true })),
          timeline_items: draft.timeline_items.map(t => ({ week: t.week, name: t.name, description: t.description })),
          objekcje: draft.objekcje.map(o => ({ zarzut: o.zarzut, odpowiedz: o.odpowiedz })),
          pricing_variants: draft.pricing_variants.map(v => ({
            name: v.name, price: v.price, features: v.features, is_recommended: v.is_recommended,
          })),
          payment_terms: draft.payment_terms,
          valid_until: draft.valid_until,
          status: 'sent',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Błąd zapisu')
      setSavedUrl(data.url)
      setEditingSlug(data.slug)
      toast.success('Oferta zapisana!')
      fetchOffers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }, [draft, fetchOffers])

  // ── Render ───────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="max-w-[1200px] space-y-5">
        <OfferList
          offers={offers}
          loading={loadingOffers}
          onNew={startNewOffer}
          onEdit={handleEditExisting}
          onDuplicate={handleDuplicate}
        />
      </div>
    )
  }

  if (view === 'edit') {
    return (
      <div className="max-w-[800px] space-y-5">
        <OfferEditor
          draft={draft}
          onChange={patchDraft}
          onSave={handleSave}
          saving={saving}
          savedUrl={savedUrl}
          onBack={() => { setView('list'); fetchOffers() }}
        />
      </div>
    )
  }

  // ── Create wizard ────────────────────────────────────────────────────────
  return (
    <div className="max-w-[680px] space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-all">
          <ArrowLeft size={14} /> Lista ofert
        </button>
        <span className="text-white/20">·</span>
        <h1 className="text-[16px] font-bold text-white flex items-center gap-2">
          <Sparkles size={15} className="text-[#E8A838]" /> Nowa oferta
        </h1>
      </div>

      <div className="bg-[#0f1a30] border border-white/[0.07] rounded-[16px] p-6">
        <StepBar step={step} />

        {/* ── STEP 1: Client ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <Building2 size={14} className="text-[#E8A838]" /> Dane klienta
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Nazwa firmy / klienta *</label>
                <input value={draft.client_name} onChange={e => patchDraft({ client_name: e.target.value })}
                  placeholder="np. ABC sp. z o.o." className={inp} autoFocus />
              </div>
              <div>
                <label className={lbl}>Osoba kontaktowa</label>
                <input value={draft.contact_name} onChange={e => patchDraft({ contact_name: e.target.value })}
                  placeholder="Jan Kowalski" className={inp} />
              </div>
            </div>

            <div>
              <label className={lbl}>Typ projektu *</label>
              <select value={draft.project_type} onChange={e => patchDraft({ project_type: e.target.value })}
                className={`${inp} cursor-pointer`}>
                <option value="">Wybierz typ projektu…</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Logo upload */}
            <div>
              <label className={lbl}>Logo klienta (opcjonalnie)</label>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
              {draft.client_logo_url ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]">
                  <img src={draft.client_logo_url} alt="" className="h-8 object-contain rounded" />
                  <button onClick={() => { patchDraft({ client_logo_url: '' }); if (logoRef.current) logoRef.current.value = '' }}
                    className="ml-auto text-white/30 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => logoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-[10px] bg-white/[0.03] border border-dashed border-white/[0.10] text-white/30 text-[12px] hover:border-[#E8A838]/40 hover:text-white/50 transition-all">
                  Kliknij aby wgrać logo
                </button>
              )}
            </div>

            <button onClick={() => setStep(2)} disabled={!draft.client_name.trim() || !draft.project_type}
              className={`${btn} bg-[#E8A838] hover:bg-[#d4952e] text-black disabled:opacity-40`}>
              Dalej <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Services + Pricing ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <Tag size={14} className="text-[#E8A838]" /> Zakres i wycena
            </h2>

            {/* Services checkboxes */}
            <div>
              <label className={lbl}>Usługi w zakresie * <span className="text-white/20 normal-case font-normal">— tylko zaznaczone usługi trafią do oferty</span></label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {AM_SERVICES.map(s => {
                  const checked = draft.selected_service_ids.includes(s.id)
                  return (
                    <label key={s.id}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer transition-all ${
                        checked ? 'bg-[#E8A838]/10 border border-[#E8A838]/30' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                      }`}>
                      <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all ${
                        checked ? 'bg-[#E8A838]' : 'bg-white/[0.08] border border-white/[0.15]'
                      }`}>
                        {checked && <Check size={9} className="text-black" />}
                      </div>
                      <input type="checkbox" checked={checked} className="hidden"
                        onChange={e => {
                          const ids = e.target.checked
                            ? [...draft.selected_service_ids, s.id]
                            : draft.selected_service_ids.filter(id => id !== s.id)
                          patchDraft({ selected_service_ids: ids })
                        }} />
                      <span className={`text-[12px] font-medium ${checked ? 'text-white/85' : 'text-white/40'}`}>{s.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Pricing variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={lbl + ' mb-0'}>Warianty cenowe *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(n => (
                    <button key={n}
                      onClick={() => {
                        const arr = [...draft.pricing_variants_input]
                        while (arr.length < n) arr.push({ name: '', price: '' })
                        patchDraft({ pricing_variants_input: arr.slice(0, n) })
                      }}
                      className={`w-7 h-7 rounded-[6px] text-[12px] font-bold transition-all ${
                        draft.pricing_variants_input.length === n
                          ? 'bg-[#E8A838]/20 text-[#E8A838] border border-[#E8A838]/40'
                          : 'bg-white/[0.05] text-white/30 hover:text-white/60'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {draft.pricing_variants_input.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input
                      value={v.name}
                      onChange={e => setPricingVariantInput(i, 'name', e.target.value)}
                      placeholder={`Wariant ${i + 1} — nazwa (np. Podstawowy)`}
                      className={inp}
                    />
                    <input
                      value={v.price}
                      onChange={e => setPricingVariantInput(i, 'price', e.target.value)}
                      placeholder="Cena PLN netto"
                      type="number"
                      className={inp}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-white/25">AI nie zmieni tych cen — wypełni tylko opis co zawiera każdy wariant</p>
            </div>

            {/* Valid until + payment terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Termin ważności oferty</label>
                <input type="date" value={draft.valid_until} onChange={e => patchDraft({ valid_until: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Warunki płatności</label>
                <input value={draft.payment_terms} onChange={e => patchDraft({ payment_terms: e.target.value })}
                  placeholder="20% zaliczka, 80% po wdrożeniu" className={inp} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className={`${btn} bg-white/[0.05] text-white/50 hover:text-white`}>
                <ChevronLeft size={14} /> Wstecz
              </button>
              <button onClick={() => setStep(3)}
                disabled={draft.selected_service_ids.length === 0 || draft.pricing_variants_input.some(v => !v.name.trim() || !v.price)}
                className={`${btn} flex-1 justify-center bg-[#E8A838] hover:bg-[#d4952e] text-black disabled:opacity-40`}>
                Dalej <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: AI Brief ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-[#E8A838]" /> Brief dla AI
            </h2>

            <div>
              <label className={lbl}>Opis problemu klienta * <span className="text-white/20 normal-case font-normal">— co usłyszałeś na spotkaniu</span></label>
              <textarea
                value={draft.client_problem}
                onChange={e => patchDraft({ client_problem: e.target.value })}
                rows={6}
                placeholder={`Przykład:\n- Tracą 8h tygodniowo na ręczne przepisywanie danych\n- Chcą aplikację mobilną dla fizjoterapeutów\n- Budżet ok 18k\n- Decyzja w 2 tygodnie`}
                className={`${inp} resize-none leading-relaxed`}
                autoFocus
              />
              <p className="mt-1 text-[10px] text-white/25">AI użyje TYLKO tego co tu wpiszesz i zaznaczonych usług — nic nie wymyśli</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Data startu projektu <span className="text-white/20 normal-case font-normal">(opcjonalnie)</span></label>
                <input type="date" value={draft.project_start_date} onChange={e => patchDraft({ project_start_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Dodatkowe uwagi dla AI <span className="text-white/20 normal-case font-normal">(opcjonalnie)</span></label>
                <input value={draft.additional_notes} onChange={e => patchDraft({ additional_notes: e.target.value })}
                  placeholder="np. klient boi się zmian w zespole" className={inp} />
              </div>
            </div>

            {genError && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400" />
                <p className="text-[12px] text-red-300">{genError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} disabled={generating}
                className={`${btn} bg-white/[0.05] text-white/50 hover:text-white disabled:opacity-40`}>
                <ChevronLeft size={14} /> Wstecz
              </button>
              <button onClick={handleGenerate} disabled={generating || !draft.client_problem.trim()}
                className={`${btn} flex-1 justify-center bg-gradient-to-r from-[#E8A838] to-[#d4952e] text-black disabled:opacity-40 font-bold shadow-lg shadow-amber-500/20`}>
                {generating
                  ? <><Loader2 size={14} className="animate-spin" /> AI generuje…</>
                  : <><Sparkles size={14} /> Generuj ofertę</>
                }
              </button>
            </div>

            {generating && (
              <div className="p-4 rounded-[12px] bg-[#E8A838]/10 border border-[#E8A838]/20">
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-[#E8A838]" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">AI analizuje brief…</p>
                    <p className="text-[11px] text-white/40">Generuję zakres, harmonogram, FAQ i opisy wariantów</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
