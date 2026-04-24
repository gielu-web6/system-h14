'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search, X, Flame, Thermometer, Snowflake,
  Phone, Mail, Globe, Calendar, Check,
  MessageSquare, TrendingUp, SlidersHorizontal, CheckCircle2,
  Download, Link2, Share2, Brain, Plus, Loader2,
  Send, StickyNote, ChevronDown, Pencil, Trash2, ArrowUpDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useServices } from '@/hooks/useServices'
import { isDemoMode } from '@/lib/userStore'
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
    first_name: lead.firstName,
    last_name: lead.lastName,
    company: lead.company,
    position: lead.position,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    segment: lead.segment,
    ai_score_num: lead.aiScore,
    ai_score_label: lead.aiLabel,
    app_status: lead.status,
    last_contact: lead.lastContact,
    ai_problem: lead.problem,
    ai_icebreaker: lead.icebreaker,
    company_website: lead.website ?? null,
    linkedin_url: lead.linkedin ?? null,
    instagram_url: lead.instagram ?? null,
    notes: lead.notes ?? null,
    scan_data: lead.scanData ?? null,
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
      <Flame size={9} />{score}
    </span>
  )
  if (label === 'warm') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold">
      <Thermometer size={9} />{score}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
      <Snowflake size={9} />{score}
    </span>
  )
}

const STATUS_LABELS: Record<string, string> = {
  nowy: 'Nowy', kontakt: 'Kontakt', zainteresowany: 'Zainteresowany',
  pipeline: 'W pipeline', nieaktywny: 'Nieaktywny',
}
const STATUS_COLORS: Record<string, string> = {
  nowy: 'bg-white/[0.07] text-white/40',
  kontakt: 'bg-blue-500/15 text-blue-400',
  zainteresowany: 'bg-amber-500/15 text-amber-400',
  pipeline: 'bg-[#6366f1]/15 text-[#a5b4fc]',
  nieaktywny: 'bg-white/[0.05] text-white/25',
}

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
          className="w-full px-3 py-2 pr-8 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all"
        />
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#1A1A2E] border border-white/[0.1] rounded-[10px] shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} onMouseDown={() => select(s)}
              className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/[0.06] transition-colors ${s === value ? 'text-[#a5b4fc]' : 'text-white/70'}`}>
              {segmentLabels[s] ?? s}
            </button>
          ))}
          {canAdd && (
            <button onMouseDown={addNew}
              className="w-full text-left px-3 py-2 text-[12px] text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors flex items-center gap-1.5 border-t border-white/[0.06]">
              <Plus size={11} /> Dodaj &quot;{input.trim()}&quot; jako nową branżę
            </button>
          )}
          {filtered.length === 0 && !canAdd && (
            <p className="px-3 py-2 text-[12px] text-white/30">Brak wyników</p>
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
  const [saved, setSaved] = useState(false)
  const [scanning, setScanning] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    let savedLead: Lead
    try {
      savedLead = await onAdd(lead)
    } catch {
      return
    }
    setSaved(true)

    // Trigger AI scoring in background
    setScanning(true)
    try {
      const res = await fetch('/api/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: {
            first_name: savedLead.firstName,
            last_name: savedLead.lastName,
            company: savedLead.company,
            position: savedLead.position,
            industry: form.segment,
            linkedin_url: form.linkedin,
            company_website: form.website,
            segment: form.segment,
            notes: '',
          },
        }),
      })
      if (res.ok) {
        const { result } = await res.json()
        if (result) {
          const updatedLead: Lead = {
            ...savedLead,
            aiScore: result.total_score ?? 50,
            aiLabel: result.label ?? 'warm',
            problem: result.problem ?? '',
            icebreaker: result.icebreaker ?? '',
          }
          onUpdate(updatedLead)
          toast.success(`Lead ${savedLead.firstName} ${savedLead.lastName} oceniony: ${result.total_score}/100`)
        }
      }
    } catch {
      // silent fail
    } finally {
      setScanning(false)
    }

    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-[#0F0F1A] z-10">
          <div>
            <p className="text-[15px] font-bold text-white">Dodaj lead</p>
            <p className="text-[11px] text-white/40 mt-0.5">Lead zostanie zapisany i automatycznie oceniony przez AI</p>
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
            <p className="text-[15px] font-semibold text-white">Lead zapisany!</p>
            {scanning ? (
              <div className="flex items-center gap-2 text-[12px] text-white/40">
                <Loader2 size={12} className="animate-spin" /> AI scoring w toku...
              </div>
            ) : (
              <p className="text-[12px] text-white/40">AI scoring zakończony</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Imię *</label>
                <input value={form.firstName} onChange={set('firstName')} required placeholder="Jan"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Nazwisko *</label>
                <input value={form.lastName} onChange={set('lastName')} required placeholder="Kowalski"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Firma *</label>
                <input value={form.company} onChange={set('company')} required placeholder="Nazwa firmy"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Stanowisko</label>
                <input value={form.position} onChange={set('position')} placeholder="CEO / Owner"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Email</label>
                <input value={form.email} onChange={set('email')} type="email" placeholder="jan@firma.pl"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Telefon</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+48 500 000 000"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Miasto</label>
                <input value={form.city} onChange={set('city')} placeholder="Warszawa"
                  className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Branża / Segment</label>
                <SegmentCombobox
                  value={form.segment}
                  onChange={v => setForm(f => ({ ...f, segment: v }))}
                  segments={segments}
                  segmentLabels={segmentLabels}
                  onAddSegment={onAddSegment}
                />
              </div>
            </div>

            {/* Social / web */}
            <div className="pt-1 border-t border-white/[0.06]">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide mb-3">Social media & strona (do AI skanowania)</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-white/25 flex-shrink-0" />
                  <input value={form.website} onChange={set('website')} placeholder="strona.pl"
                    className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
                  <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/jankowalski"
                    className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
                  <input value={form.instagram} onChange={set('instagram')} placeholder="instagram.com/jankowalski"
                    className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-white/25">AI automatycznie przeskanuje leada i obliczy scoring na podstawie Twojej Bazy Wiedzy</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                Anuluj
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all shadow-lg shadow-indigo-500/25">
                Dodaj i skanuj AI
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── DM Generator Modal ───────────────────────────────────────────────────────

const DM_TYPES = [
  { id: 'connection_request', label: 'Zaproszenie LinkedIn' },
  { id: 'dm1_icebreaker', label: 'DM #1 – Icebreaker' },
  { id: 'fu1_case_study', label: 'Follow-up z case study' },
  { id: 'fu2_calendar', label: 'Follow-up z kalendarzem' },
  { id: 'post_offer_48h', label: 'Follow-up po ofercie (48h)' },
  { id: 'reengagement_90d', label: 'Re-engagement (90 dni)' },
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
      <div className="relative z-10 w-full max-w-[560px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-[#0F0F1A] z-10">
          <div>
            <p className="text-[15px] font-bold text-white">Generuj DM — 2 warianty</p>
            <p className="text-[11px] text-white/40 mt-0.5">{lead.firstName} {lead.lastName} · {lead.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Typ wiadomości</label>
            <div className="grid grid-cols-2 gap-2">
              {DM_TYPES.map(t => (
                <button key={t.id} onClick={() => setMsgType(t.id)}
                  className={`px-3 py-2 rounded-[8px] text-[11px] font-medium text-left transition-all ${msgType === t.id ? 'bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#a5b4fc]' : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Dodatkowy kontekst (opcjonalne)</label>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={2}
              placeholder="np. widział post o automatyzacji, skomentował reel..."
              className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none" />
          </div>

          <button onClick={generate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[13px] font-bold transition-all">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Generuję 2 warianty...</> : <><Send size={14} /> Generuj 2 warianty</>}
          </button>

          {hasResults && (
            <div className="space-y-4">
              {variants.map((v, idx) => v && (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#a5b4fc] uppercase tracking-wide">Wariant {idx === 0 ? 'A' : 'B'}</span>
                    <button onClick={() => copy(idx)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[10px] font-medium hover:bg-white/[0.09] hover:text-white transition-all">
                      {copied === idx ? <><CheckCircle2 size={11} className="text-green-400" /> Skopiowano</> : <>Kopiuj</>}
                    </button>
                  </div>
                  <div className="p-4 rounded-[10px] bg-[#6366f1]/[0.07] border border-[#6366f1]/20">
                    <pre className="text-[13px] text-white/80 whitespace-pre-wrap font-sans leading-relaxed">{v.message}</pre>
                  </div>
                  {v.notes && <p className="text-[11px] text-white/40 italic">{v.notes}</p>}
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
      <div className="relative z-10 w-full max-w-[400px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <p className="text-[15px] font-bold text-white">Notatka</p>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={5}
            placeholder="Dodaj notatkę o leadzie, wyniki rozmowy, status..."
            className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none" />
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
              Anuluj
            </button>
            <button onClick={() => { onSave(note); onClose() }}
              className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all">
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

  const inputCls = 'w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] sticky top-0 bg-[#0F0F1A] z-10">
          <div>
            <p className="text-[15px] font-bold text-white">Edytuj lead</p>
            <p className="text-[11px] text-white/40 mt-0.5">{lead.firstName} {lead.lastName} · {lead.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Imię</label>
              <input value={form.firstName} onChange={set('firstName')} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Nazwisko</label>
              <input value={form.lastName} onChange={set('lastName')} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Firma</label>
              <input value={form.company} onChange={set('company')} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Stanowisko</label>
              <input value={form.position} onChange={set('position')} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Email</label>
              <input value={form.email} onChange={set('email')} type="email" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Telefon</label>
              <input value={form.phone} onChange={set('phone')} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Miasto</label>
              <input value={form.city} onChange={set('city')} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Branża</label>
              <SegmentCombobox
                value={form.segment}
                onChange={v => setForm(f => ({ ...f, segment: v }))}
                segments={segments}
                segmentLabels={segmentLabels}
                onAddSegment={onAddSegment}
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide">Social & strona</label>
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-white/25 flex-shrink-0" />
              <input value={form.website} onChange={set('website')} placeholder="strona.pl" className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
              <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/..." className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
              <input value={form.instagram} onChange={set('instagram')} placeholder="instagram.com/..." className="flex-1 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Notatka</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Notatki, obserwacje..."
              className="w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleDelete} disabled={deleting}
              className={`px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 ${confirmDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'}`}>
              <Trash2 size={13} />
              {deleting ? 'Usuwanie…' : confirmDelete ? 'Potwierdź usunięcie' : 'Usuń lead'}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60">
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
  const [done, setDone] = useState(!!lead.problem)

  const scan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: {
            first_name: lead.firstName,
            last_name: lead.lastName,
            company: lead.company,
            position: lead.position,
            industry: lead.segment,
            linkedin_url: lead.linkedin,
            company_website: lead.website,
            segment: lead.segment,
            notes: lead.notes ?? '',
          },
        }),
      })
      const { result } = await res.json()
      if (result) {
        onScanned({
          aiScore: result.total_score ?? lead.aiScore,
          aiLabel: result.label ?? lead.aiLabel,
          problem: result.problem ?? lead.problem,
          icebreaker: result.icebreaker ?? lead.icebreaker,
        })
        setDone(true)
        toast.success('Lead przeskanowany przez AI!')
      }
    } catch {
      toast.error('Błąd skanowania AI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 rounded-[10px] bg-[#6366f1]/[0.05] border border-[#6366f1]/20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Brain size={14} className={done ? 'text-green-400' : 'text-[#6366f1]'} />
        <div>
          <p className="text-[12px] font-semibold text-white">{done ? 'Lead przeskanowany' : 'Skanowanie AI'}</p>
          <p className="text-[10px] text-white/40">{done ? 'Scoring i icebreaker gotowe' : 'Analizuje profil, branżę i dopasowanie ICP'}</p>
        </div>
      </div>
      {!done && (
        <button onClick={scan} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[11px] font-bold transition-all flex-shrink-0">
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
        <div className="relative z-10 w-full sm:max-w-[480px] h-full bg-[#0F0F1A] sm:border-l border-white/[0.08] overflow-y-auto shadow-2xl">

          {/* Header */}
          <div className="sticky top-0 bg-[#0F0F1A]/95 backdrop-blur border-b border-white/[0.07] p-5 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-[#6366f1]/20 flex items-center justify-center text-[15px] font-bold text-[#6366f1]">
                {initials}
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">{currentLead.firstName} {currentLead.lastName}</p>
                <p className="text-[12px] text-white/40">{currentLead.position} · {currentLead.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-[8px] text-white/40 hover:text-[#a5b4fc] hover:bg-[#6366f1]/10 transition-all" title="Edytuj lead">
                <Pencil size={15} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Score + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <ScoreBadge label={currentLead.aiLabel} score={currentLead.aiScore} />
              <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 text-[11px] font-semibold">
                {segmentLabels[currentLead.segment] ?? currentLead.segment}
              </span>
              <div className="relative">
                <button onClick={() => setStatusOpen(v => !v)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${STATUS_COLORS[currentLead.status]}`}>
                  {STATUS_LABELS[currentLead.status]} <ChevronDown size={10} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-[#1A1A2E] border border-white/[0.1] rounded-[10px] shadow-2xl z-20 overflow-hidden min-w-[140px]">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button key={k} onClick={() => { void update({ status: k as Lead['status'] }); setStatusOpen(false) }}
                        className="w-full text-left px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.06] transition-colors">
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
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Dane kontaktowe</p>
              {[
                { icon: Mail, value: currentLead.email, href: `mailto:${currentLead.email}` },
                { icon: Phone, value: currentLead.phone, href: `tel:${currentLead.phone}` },
                ...(currentLead.website ? [{ icon: Globe, value: currentLead.website, href: `https://${currentLead.website.replace(/^https?:\/\//, '')}` }] : []),
                { icon: Calendar, value: `Ostatni kontakt: ${new Date(currentLead.lastContact).toLocaleDateString('pl-PL')}`, href: undefined as string | undefined },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon size={13} className="text-white/30 flex-shrink-0" />
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#a5b4fc] hover:text-white transition-colors truncate">{item.value}</a>
                  ) : (
                    <span className="text-[12px] text-white/60">{item.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Social media */}
            {(currentLead.linkedin || currentLead.instagram) && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Social media</p>
                {currentLead.linkedin && (
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-blue-400/60 flex-shrink-0" />
                    <a href={`https://${currentLead.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-[#a5b4fc] hover:text-white transition-colors truncate">{currentLead.linkedin}</a>
                  </div>
                )}
                {currentLead.instagram && (
                  <div className="flex items-center gap-2">
                    <Share2 size={13} className="text-pink-400/60 flex-shrink-0" />
                    <a href={`https://${currentLead.instagram.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-[#a5b4fc] hover:text-white transition-colors truncate">{currentLead.instagram}</a>
                  </div>
                )}
              </div>
            )}

            {/* AI Scoring breakdown */}
            <div className="p-4 rounded-[12px] bg-[#6366f1]/[0.07] border border-[#6366f1]/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-semibold text-[#a5b4fc]">AI Scoring Breakdown</p>
                <span className="text-[18px] font-bold text-white">{currentLead.aiScore}<span className="text-[12px] text-white/40">/100</span></span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Dopasowanie do ICP', value: Math.round(currentLead.aiScore * 0.28) },
                  { label: 'Sygnały zakupowe', value: Math.round(currentLead.aiScore * 0.26) },
                  { label: 'Aktywność online', value: Math.round(currentLead.aiScore * 0.24) },
                  { label: 'Potencjał projektu', value: Math.round(currentLead.aiScore * 0.22) },
                ].map(c => (
                  <div key={c.label}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-white/50">{c.label}</span>
                      <span className="text-white/70">{c.value}/25</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full">
                      <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${Math.min(100, (c.value / 25) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {currentLead.problem && (
                <div className="mt-3 pt-3 border-t border-white/[0.07]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Zidentyfikowany problem</p>
                  <p className="text-[12px] text-white/70 leading-relaxed">{currentLead.problem}</p>
                </div>
              )}
              {currentLead.icebreaker && (
                <div className="mt-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Icebreaker AI</p>
                  <p className="text-[12px] text-[#a5b4fc]/80 leading-relaxed italic">&quot;{currentLead.icebreaker}&quot;</p>
                </div>
              )}
            </div>

            {/* Outreach history */}
            {currentLead.outreachHistory.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Historia outreach</p>
                <div className="space-y-2">
                  {currentLead.outreachHistory.map((h, i) => (
                    <div key={i} className="flex gap-3 p-2.5 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] flex-shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-[#a5b4fc]">{h.type}</span>
                          <span className="text-[10px] text-white/30">{new Date(h.date).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="text-[12px] text-white/60">{h.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {currentLead.notes && (
              <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Notatka</p>
                  <button onClick={() => setShowNote(true)} className="text-[10px] text-[#a5b4fc] hover:text-white transition-colors">Edytuj</button>
                </div>
                <p className="text-[12px] text-white/65">{currentLead.notes}</p>
              </div>
            )}

            {/* Services */}
            {allServices.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Przypisane usługi</p>
                <div className="flex flex-wrap gap-1.5">
                  {allServices.map(s => {
                    const assigned = (currentLead.service_ids ?? []).includes(s.id)
                    return (
                      <button key={s.id} onClick={() => void toggleServiceForLead(s.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          assigned
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60'
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
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/55 text-[11px] font-medium hover:bg-[#6366f1]/15 hover:border-[#6366f1]/30 hover:text-[#a5b4fc] transition-all">
                <TrendingUp size={12} /> Pipeline
              </button>
              <button
                onClick={() => setShowDM(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[11px] font-medium hover:bg-[#6366f1]/25 transition-all">
                <MessageSquare size={12} /> Generuj DM
              </button>
              <button
                onClick={() => setShowNote(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/55 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
                <StickyNote size={12} /> Notatka
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/55 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
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

  useEffect(() => {
    if (isDemoMode()) {
      setLeads(DEMO_LEADS as unknown as Lead[])
      return
    }
    const supabase = createClient()
    supabase.from('leads').select('*').order('last_contact', { ascending: false }).then(({ data }) => {
      if (data) setLeads(data.map(r => dbToLead(r as Record<string, unknown>)))
    })
    const { keys, labels } = loadSegments()
    setSegments(keys)
    setSegmentLabels(labels)
  }, [])

  const addLead = useCallback(async (lead: Lead): Promise<Lead> => {
    const supabase = createClient()
    const { data, error } = await supabase.from('leads').insert(leadToDb(lead)).select().single()
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

  return (
    <div className="max-w-[1400px] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white">Leady</h1>
          <p className="text-[12px] text-white/40 mt-0.5">{filtered.length} z {leads.length} leadów</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/50 text-[12px] font-medium hover:bg-white/[0.09] hover:text-white disabled:opacity-40 transition-all"
          >
            <Download size={13} /> Eksport CSV
          </button>
          <button
            onClick={() => setShowNewLead(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/20 transition-all"
          >
            + Dodaj lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj leadów..."
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-all ${showFilters ? 'bg-[#6366f1]/15 border-[#6366f1]/40 text-[#a5b4fc]' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white'}`}>
          <SlidersHorizontal size={13} /> Filtry
          {(segmentFilter !== 'all' || scoreFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'default') && (
            <span className="w-4 h-4 rounded-full bg-[#6366f1] text-white text-[9px] flex items-center justify-center font-bold">!</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1">Segment</label>
            <select value={segmentFilter} onChange={e => setSegment(e.target.value)}
              className="px-3 py-1.5 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#6366f1]/50">
              <option value="all">Wszystkie</option>
              {segments.map(s => <option key={s} value={s}>{segmentLabels[s] ?? s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1">AI Score</label>
            <select value={scoreFilter} onChange={e => setScore(e.target.value)}
              className="px-3 py-1.5 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#6366f1]/50">
              <option value="all">Wszystkie</option>
              <option value="hot">Hot 🔥</option>
              <option value="warm">Warm 🌡️</option>
              <option value="cold">Cold ❄️</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#6366f1]/50">
              <option value="all">Wszystkie</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1 flex items-center gap-1"><ArrowUpDown size={10} />Sortuj</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-[8px] bg-[#1A1A2E] border border-white/[0.08] text-white text-[12px] focus:outline-none focus:border-[#6366f1]/50">
              <option value="default">Domyślnie</option>
              <option value="hot_first">Hot najpierw 🔥</option>
              <option value="warm_first">Warm najpierw 🌡️</option>
              <option value="cold_first">Cold najpierw ❄️</option>
              <option value="score_desc">Wynik: od najwyższego</option>
              <option value="score_asc">Wynik: od najniższego</option>
            </select>
          </div>
          {(segmentFilter !== 'all' || scoreFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'default') && (
            <button onClick={() => { setSegment('all'); setScore('all'); setStatus('all'); setSortBy('default') }}
              className="self-end flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/50 text-[12px] hover:text-white transition-all">
              <X size={12} /> Wyczyść
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_110px_90px_80px_80px] gap-4 px-4 py-2.5 border-b border-white/[0.07] text-[10px] font-semibold text-white/30 uppercase tracking-wide">
          <span>Lead</span>
          <span className="hidden md:block">Firma / Stanowisko</span>
          <span className="hidden lg:block">Segment</span>
          <span>AI Score</span>
          <span className="hidden sm:block">Status</span>
          <span className="hidden md:block">Kontakt</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.map(lead => {
            const initials = (lead.firstName[0] ?? '') + (lead.lastName[0] ?? '')
            return (
              <button key={lead.id} onClick={() => setSelected(lead)}
                className="w-full grid grid-cols-[1fr_140px_110px_90px_80px_80px] gap-4 px-4 py-3 hover:bg-white/[0.03] transition-all text-left group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[8px] bg-[#6366f1]/20 flex items-center justify-center text-[11px] font-bold text-[#6366f1] flex-shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[11px] text-white/40 truncate md:hidden">{lead.company}</p>
                  </div>
                </div>
                <div className="hidden md:flex flex-col justify-center min-w-0">
                  <p className="text-[12px] text-white/70 truncate">{lead.company}</p>
                  <p className="text-[11px] text-white/35 truncate">{lead.position}</p>
                </div>
                <div className="hidden lg:flex items-center">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 text-[10px] font-medium">
                    {segmentLabels[lead.segment] ?? lead.segment}
                  </span>
                </div>
                <div className="flex items-center"><ScoreBadge label={lead.aiLabel} score={lead.aiScore} /></div>
                <div className="hidden sm:flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="text-[11px] text-white/35">
                    {new Date(lead.lastContact).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {leads.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-[14px] text-white/40 font-medium">Brak leadów w bazie</p>
            <p className="text-[12px] text-white/25">Kliknij &quot;+ Dodaj lead&quot; aby dodać pierwszego leada</p>
          </div>
        )}
        {leads.length > 0 && filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-white/30">
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
