'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Search, X, Flame, Thermometer, Snowflake,
  Phone, Mail, Globe, Calendar, Check,
  MessageSquare, TrendingUp, SlidersHorizontal, CheckCircle2,
  Download, Upload, Link2, Share2, Brain, Plus, Loader2,
  Send, StickyNote, ChevronDown, Pencil, Trash2, ArrowUpDown,
  AlertCircle,
} from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useServices } from '@/hooks/useServices'
import { isDemoMode, isSalesUser, getCurrentUser } from '@/lib/userStore'
import { DEMO_LEADS } from '@/lib/demo-data'

// ─── Types ─────────────────────────────────────────────────────────────────────

type AiScore = 'hot' | 'warm' | 'cold'

interface Lead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
  email: string
  phone: string
  city: string
  segment: string
  aiScore: number
  aiLabel: AiScore
  aiIcpScore: number
  aiSignalsScore: number
  aiActivityScore: number
  aiPotentialScore: number
  aiReasoning: string
  aiScoredAt: string | null
  status: 'nowy' | 'kontakt' | 'zainteresowany' | 'pipeline' | 'nieaktywny'
  lastContact: string
  problem: string
  icebreaker: string
  website?: string
  linkedin?: string
  instagram?: string
  notes?: string
  scanData?: string
  service_ids?: string[]
  outreachHistory: { date: string; type: string; content: string }[]
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

function dbToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) ?? '',
    lastName: (row.last_name as string) ?? '',
    company: (row.company as string) ?? '',
    position: (row.position as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    city: (row.city as string) ?? '',
    segment: (row.segment as string) ?? 'usługi',
    aiScore: (row.ai_score_num as number) ?? 50,
    aiLabel: ((row.ai_score_label as string) ?? 'warm') as AiScore,
    aiIcpScore:       (row.ai_icp_score       as number) ?? 0,
    aiSignalsScore:   (row.ai_signals_score   as number) ?? 0,
    aiActivityScore:  (row.ai_activity_score  as number) ?? 0,
    aiPotentialScore: (row.ai_potential_score as number) ?? 0,
    aiReasoning:      (row.ai_reasoning       as string) ?? '',
    aiScoredAt:       (row.ai_scored_at       as string) ?? null,
    status: ((row.app_status as string) ?? 'nowy') as Lead['status'],
    lastContact: (row.last_contact as string) ?? new Date().toISOString().slice(0, 10),
    problem: (row.ai_problem as string) ?? '',
    icebreaker: (row.ai_icebreaker as string) ?? '',
    website: (row.company_website as string) ?? undefined,
    linkedin: (row.linkedin_url as string) ?? undefined,
    instagram: (row.instagram_url as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    scanData: (row.scan_data as string) ?? undefined,
    service_ids: (row.service_ids as string[]) ?? [],
    outreachHistory: (row.outreach_history as Lead['outreachHistory']) ?? [],
  }
}

function leadToDb(lead: Lead) {
  return {
    first_name:  lead.firstName,
    last_name:   lead.lastName,
    company:     lead.company,
    position:    lead.position,
    email:       lead.email,
    phone:       lead.phone,
    city:        lead.city,
    segment:     lead.segment,
    ai_score_num:   lead.aiScore,
    ai_score_label: lead.aiLabel,
    ai_icp_score:       lead.aiIcpScore,
    ai_signals_score:   lead.aiSignalsScore,
    ai_activity_score:  lead.aiActivityScore,
    ai_potential_score: lead.aiPotentialScore,
    ai_reasoning:       lead.aiReasoning || null,
    ai_scored_at:       lead.aiScoredAt  || null,
    app_status:     lead.status,
    last_contact:   lead.lastContact,
    ai_problem:     lead.problem,
    ai_icebreaker:  lead.icebreaker,
    company_website: lead.website ?? null,
    linkedin_url:    lead.linkedin ?? null,
    instagram_url:   lead.instagram ?? null,
    notes:      lead.notes    ?? null,
    scan_data:  lead.scanData ?? null,
    service_ids: lead.service_ids ?? [],
    outreach_history: lead.outreachHistory,
  }
}

// ─── LocalStorage helpers (segments only) ────────────────────────────────────

const LS_SEGMENTS_KEY = 'agencyos_segments'

const DEFAULT_SEGMENTS = [
  'beauty', 'fitness', 'medyczne', 'ecommerce', 'restauracje',
  'kancelarie', 'nieruchomości', 'szkolenia', 'hotele', 'it', 'usługi',
]

const DEFAULT_SEGMENT_LABELS: Record<string, string> = {
  beauty: 'Beauty', fitness: 'Fitness', medyczne: 'Medyczne',
  ecommerce: 'E-commerce', restauracje: 'Restauracje',
  kancelarie: 'Kancelarie', nieruchomości: 'Nieruchomości',
  szkolenia: 'Szkolenia', hotele: 'Hotele', it: 'IT / Tech', usługi: 'Usługi',
}

function loadSegments(): { keys: string[]; labels: Record<string, string> } {
  try {
    const raw = localStorage.getItem(LS_SEGMENTS_KEY)
    if (!raw) return { keys: DEFAULT_SEGMENTS, labels: DEFAULT_SEGMENT_LABELS }
    return JSON.parse(raw)
  } catch { return { keys: DEFAULT_SEGMENTS, labels: DEFAULT_SEGMENT_LABELS } }
}

function saveSegment(key: string, label: string) {
  const current = loadSegments()
  if (!current.keys.includes(key)) {
    const updated = { keys: [...current.keys, key], labels: { ...current.labels, [key]: label } }
    localStorage.setItem(LS_SEGMENTS_KEY, JSON.stringify(updated))
    return updated
  }
  return current
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

const CSV_COL_MAP: Record<string, string> = {
  'ID': 'id', 'Imię': 'first_name', 'Nazwisko': 'last_name', 'Firma': 'company',
  'Stanowisko': 'position', 'Email': 'email', 'Telefon': 'phone', 'Miasto': 'city',
  'Segment': 'segment', 'AI Score': 'ai_score_num', 'Etykieta AI': 'ai_score_label',
  'Status': 'app_status', 'Ostatni kontakt': 'last_contact',
  'LinkedIn': 'linkedin_url', 'Instagram': 'instagram_url', 'Strona www': 'company_website',
  'Problem': 'ai_problem', 'Icebreaker': 'ai_icebreaker', 'Notatki': 'notes',
}
const CSV_JSON_COLS = new Set(['scan_data', 'outreach_history', 'service_ids', 'tags'])
const CSV_NUM_COLS  = new Set(['ai_score_num', 'ai_icp_score', 'ai_signals_score', 'ai_activity_score', 'ai_potential_score'])

function exportCSV(leads: Lead[]) {
  const headers = ['ID', 'Imię', 'Nazwisko', 'Firma', 'Stanowisko', 'Email', 'Telefon', 'Miasto',
    'Segment', 'AI Score', 'Etykieta AI', 'Status', 'Ostatni kontakt',
    'LinkedIn', 'Instagram', 'Strona www', 'Problem', 'Icebreaker', 'Notatki']
  const rows = leads.map(l => [
    l.id, l.firstName, l.lastName, l.company, l.position, l.email, l.phone, l.city,
    l.segment, l.aiScore, l.aiLabel, l.status, l.lastContact,
    l.linkedin ?? '', l.instagram ?? '', l.website ?? '',
    l.problem ?? '', l.icebreaker ?? '', l.notes ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leady_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`Wyeksportowano ${leads.length} leadów`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ label, score }: { label: AiScore; score: number }) {
  if (label === 'hot') return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/15 text-danger text-[10px] font-bold"
      style={{ boxShadow: '0 0 10px rgba(232,64,64,0.28)' }}
    >
      <Flame size={9} />{score}
    </span>
  )
  if (label === 'warm') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/15 text-amber text-[10px] font-bold">
      <Thermometer size={9} />{score}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-bold">
      <Snowflake size={9} />{score}
    </span>
  )
}

const STATUS_LABELS: Record<string, string> = {
  nowy: 'Nowy', kontakt: 'Kontakt', zainteresowany: 'Zainteresowany',
  pipeline: 'W pipeline', nieaktywny: 'Nieaktywny',
}
const STATUS_COLORS: Record<string, string> = {
  nowy:           'bg-fg/[0.07] text-subtle',
  kontakt:        'bg-info/15 text-info',
  zainteresowany: 'bg-amber/15 text-amber',
  pipeline:       'bg-accent/15 text-accent',
  nieaktywny:     'bg-fg/[0.05] text-subtle',
}

// ─── Shared style constants ───────────────────────────────────────────────────

const INPUT_CLS = 'w-full px-3 py-2 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all'
const INPUT_SM  = 'flex-1 px-3 py-2 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[12px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all'
const LABEL_CLS = 'block text-[10px] font-semibold text-subtle uppercase tracking-wide mb-1.5'
const BTN_CANCEL = 'flex-1 py-2.5 rounded-[10px] bg-fg/[0.04] border border-fg/[0.08] text-muted text-[13px] font-medium hover:bg-fg/[0.08] hover:text-fg disabled:opacity-40 transition-all'
const MODAL_SURFACE = 'relative z-10 w-full bg-sidebar border border-border rounded-[18px] overflow-hidden'
const MODAL_HDR = 'flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-sidebar z-10'
const SHADOW_RAISED = { boxShadow: 'var(--shadow-raised)' } as React.CSSProperties
const BTN_GLOW = { boxShadow: '0 2px 14px rgba(0,0,0,0.35), var(--glow-teal)' } as React.CSSProperties

// ─── Segment combobox ─────────────────────────────────────────────────────────

function SegmentCombobox({
  value, onChange, segments, segmentLabels, onAddSegment,
}: {
  value: string
  onChange: (v: string) => void
  segments: string[]
  segmentLabels: Record<string, string>
  onAddSegment: (key: string, label: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(segmentLabels[value] ?? value)

  const filtered = segments.filter(s =>
    (segmentLabels[s] ?? s).toLowerCase().includes(input.toLowerCase())
  )
  const canAdd = input.trim().length > 1 &&
    !segments.some(s => (segmentLabels[s] ?? s).toLowerCase() === input.trim().toLowerCase())

  const select = (key: string) => {
    onChange(key)
    setInput(segmentLabels[key] ?? key)
    setOpen(false)
  }

  const addNew = () => {
    const label = input.trim()
    const key = label.toLowerCase().replace(/\s+/g, '_')
    onAddSegment(key, label)
    onChange(key)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Wpisz lub wybierz branżę..."
          className="w-full px-3 py-2 pr-8 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all"
        />
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-sidebar border border-border rounded-[10px] overflow-hidden max-h-48 overflow-y-auto"
          style={SHADOW_RAISED}>
          {filtered.map(s => (
            <button key={s} onMouseDown={() => select(s)}
              className={`w-full text-left px-3 py-2 text-[12px] hover:bg-fg/[0.06] transition-colors ${s === value ? 'text-accent' : 'text-muted'}`}>
              {segmentLabels[s] ?? s}
            </button>
          ))}
          {canAdd && (
            <button onMouseDown={addNew}
              className="w-full text-left px-3 py-2 text-[12px] text-accent hover:bg-accent/10 transition-colors flex items-center gap-1.5 border-t border-border">
              <Plus size={11} /> Dodaj &quot;{input.trim()}&quot; jako nową branżę
            </button>
          )}
          {filtered.length === 0 && !canAdd && (
            <p className="px-3 py-2 text-[12px] text-subtle">Brak wyników</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────

function NewLeadModal({
  onClose, onAdd, onUpdate, segments, segmentLabels, onAddSegment,
}: {
  onClose: () => void
  onAdd: (lead: Lead) => Promise<Lead>
  onUpdate: (lead: Lead) => void
  segments: string[]
  segmentLabels: Record<string, string>
  onAddSegment: (key: string, label: string) => void
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '', position: '',
    email: '', phone: '', city: '', segment: 'usługi',
    website: '', linkedin: '', instagram: '',
  })
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<{ id: string; firstName: string; lastName: string; company: string } | null>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const doAdd = async () => {
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      firstName: form.firstName || 'Nowy',
      lastName: form.lastName || 'Lead',
      company: form.company || 'Firma',
      position: form.position || 'Manager',
      email: form.email || 'kontakt@firma.pl',
      phone: form.phone || '+48 000 000 000',
      city: form.city || 'Warszawa',
      segment: form.segment,
      aiScore: 50,
      aiLabel: 'warm',
      aiIcpScore: 0,
      aiSignalsScore: 0,
      aiActivityScore: 0,
      aiPotentialScore: 0,
      aiReasoning: '',
      aiScoredAt: null,
      status: 'nowy',
      lastContact: new Date().toISOString().slice(0, 10),
      problem: '',
      icebreaker: '',
      notes: undefined,
      website: form.website || undefined,
      linkedin: form.linkedin || undefined,
      instagram: form.instagram || undefined,
      outreachHistory: [],
    }

    setSaving(true)
    let savedLead: Lead
    try {
      savedLead = await onAdd(lead)
    } catch {
      setSaving(false)
      return
    }

    onClose()

    fetch('/api/ai/score-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: savedLead.id }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const result = data?.result
        if (!result) return
        onUpdate({
          ...savedLead,
          aiScore:          result.total_score    ?? 50,
          aiLabel:          result.label          ?? 'warm',
          aiIcpScore:       result.icp_score      ?? 0,
          aiSignalsScore:   result.signals_score  ?? 0,
          aiActivityScore:  result.activity_score ?? 0,
          aiPotentialScore: result.potential_score ?? 0,
          aiReasoning:      result.reasoning      ?? '',
          aiScoredAt:       new Date().toISOString(),
          problem:          result.problem    ?? '',
          icebreaker:       result.icebreaker ?? '',
        })
        toast.success(`AI scoring: ${savedLead.firstName} ${savedLead.lastName} — ${result.total_score}/100`)
      })
      .catch(() => {})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDemoMode()) {
      const supabase = createClient()
      const companyTrim = form.company.trim()
      const emailTrim = form.email.trim()
      if (companyTrim) {
        const { data: dupeData } = await supabase
          .from('leads')
          .select('id, first_name, last_name, company')
          .ilike('company', companyTrim)
          .limit(1)
        if (dupeData && dupeData.length > 0) {
          const d = dupeData[0] as Record<string, string>
          setDuplicate({ id: d.id, firstName: d.first_name, lastName: d.last_name, company: d.company })
          return
        }
      } else if (emailTrim) {
        const { data: dupeData } = await supabase
          .from('leads')
          .select('id, first_name, last_name, company')
          .eq('email', emailTrim)
          .limit(1)
        if (dupeData && dupeData.length > 0) {
          const d = dupeData[0] as Record<string, string>
          setDuplicate({ id: d.id, firstName: d.first_name, lastName: d.last_name, company: d.company })
          return
        }
      }
    }
    await doAdd()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(180px); opacity: 0; }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`${MODAL_SURFACE} max-w-[520px] max-h-[90vh] overflow-y-auto`} style={SHADOW_RAISED}>
        {duplicate && (
          <div className="absolute inset-0 z-20 bg-sidebar/97 rounded-[18px] flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber/10 border border-amber/25 flex items-center justify-center">
              <AlertCircle size={22} className="text-amber" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-fg">Lead już istnieje</p>
              <p className="text-[12px] text-muted mt-1 leading-relaxed">
                Lead <span className="text-fg/70 font-semibold">{duplicate.firstName} {duplicate.lastName}</span>{' '}
                z firmy <span className="text-fg/70 font-semibold">{duplicate.company}</span> jest już w systemie.
              </p>
            </div>
            <div className="flex gap-2 w-full max-w-[280px]">
              <button onClick={() => setDuplicate(null)} className={BTN_CANCEL}>Anuluj</button>
              <button
                onClick={() => { setDuplicate(null); doAdd() }}
                className="flex-1 py-2.5 rounded-[10px] bg-amber/15 border border-amber/30 text-amber text-[13px] font-semibold hover:bg-amber/25 transition-all"
              >
                Dodaj mimo to
              </button>
            </div>
          </div>
        )}

        {saving && (
          <div className="absolute inset-0 z-20 bg-sidebar/97 rounded-[18px] flex flex-col items-center justify-center gap-5">
            <div className="relative w-[72px] h-[72px]">
              <div className="w-full h-full rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center">
                <Brain size={28} className="text-accent" style={{ animation: 'scanPulse 1.4s ease-in-out infinite' }} />
              </div>
              <div
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent rounded-full"
                style={{ top: 0, animation: 'scanLine 1.4s ease-in-out infinite' }}
              />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-fg">Zapisuję i skanuję leada…</p>
              <p className="text-[12px] text-muted mt-1">AI analizuje profil i oblicza scoring</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent"
                  style={{ animation: `scanPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div className={MODAL_HDR}>
          <div>
            <p className="text-[15px] font-bold text-fg">Dodaj lead</p>
            <p className="text-[11px] text-muted mt-0.5">Lead zostanie zapisany i automatycznie oceniony przez AI</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Imię *</label>
              <input value={form.firstName} onChange={set('firstName')} required placeholder="Jan" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Nazwisko *</label>
              <input value={form.lastName} onChange={set('lastName')} required placeholder="Kowalski" className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Firma *</label>
              <input value={form.company} onChange={set('company')} required placeholder="Nazwa firmy" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Stanowisko</label>
              <input value={form.position} onChange={set('position')} placeholder="CEO / Owner" className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Email</label>
              <input value={form.email} onChange={set('email')} type="email" placeholder="jan@firma.pl" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Telefon</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+48 500 000 000" className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Miasto</label>
              <input value={form.city} onChange={set('city')} placeholder="Warszawa" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Branża / Segment</label>
              <SegmentCombobox value={form.segment} onChange={v => setForm(f => ({ ...f, segment: v }))}
                segments={segments} segmentLabels={segmentLabels} onAddSegment={onAddSegment} />
            </div>
          </div>

          <div className="pt-1 border-t border-border">
            <p className="text-[10px] font-semibold text-subtle uppercase tracking-wide mb-3">Social media & strona (do AI skanowania)</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-subtle flex-shrink-0" />
                <input value={form.website} onChange={set('website')} placeholder="strona.pl" className={INPUT_SM} />
              </div>
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
                <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/jankowalski" className={INPUT_SM} />
              </div>
              <div className="flex items-center gap-2">
                <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
                <input value={form.instagram} onChange={set('instagram')} placeholder="instagram.com/jankowalski" className={INPUT_SM} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-subtle">AI automatycznie przeskanuje leada i obliczy scoring na podstawie Twojej Bazy Wiedzy</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className={BTN_CANCEL}>Anuluj</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={BTN_GLOW}>
              {saving ? <><Loader2 size={13} className="animate-spin" />Zapisuję...</> : 'Dodaj i skanuj AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DM Generator Modal ───────────────────────────────────────────────────────

const DM_TYPES = [
  { id: 'connection_request', label: 'Zaproszenie LinkedIn', delay: 'Dzień 1' },
  { id: 'dm1_icebreaker',    label: 'DM #1 – Icebreaker',  delay: 'Dzień 1' },
  { id: 'fu1_case_study',    label: 'FU #1 – Case study',  delay: '+3 dni' },
  { id: 'fu2_calendar',      label: 'FU #2 – Kalendarz',   delay: '+5 dni' },
  { id: 'fu3_social_proof',  label: 'FU #3 – Social proof',delay: '+3 dni' },
  { id: 'fu4_direct_ask',    label: 'FU #4 – Direct ask',  delay: '+5 dni' },
  { id: 'fu5_breakup',       label: 'FU #5 – Breakup',     delay: '+7 dni' },
  { id: 'post_offer_48h',    label: 'Po ofercie (48h)',     delay: '+2 dni' },
  { id: 'reengagement_90d',  label: 'Re-engagement (90d)', delay: '+90 dni' },
]

function DMModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [msgType, setMsgType] = useState('dm1_icebreaker')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Array<{ message: string; notes: string } | null>>([null, null])
  const [copied, setCopied] = useState<number | null>(null)

  const buildPayload = () => ({
    messageType: msgType,
    context: context || undefined,
    leadData: {
      first_name: lead.firstName,
      last_name: lead.lastName,
      company: lead.company,
      position: lead.position,
      industry: lead.segment,
      linkedin_url: lead.linkedin,
      company_website: lead.website,
      buying_signal: lead.problem,
    },
  })

  const generate = async () => {
    setLoading(true)
    setVariants([null, null])
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/ai/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) }),
        fetch('/api/ai/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...buildPayload(), context: (context ? context + ' ' : '') + '[wariant alternatywny, inne sformułowanie]' }) }),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      if (d1.error) throw new Error(d1.error)
      setVariants([d1.result, d2.result ?? d1.result])
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Błąd generowania')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (idx: number) => {
    const v = variants[idx]
    if (!v) return
    await navigator.clipboard.writeText(v.message)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Wiadomość skopiowana')
  }

  const hasResults = variants.some(v => v !== null)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`${MODAL_SURFACE} max-w-[560px] max-h-[90vh] overflow-y-auto`} style={SHADOW_RAISED}>
        <div className={MODAL_HDR}>
          <div>
            <p className="text-[15px] font-bold text-fg">Generuj DM — 2 warianty</p>
            <p className="text-[11px] text-muted mt-0.5">{lead.firstName} {lead.lastName} · {lead.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={LABEL_CLS}>Typ wiadomości — sekwencja</label>
            <div className="grid grid-cols-2 gap-2">
              {DM_TYPES.map(t => (
                <button key={t.id} onClick={() => setMsgType(t.id)}
                  className={`px-3 py-2 rounded-[8px] text-[11px] font-medium text-left transition-all flex items-center justify-between gap-2 ${msgType === t.id ? 'bg-accent/20 border border-accent/40 text-accent' : 'bg-fg/[0.04] border border-fg/[0.08] text-muted hover:text-fg'}`}>
                  <span>{t.label}</span>
                  <span className={`text-[9px] font-semibold flex-shrink-0 ${msgType === t.id ? 'text-accent/70' : 'text-subtle'}`}>{t.delay}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Dodatkowy kontekst (opcjonalne)</label>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={2}
              placeholder="np. widział post o automatyzacji, skomentował reel..."
              className="w-full px-3 py-2 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[12px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all resize-none" />
          </div>

          <button onClick={generate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-accent hover:opacity-90 disabled:opacity-60 text-white text-[13px] font-bold transition-all"
            style={BTN_GLOW}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Generuję 2 warianty...</> : <><Send size={14} /> Generuj 2 warianty</>}
          </button>

          {hasResults && (
            <div className="space-y-4">
              {variants.map((v, idx) => v && (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-accent uppercase tracking-wide">Wariant {idx === 0 ? 'A' : 'B'}</span>
                    <button onClick={() => copy(idx)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-fg/[0.05] border border-fg/[0.09] text-muted text-[10px] font-medium hover:bg-fg/[0.09] hover:text-fg transition-all">
                      {copied === idx ? <><CheckCircle2 size={11} className="text-success" /> Skopiowano</> : <>Kopiuj</>}
                    </button>
                  </div>
                  <div className="p-4 rounded-[10px] bg-accent/[0.06] border border-accent/20">
                    <pre className="text-[13px] text-fg/80 whitespace-pre-wrap font-sans leading-relaxed">{v.message}</pre>
                  </div>
                  {v.notes && <p className="text-[11px] text-muted italic">{v.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

function NoteModal({ lead, onSave, onClose }: { lead: Lead; onSave: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState(lead.notes ?? '')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`${MODAL_SURFACE} max-w-[400px]`} style={SHADOW_RAISED}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <p className="text-[15px] font-bold text-fg">Notatka</p>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={5}
            placeholder="Dodaj notatkę o leadzie, wyniki rozmowy, status..."
            className="w-full px-3 py-2.5 rounded-[10px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all resize-none" />
          <div className="flex gap-2">
            <button onClick={onClose} className={BTN_CANCEL}>Anuluj</button>
            <button onClick={() => { onSave(note); onClose() }}
              className="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 transition-all"
              style={BTN_GLOW}>
              Zapisz notatkę
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Lead Modal ──────────────────────────────────────────────────────────

function EditLeadModal({
  lead, onClose, onSave, onDelete, segments, segmentLabels, onAddSegment,
}: {
  lead: Lead
  onClose: () => void
  onSave: (updated: Lead) => Promise<void>
  onDelete: (id: string) => Promise<void>
  segments: string[]
  segmentLabels: Record<string, string>
  onAddSegment: (key: string, label: string) => void
}) {
  const [form, setForm] = useState({
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company,
    position: lead.position,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    segment: lead.segment,
    website: lead.website ?? '',
    linkedin: lead.linkedin ?? '',
    instagram: lead.instagram ?? '',
    notes: lead.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const updated: Lead = {
      ...lead,
      firstName: form.firstName || lead.firstName,
      lastName: form.lastName || lead.lastName,
      company: form.company || lead.company,
      position: form.position || lead.position,
      email: form.email || lead.email,
      phone: form.phone || lead.phone,
      city: form.city || lead.city,
      segment: form.segment,
      website: form.website || undefined,
      linkedin: form.linkedin || undefined,
      instagram: form.instagram || undefined,
      notes: form.notes || undefined,
    }
    await onSave(updated)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(lead.id)
    setDeleting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`${MODAL_SURFACE} max-w-[520px] max-h-[90vh] overflow-y-auto`} style={SHADOW_RAISED}>
        <div className={MODAL_HDR}>
          <div>
            <p className="text-[15px] font-bold text-fg">Edytuj lead</p>
            <p className="text-[11px] text-muted mt-0.5">{lead.firstName} {lead.lastName} · {lead.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all"><X size={16} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLS}>Imię</label><input value={form.firstName} onChange={set('firstName')} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>Nazwisko</label><input value={form.lastName} onChange={set('lastName')} className={INPUT_CLS} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLS}>Firma</label><input value={form.company} onChange={set('company')} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>Stanowisko</label><input value={form.position} onChange={set('position')} className={INPUT_CLS} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLS}>Email</label><input value={form.email} onChange={set('email')} type="email" className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>Telefon</label><input value={form.phone} onChange={set('phone')} className={INPUT_CLS} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLS}>Miasto</label><input value={form.city} onChange={set('city')} className={INPUT_CLS} /></div>
            <div>
              <label className={LABEL_CLS}>Branża</label>
              <SegmentCombobox value={form.segment} onChange={v => setForm(f => ({ ...f, segment: v }))}
                segments={segments} segmentLabels={segmentLabels} onAddSegment={onAddSegment} />
            </div>
          </div>
          <div className="space-y-2.5">
            <label className={LABEL_CLS}>Social & strona</label>
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-subtle flex-shrink-0" />
              <input value={form.website} onChange={set('website')} placeholder="strona.pl" className={INPUT_SM} />
            </div>
            <div className="flex items-center gap-2">
              <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
              <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/..." className={INPUT_SM} />
            </div>
            <div className="flex items-center gap-2">
              <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
              <input value={form.instagram} onChange={set('instagram')} placeholder="instagram.com/..." className={INPUT_SM} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Notatka</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Notatki, obserwacje..."
              className="w-full px-3 py-2 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg text-[12px] placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleDelete} disabled={deleting}
              className={`px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 ${confirmDelete ? 'bg-danger text-white hover:opacity-90' : 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20'}`}>
              <Trash2 size={13} />
              {deleting ? 'Usuwanie…' : confirmDelete ? 'Potwierdź usunięcie' : 'Usuń lead'}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 transition-all disabled:opacity-60"
              style={BTN_GLOW}>
              {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Lead scan panel ──────────────────────────────────────────────────────────

function LeadScanPanel({ lead, onScanned }: { lead: Lead; onScanned: (data: Partial<Lead>) => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!!lead.aiScoredAt)

  const scan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          leadData: {
            first_name: lead.firstName,
            last_name:  lead.lastName,
            company:    lead.company,
            position:   lead.position,
            industry:   lead.segment,
            linkedin_url:    lead.linkedin,
            company_website: lead.website,
            segment:    lead.segment,
            notes:      lead.notes ?? '',
          },
        }),
      })
      const { result } = await res.json()
      if (result) {
        onScanned({
          aiScore:          result.total_score    ?? lead.aiScore,
          aiLabel:          result.label          ?? lead.aiLabel,
          aiIcpScore:       result.icp_score      ?? 0,
          aiSignalsScore:   result.signals_score  ?? 0,
          aiActivityScore:  result.activity_score ?? 0,
          aiPotentialScore: result.potential_score ?? 0,
          aiReasoning:      result.reasoning      ?? '',
          aiScoredAt:       new Date().toISOString(),
          problem:          result.problem    ?? lead.problem,
          icebreaker:       result.icebreaker ?? lead.icebreaker,
        })
        setDone(true)
        toast.success(`Lead oceniony: ${result.total_score}/100`)
      }
    } catch {
      toast.error('Błąd skanowania AI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 rounded-[10px] bg-accent/[0.05] border border-accent/20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Brain size={14} className={done ? 'text-success' : 'text-accent'} />
        <div>
          <p className="text-[12px] font-semibold text-fg">{done ? 'Lead przeskanowany' : 'Skanowanie AI'}</p>
          <p className="text-[10px] text-muted">{done ? 'Scoring i icebreaker gotowe' : 'Analizuje profil, branżę i dopasowanie ICP'}</p>
        </div>
      </div>
      {!done && (
        <button onClick={scan} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent hover:opacity-90 disabled:opacity-60 text-white text-[11px] font-bold transition-all flex-shrink-0"
          style={BTN_GLOW}>
          {loading ? <><Loader2 size={11} className="animate-spin" /> Skanuję...</> : <><Brain size={11} /> Skanuj</>}
        </button>
      )}
    </div>
  )
}

// ─── Lead detail panel ────────────────────────────────────────────────────────

function LeadPanel({
  lead, onClose, onUpdate, onDelete, segments, segmentLabels, onAddSegment,
}: {
  lead: Lead
  onClose: () => void
  onUpdate: (updated: Lead) => Promise<void>
  onDelete: (id: string) => Promise<void>
  segments: string[]
  segmentLabels: Record<string, string>
  onAddSegment: (key: string, label: string) => void
}) {
  const [currentLead, setCurrentLead] = useState(lead)
  const [showDM, setShowDM] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const { services: allServices } = useServices()
  const initials = (currentLead.firstName[0] ?? '') + (currentLead.lastName[0] ?? '')

  const toggleServiceForLead = async (serviceId: string) => {
    const current = currentLead.service_ids ?? []
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId]
    await update({ service_ids: updated })
  }

  const update = useCallback(async (partial: Partial<Lead>) => {
    const updated = { ...currentLead, ...partial }
    setCurrentLead(updated)
    await onUpdate(updated)
  }, [currentLead, onUpdate])

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full sm:max-w-[480px] h-full bg-sidebar sm:border-l border-border overflow-y-auto"
          style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.45)' }}>

          {/* Header */}
          <div className="sticky top-0 bg-sidebar/95 backdrop-blur border-b border-border p-5 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-accent/20 flex items-center justify-center text-[15px] font-bold text-accent">
                {initials}
              </div>
              <div>
                <p className="text-[15px] font-bold text-fg">{currentLead.firstName} {currentLead.lastName}</p>
                <p className="text-[12px] text-muted">{currentLead.position} · {currentLead.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-[8px] text-subtle hover:text-accent hover:bg-accent/10 transition-all" title="Edytuj lead">
                <Pencil size={15} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-[8px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all"><X size={16} /></button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Score + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <ScoreBadge label={currentLead.aiLabel} score={currentLead.aiScore} />
              <span className="px-2.5 py-1 rounded-full bg-fg/[0.07] text-muted text-[11px] font-semibold">
                {segmentLabels[currentLead.segment] ?? currentLead.segment}
              </span>
              <div className="relative">
                <button onClick={() => setStatusOpen(v => !v)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${STATUS_COLORS[currentLead.status]}`}>
                  {STATUS_LABELS[currentLead.status]} <ChevronDown size={10} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-sidebar border border-border rounded-[10px] z-20 overflow-hidden min-w-[140px]"
                    style={SHADOW_RAISED}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button key={k} onClick={() => { void update({ status: k as Lead['status'] }); setStatusOpen(false) }}
                        className="w-full text-left px-3 py-2 text-[12px] text-muted hover:bg-fg/[0.06] transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Scan */}
            <LeadScanPanel lead={currentLead} onScanned={partial => void update(partial)} />

            {/* Contact info */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-subtle uppercase tracking-wide">Dane kontaktowe</p>
              {[
                { icon: Mail, value: currentLead.email, href: `mailto:${currentLead.email}` },
                { icon: Phone, value: currentLead.phone, href: `tel:${currentLead.phone}` },
                ...(currentLead.website ? [{ icon: Globe, value: currentLead.website, href: `https://${currentLead.website.replace(/^https?:\/\//, '')}` }] : []),
                { icon: Calendar, value: `Ostatni kontakt: ${new Date(currentLead.lastContact).toLocaleDateString('pl-PL')}`, href: undefined as string | undefined },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon size={13} className="text-subtle flex-shrink-0" />
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent hover:text-fg transition-colors truncate">{item.value}</a>
                  ) : (
                    <span className="text-[12px] text-muted">{item.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Social media */}
            {(currentLead.linkedin || currentLead.instagram) && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-subtle uppercase tracking-wide">Social media</p>
                {currentLead.linkedin && (
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
                    <a href={`https://${currentLead.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-accent hover:text-fg transition-colors truncate">{currentLead.linkedin}</a>
                  </div>
                )}
                {currentLead.instagram && (
                  <div className="flex items-center gap-2">
                    <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
                    <a href={`https://${currentLead.instagram.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-accent hover:text-fg transition-colors truncate">{currentLead.instagram}</a>
                  </div>
                )}
              </div>
            )}

            {/* AI Scoring breakdown */}
            <div className="p-4 rounded-[12px] bg-raised border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-semibold text-accent">AI Scoring Breakdown</p>
                <span className="text-[18px] font-bold text-fg">{currentLead.aiScore}<span className="text-[12px] text-muted">/100</span></span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Dopasowanie do ICP',  value: currentLead.aiIcpScore,       color: 'var(--accent)' },
                  { label: 'Sygnały zakupowe',    value: currentLead.aiSignalsScore,   color: 'var(--c-amber)' },
                  { label: 'Aktywność online',    value: currentLead.aiActivityScore,  color: 'var(--c-green)' },
                  { label: 'Potencjał projektu',  value: currentLead.aiPotentialScore, color: 'var(--c-violet)' },
                ].map(c => (
                  <div key={c.label}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted">{c.label}</span>
                      <span className="font-semibold" style={{ color: c.color }}>{c.value}/25</span>
                    </div>
                    <div className="h-1 bg-fg/[0.07] rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.value / 25) * 100)}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
              {currentLead.problem && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-subtle uppercase tracking-wide mb-1">Zidentyfikowany problem</p>
                  <p className="text-[12px] text-muted leading-relaxed">{currentLead.problem}</p>
                </div>
              )}
              {currentLead.icebreaker && (
                <div className="mt-2">
                  <p className="text-[10px] text-subtle uppercase tracking-wide mb-1">Icebreaker AI</p>
                  <p className="text-[12px] text-accent/80 leading-relaxed italic">&quot;{currentLead.icebreaker}&quot;</p>
                </div>
              )}
              {currentLead.aiScoredAt && (
                <p className="mt-2 text-[10px] text-subtle">
                  Oceniono: {new Date(currentLead.aiScoredAt).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              )}
            </div>

            {/* Outreach history */}
            {currentLead.outreachHistory.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-subtle uppercase tracking-wide mb-2">Historia outreach</p>
                <div className="space-y-2">
                  {currentLead.outreachHistory.map((h, i) => (
                    <div key={i} className="flex gap-3 p-2.5 rounded-[8px] bg-raised border border-border-s">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-accent">{h.type}</span>
                          <span className="text-[10px] text-subtle">{new Date(h.date).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="text-[12px] text-muted">{h.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {currentLead.notes && (
              <div className="p-3 rounded-[10px] bg-raised border border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Notatka</p>
                  <button onClick={() => setShowNote(true)} className="text-[10px] text-accent hover:text-fg transition-colors">Edytuj</button>
                </div>
                <p className="text-[12px] text-muted">{currentLead.notes}</p>
              </div>
            )}

            {/* Services */}
            {allServices.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-subtle uppercase tracking-wide mb-2">Przypisane usługi</p>
                <div className="flex flex-wrap gap-1.5">
                  {allServices.map(s => {
                    const assigned = (currentLead.service_ids ?? []).includes(s.id)
                    return (
                      <button key={s.id} onClick={() => void toggleServiceForLead(s.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          assigned
                            ? 'bg-violet/20 border-violet/40 text-violet'
                            : 'bg-fg/[0.04] border-fg/[0.08] text-subtle hover:border-fg/20 hover:text-muted'
                        }`}>
                        {assigned ? <Check size={9} className="inline mr-1" /> : null}{s.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => { void update({ status: 'pipeline' }); toast.success(`${currentLead.firstName} przeniesiony do pipeline`) }}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-fg/[0.04] border border-fg/[0.07] text-muted text-[11px] font-medium hover:bg-accent/15 hover:border-accent/30 hover:text-accent transition-all">
                <TrendingUp size={12} /> Pipeline
              </button>
              <button
                onClick={() => setShowDM(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-accent/15 border border-accent/30 text-accent text-[11px] font-medium hover:bg-accent/25 transition-all">
                <MessageSquare size={12} /> Generuj DM
              </button>
              <button
                onClick={() => setShowNote(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-fg/[0.04] border border-fg/[0.07] text-muted text-[11px] font-medium hover:bg-fg/[0.08] hover:text-fg transition-all">
                <StickyNote size={12} /> Notatka
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-fg/[0.04] border border-fg/[0.07] text-muted text-[11px] font-medium hover:bg-fg/[0.08] hover:text-fg transition-all">
                <Pencil size={12} /> Edytuj lead
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDM && <DMModal lead={currentLead} onClose={() => setShowDM(false)} />}
      {showNote && (
        <NoteModal
          lead={currentLead}
          onSave={note => { void update({ notes: note }); toast.success('Notatka zapisana') }}
          onClose={() => setShowNote(false)}
        />
      )}
      {showEdit && (
        <EditLeadModal
          lead={currentLead}
          onClose={() => setShowEdit(false)}
          onSave={async (updated) => {
            setCurrentLead(updated)
            await onUpdate(updated)
          }}
          onDelete={async (id) => {
            await onDelete(id)
            onClose()
          }}
          segments={segments}
          segmentLabels={segmentLabels}
          onAddSegment={onAddSegment}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [segments, setSegments] = useState<string[]>(DEFAULT_SEGMENTS)
  const [segmentLabels, setSegmentLabels] = useState<Record<string, string>>(DEFAULT_SEGMENT_LABELS)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegment] = useState<string>('all')
  const [scoreFilter, setScore] = useState<string>('all')
  const [statusFilter, setStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('default')
  const [selectedLead, setSelected] = useState<Lead | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showNewLead, setShowNewLead] = useState(false)
  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    toast.loading('Importuję CSV…', { id: 'csv-import' })

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
        let imported = 0, skipped = 0
        const toInsert: Record<string, unknown>[] = []

        for (const row of rows) {
          try {
            const dbRow: Record<string, unknown> = {}
            for (const [csvKey, value] of Object.entries(row)) {
              const dbKey = CSV_COL_MAP[csvKey] ?? csvKey
              const v = (value ?? '').trim()
              if (v === '') continue
              if (CSV_JSON_COLS.has(dbKey)) {
                try { dbRow[dbKey] = JSON.parse(v) } catch { dbRow[dbKey] = v }
              } else if (CSV_NUM_COLS.has(dbKey)) {
                const n = Number(v); if (!isNaN(n)) dbRow[dbKey] = n
              } else {
                dbRow[dbKey] = v
              }
            }
            if (!dbRow.first_name && !dbRow.company) { skipped++; continue }
            if (!dbRow.id) delete dbRow.id
            toInsert.push(dbRow)
          } catch { skipped++ }
        }

        if (toInsert.length === 0) {
          toast.error('Brak prawidłowych wierszy do importu', { id: 'csv-import' })
          setImporting(false)
          return
        }

        const supabase = createClient()
        for (let i = 0; i < toInsert.length; i += 50) {
          const chunk = toInsert.slice(i, i + 50)
          const { error } = await supabase.from('leads').upsert(chunk, { onConflict: 'id' })
          if (error) { console.error('import chunk error:', error); skipped += chunk.length }
          else imported += chunk.length
        }

        const { data } = await supabase.from('leads').select('*').order('last_contact', { ascending: false })
        if (data) setLeads(data.map(r => dbToLead(r as Record<string, unknown>)))

        toast.success(
          `Zaimportowano ${imported} leadów${skipped ? `, pominięto ${skipped}` : ''}`,
          { id: 'csv-import', duration: 5000 },
        )
        setImporting(false)
      },
      error: () => {
        toast.error('Błąd parsowania CSV', { id: 'csv-import' })
        setImporting(false)
      },
    })
  }, [])

  useEffect(() => {
    if (isDemoMode()) {
      setLeads(DEMO_LEADS as unknown as Lead[])
      return
    }
    const supabase = createClient()
    let query = supabase.from('leads').select('*').order('last_contact', { ascending: false })
    if (isSalesUser()) {
      const u = getCurrentUser()
      if (u) query = query.eq('assigned_to', u.id)
    }
    query.then(({ data, error }) => {
      if (error) console.error('leads fetch error:', error)
      if (data) setLeads(data.map(r => dbToLead(r as Record<string, unknown>)))
    })
    const { keys, labels } = loadSegments()
    setSegments(keys)
    setSegmentLabels(labels)
  }, [])

  const addLead = useCallback(async (lead: Lead): Promise<Lead> => {
    const supabase = createClient()
    const salesUser = isSalesUser() ? getCurrentUser() : null
    const insertPayload = salesUser
      ? { ...leadToDb(lead), assigned_to: salesUser.id }
      : leadToDb(lead)
    const { data, error } = await supabase.from('leads').insert(insertPayload).select().single()
    if (error) {
      console.error('Błąd zapisu leada:', error)
      toast.error('Nie udało się zapisać leada: ' + error.message)
      throw error
    }
    const saved = dbToLead(data as Record<string, unknown>)
    setLeads(prev => [saved, ...prev])
    toast.success('Lead zapisany!')
    return saved
  }, [])

  const updateLead = useCallback(async (updated: Lead) => {
    const supabase = createClient()
    const { error } = await supabase.from('leads').update(leadToDb(updated)).eq('id', updated.id)
    if (error) {
      console.error('Błąd aktualizacji leada:', error)
      toast.error('Nie udało się zaktualizować leada: ' + error.message)
      return
    }
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setSelected(updated)
  }, [])

  const deleteLead = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      toast.error('Nie udało się usunąć leada: ' + error.message)
      return
    }
    setLeads(prev => prev.filter(l => l.id !== id))
    setSelected(null)
    toast.success('Lead usunięty')
  }, [])

  const handleAddSegment = useCallback((key: string, label: string) => {
    const updated = saveSegment(key, label)
    setSegments(updated.keys)
    setSegmentLabels(updated.labels)
  }, [])

  const filtered = useMemo(() => {
    const LABEL_ORDER: Record<string, number> = { hot: 0, warm: 1, cold: 2 }
    const arr = leads.filter(l => {
      const q = search.toLowerCase()
      if (q && !`${l.firstName} ${l.lastName} ${l.company}`.toLowerCase().includes(q)) return false
      if (segmentFilter !== 'all' && l.segment !== segmentFilter) return false
      if (scoreFilter !== 'all' && l.aiLabel !== scoreFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      return true
    })
    if (sortBy === 'score_desc') return [...arr].sort((a, b) => b.aiScore - a.aiScore)
    if (sortBy === 'score_asc')  return [...arr].sort((a, b) => a.aiScore - b.aiScore)
    if (sortBy === 'hot_first')  return [...arr].sort((a, b) => LABEL_ORDER[a.aiLabel] - LABEL_ORDER[b.aiLabel])
    if (sortBy === 'warm_first') return [...arr].sort((a, b) => (a.aiLabel === 'warm' ? -1 : b.aiLabel === 'warm' ? 1 : 0))
    if (sortBy === 'cold_first') return [...arr].sort((a, b) => (a.aiLabel === 'cold' ? -1 : b.aiLabel === 'cold' ? 1 : 0))
    return arr
  }, [search, segmentFilter, scoreFilter, statusFilter, sortBy, leads])

  const hasActiveFilters = segmentFilter !== 'all' || scoreFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'default'

  const SELECT_CLS = 'px-3 py-1.5 rounded-[8px] bg-bg border border-fg/[0.08] text-fg text-[12px] focus:outline-none focus:border-accent/50'

  return (
    <div className="max-w-[1400px] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-fg">Leady</h1>
          <p className="text-[12px] text-muted mt-0.5">{filtered.length} z {leads.length} leadów</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.09] text-muted text-[12px] font-medium hover:bg-fg/[0.09] hover:text-fg disabled:opacity-40 transition-all"
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Import CSV
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.09] text-muted text-[12px] font-medium hover:bg-fg/[0.09] hover:text-fg disabled:opacity-40 transition-all"
          >
            <Download size={13} /> Eksport CSV
          </button>
          <button
            onClick={() => setShowNewLead(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-semibold hover:bg-accent/20 transition-all"
          >
            + Dodaj lead
          </button>
        </div>
      </div>

      {/* Search + Filters toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj leadów..."
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-fg/[0.04] border border-fg/[0.08] text-fg placeholder:text-muted text-[13px] focus:outline-none focus:border-accent/50 transition-all" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-all ${showFilters ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-fg/[0.04] border-fg/[0.08] text-muted hover:text-fg'}`}
          style={showFilters ? BTN_GLOW : undefined}>
          <SlidersHorizontal size={13} /> Filtry
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold">!</span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-[12px] bg-raised border border-border">
          <div>
            <label className="block text-[10px] text-subtle uppercase tracking-wide mb-1">Segment</label>
            <select value={segmentFilter} onChange={e => setSegment(e.target.value)} className={SELECT_CLS}>
              <option value="all">Wszystkie</option>
              {segments.map(s => <option key={s} value={s}>{segmentLabels[s] ?? s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-subtle uppercase tracking-wide mb-1">AI Score</label>
            <select value={scoreFilter} onChange={e => setScore(e.target.value)} className={SELECT_CLS}>
              <option value="all">Wszystkie</option>
              <option value="hot">Hot 🔥</option>
              <option value="warm">Warm 🌡️</option>
              <option value="cold">Cold ❄️</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-subtle uppercase tracking-wide mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)} className={SELECT_CLS}>
              <option value="all">Wszystkie</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-subtle uppercase tracking-wide mb-1 flex items-center gap-1"><ArrowUpDown size={10} />Sortuj</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={SELECT_CLS}>
              <option value="default">Domyślnie</option>
              <option value="hot_first">Hot najpierw 🔥</option>
              <option value="warm_first">Warm najpierw 🌡️</option>
              <option value="cold_first">Cold najpierw ❄️</option>
              <option value="score_desc">Wynik: od najwyższego</option>
              <option value="score_asc">Wynik: od najniższego</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={() => { setSegment('all'); setScore('all'); setStatus('all'); setSortBy('default') }}
              className="self-end flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-fg/[0.04] border border-fg/[0.07] text-muted text-[12px] hover:text-fg transition-all">
              <X size={12} /> Wyczyść
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_110px_90px_80px_80px] gap-4 px-4 py-2.5 border-b border-border text-[10px] font-semibold text-subtle uppercase tracking-wide">
          <span>Lead</span>
          <span className="hidden md:block">Firma / Stanowisko</span>
          <span className="hidden lg:block">Segment</span>
          <span>AI Score</span>
          <span className="hidden sm:block">Status</span>
          <span className="hidden md:block">Kontakt</span>
        </div>

        <div className="divide-y divide-fg/[0.04]">
          {filtered.map(lead => {
            const initials = (lead.firstName[0] ?? '') + (lead.lastName[0] ?? '')
            return (
              <button key={lead.id} onClick={() => setSelected(lead)}
                className="w-full grid grid-cols-[1fr_140px_110px_90px_80px_80px] gap-4 px-4 py-3 hover:bg-fg/[0.03] transition-all text-left group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[8px] bg-accent/20 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-fg truncate">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[11px] text-muted truncate md:hidden">{lead.company}</p>
                  </div>
                </div>
                <div className="hidden md:flex flex-col justify-center min-w-0">
                  <p className="text-[12px] text-fg/70 truncate">{lead.company}</p>
                  <p className="text-[11px] text-subtle truncate">{lead.position}</p>
                </div>
                <div className="hidden lg:flex items-center">
                  <span className="px-2 py-0.5 rounded-full bg-fg/[0.06] text-muted text-[10px] font-medium">
                    {segmentLabels[lead.segment] ?? lead.segment}
                  </span>
                </div>
                <div className="flex items-center"><ScoreBadge label={lead.aiLabel} score={lead.aiScore} /></div>
                <div className="hidden sm:flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="text-[11px] text-subtle">
                    {new Date(lead.lastContact).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {leads.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-[14px] text-muted font-medium">Brak leadów w bazie</p>
            <p className="text-[12px] text-subtle">Kliknij &quot;+ Dodaj lead&quot; aby dodać pierwszego leada</p>
          </div>
        )}
        {leads.length > 0 && filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-muted">
            Brak leadów spełniających kryteria
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          onClose={() => setSelected(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
          segments={segments}
          segmentLabels={segmentLabels}
          onAddSegment={handleAddSegment}
        />
      )}

      {showNewLead && (
        <NewLeadModal
          onClose={() => setShowNewLead(false)}
          onAdd={addLead}
          onUpdate={updateLead}
          segments={segments}
          segmentLabels={segmentLabels}
          onAddSegment={handleAddSegment}
        />
      )}
    </div>
  )
}
