'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Loader2, Copy, Check, Edit3, Save, X,
  Globe, Zap, Star, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Brain, Users, Search,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'

interface LeadOption {
  id: string
  company: string
  first_name: string
  last_name: string
  position: string | null
  company_website: string | null
  app_status: string | null
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExpertVariant {
  message: string
  expert: {
    id: string
    name: string
    title: string
    strategy: string
    borderColor: string
  }
}

interface IcpResult {
  score: number
  fit: 'hot' | 'warm' | 'cold'
  reason: string
  pain_point: string
}

interface GenerateResult {
  variants: {
    kennedy: ExpertVariant
    belfort: ExpertVariant
    hormozi: ExpertVariant
  }
  icp: IcpResult | null
  _demo?: boolean
  _brainUsed?: boolean
  _brainComplete?: boolean
}

type Channel = 'linkedin' | 'email' | 'whatsapp'

const CHANNEL_OPTIONS: { id: Channel; label: string; desc: string }[] = [
  { id: 'linkedin', label: 'LinkedIn DM', desc: '5-6 zdań' },
  { id: 'email',    label: 'Cold Email',  desc: 'do 150 słów' },
  { id: 'whatsapp', label: 'WhatsApp',    desc: '3-4 zdania' },
]

const inputCls = `w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
  text-white placeholder:text-white/25 text-[13px]
  focus:outline-none focus:border-[#E8A838]/50 focus:bg-[#E8A838]/[0.02]
  transition-all`

// ─── ICP Score Badge ───────────────────────────────────────────────────────────

function IcpBadge({ fit }: { fit: 'hot' | 'warm' | 'cold' }) {
  if (fit === 'hot')  return <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">Hot ICP</span>
  if (fit === 'warm') return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">Warm ICP</span>
  return <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">Cold ICP</span>
}

// ─── Expert Card ───────────────────────────────────────────────────────────────

function ExpertCard({
  variant,
  label,
  loading,
  brainUsed,
}: {
  variant: ExpertVariant | null
  label: string
  loading: boolean
  brainUsed?: boolean
}) {
  const [copied, setCopied]         = useState(false)
  const [editing, setEditing]       = useState(false)
  const [editText, setEditText]     = useState('')
  const [savedText, setSavedText]   = useState<string | null>(null)

  const displayMessage = savedText ?? variant?.message ?? ''

  const startEdit = () => {
    setEditText(displayMessage)
    setEditing(true)
  }

  const saveEdit = () => {
    setSavedText(editText)
    setEditing(false)
  }

  const handleCopy = async () => {
    const text = editing ? editText : displayMessage
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const borderColor = variant?.expert.borderColor ?? '#E8A838'
  const expertName  = variant?.expert.name  ?? label
  const expertTitle = variant?.expert.title ?? ''
  const strategy    = variant?.expert.strategy ?? ''

  return (
    <div
      className="rounded-[14px] bg-card border border-border overflow-hidden flex flex-col"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: `${borderColor}15`, color: borderColor }}
          >
            <Star size={10} />
            {expertName}
          </div>
          <span className="text-[10px] text-white/30 font-medium">{expertTitle}</span>
        </div>
        {strategy && (
          <p className="text-[11px] text-white/35 italic mt-1.5 leading-relaxed">{strategy}</p>
        )}
      </div>

      {/* Message */}
      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex items-center gap-2.5 py-6 justify-center">
            <Loader2 size={14} className="animate-spin text-white/30" />
            <span className="text-[12px] text-white/30">Generuję…</span>
          </div>
        ) : editing ? (
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 rounded-[8px] bg-raised border border-border text-[13px] text-white/85 leading-relaxed resize-none focus:outline-none focus:border-[#E8A838]/40 font-mono text-[12px]"
            autoFocus
          />
        ) : displayMessage ? (
          <pre className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap font-sans bg-raised p-3 rounded-[8px] border border-border">
            {displayMessage}
          </pre>
        ) : (
          <div className="flex items-center justify-center py-8 text-white/20 text-[12px]">
            Brak wiadomości
          </div>
        )}
      </div>

      {/* Actions */}
      {!loading && displayMessage && (
        <div className="px-4 pb-3 flex items-center gap-2 justify-end">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] hover:text-white transition-all"
              >
                <X size={11} /> Anuluj
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#E8A838]/10 border border-[#E8A838]/30 text-[#E8A838] text-[11px] hover:bg-[#E8A838]/20 transition-all"
              >
                <Save size={11} /> Zapisz
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <Edit3 size={11} /> Edytuj
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.1] text-white/50 text-[11px] hover:text-white hover:bg-white/[0.1] transition-all"
              >
                {copied
                  ? <><Check size={11} className="text-green-400" /> Skopiowano</>
                  : <><Copy size={11} /> Kopiuj</>
                }
              </button>
            </>
          )}
        </div>
      )}

      {/* Brain attribution */}
      {!loading && displayMessage && (
        <div className="px-4 pb-3 pt-0 border-t border-white/[0.05] mt-1 flex items-center gap-1.5">
          <Brain size={10} className={brainUsed ? 'text-[#E8A838]/60' : 'text-white/20'} />
          <span className="text-[10px] text-white/30">
            {brainUsed
              ? 'Wygenerowano na bazie profilu prospekta + DNA firmy'
              : 'Wygenerowano na bazie danych prospekta'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Lead Picker ───────────────────────────────────────────────────────────────

function LeadPicker({ onSelect }: { onSelect: (lead: LeadOption) => void }) {
  const [query, setQuery]       = useState('')
  const [leads, setLeads]       = useState<LeadOption[]>([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<LeadOption | null>(null)
  const containerRef            = useRef<HTMLDivElement>(null)

  const fetchLeads = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      let qb = supabase
        .from('leads')
        .select('id, company, first_name, last_name, position, company_website, app_status')
        .order('last_contact', { ascending: false })
        .limit(50)
      if (q.trim()) {
        qb = qb.ilike('company', `%${q.trim()}%`)
      }
      const { data } = await qb
      setLeads(data ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchLeads(query)
  }, [open, query, fetchLeads])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (lead: LeadOption) => {
    setSelected(lead)
    setOpen(false)
    setQuery('')
    onSelect(lead)
  }

  const statusColor: Record<string, string> = {
    nowy:    '#60a5fa',
    kontakt: '#E8A838',
    negocjacje: '#a78bfa',
    klient:  '#4ade80',
    odrzucony: '#f87171',
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
        <Users size={10} className="inline mr-1 mb-0.5" />
        Wybierz lead z bazy
      </label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-left transition-all hover:border-[#E8A838]/40 focus:outline-none focus:border-[#E8A838]/50"
      >
        <span className={`text-[13px] ${selected ? 'text-white' : 'text-white/25'}`}>
          {selected
            ? `${selected.company}${selected.first_name ? ` · ${selected.first_name} ${selected.last_name}` : ''}`
            : 'Wyszukaj firmę lub decydenta…'
          }
        </span>
        <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-[12px] bg-[#1A1A1F] border border-white/[0.1] shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.06]">
              <Search size={12} className="text-white/30 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie firmy…"
                className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/25 focus:outline-none"
              />
              {loading && <Loader2 size={11} className="animate-spin text-white/30" />}
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {leads.length === 0 && !loading && (
              <p className="text-[12px] text-white/30 text-center py-6">Brak leadów</p>
            )}
            {leads.map(lead => (
              <button
                key={lead.id}
                type="button"
                onClick={() => handleSelect(lead)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left border-b border-white/[0.04] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{lead.company}</p>
                  {(lead.first_name || lead.position) && (
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(' ')}
                      {lead.position && <span className="text-white/25"> · {lead.position}</span>}
                    </p>
                  )}
                  {lead.company_website && (
                    <p className="text-[10px] text-white/25 mt-0.5 truncate">{lead.company_website}</p>
                  )}
                </div>
                {lead.app_status && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: `${statusColor[lead.app_status] ?? '#6b7280'}18`,
                      color: statusColor[lead.app_status] ?? '#6b7280',
                    }}
                  >
                    {lead.app_status}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OutreachGeneratorPage() {
  const [companyName, setCompanyName]           = useState('')
  const [decisionMakerName, setDecisionMakerName] = useState('')
  const [decisionMakerRole, setDecisionMakerRole] = useState('')
  const [websiteUrl, setWebsiteUrl]             = useState('')
  const [industry, setIndustry]                 = useState('')
  const [observations, setObservations]         = useState('')
  const [channel, setChannel]                   = useState<Channel>('linkedin')

  const [generating, setGenerating]             = useState(false)
  const [result, setResult]                     = useState<GenerateResult | null>(null)
  const [dmSentState, setDmSentState]           = useState<'idle' | 'sending' | 'done'>('idle')

  const [urlAnalyzing, setUrlAnalyzing]         = useState(false)
  const [showIcp, setShowIcp]                   = useState(true)

  const urlInputRef = useRef<HTMLInputElement>(null)

  const canGenerate = companyName.trim().length >= 2 && !generating

  // ── Lead Picker ──────────────────────────────────────────────────────────────

  const handleLeadSelect = (lead: LeadOption) => {
    setCompanyName(lead.company ?? '')
    setDecisionMakerName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
    setDecisionMakerRole(lead.position ?? '')
    setWebsiteUrl(lead.company_website ?? '')
  }

  // ── Quick Fill ───────────────────────────────────────────────────────────────

  const handleAnalyzeUrl = async () => {
    const url = websiteUrl.trim()
    if (!url) {
      urlInputRef.current?.focus()
      toast.error('Wklej URL strony firmy')
      return
    }
    setUrlAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.result) {
        if (data.result.companyName && !companyName.trim()) setCompanyName(data.result.companyName)
        if (data.result.industry)     setIndustry(data.result.industry)
        if (data.result.observations) setObservations(prev => prev ? prev : data.result.observations)
        toast.success('Formularz uzupełniony z analizy strony')
      } else {
        toast.error(data.error ?? 'Nie udało się przeanalizować strony')
      }
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setUrlAnalyzing(false)
    }
  }

  // ── Generate ─────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          decisionMakerName: decisionMakerName.trim() || undefined,
          decisionMakerRole: decisionMakerRole.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          industry: industry.trim() || undefined,
          observations: observations.trim() || undefined,
          channel,
        }),
      })
      const data = await res.json()
      if (data.variants) {
        setResult(data)
        setShowIcp(true)
        setDmSentState('idle')
      } else {
        toast.error(data.error ?? 'Błąd generowania')
      }
    } catch {
      toast.error('Błąd połączenia z AI')
    } finally {
      setGenerating(false)
    }
  }

  // ── DM Sent → Pipeline ───────────────────────────────────────────────────────

  const handleDmSent = async () => {
    if (!companyName.trim() || dmSentState !== 'idle') return
    if (isDemoMode()) {
      toast('Tryb demo — zapis pominięty', { icon: '🔒' })
      setDmSentState('done')
      return
    }
    setDmSentState('sending')
    try {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)
      const name = companyName.trim()
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .ilike('company', name)
        .limit(1)
        .single()
      if (existing) {
        await supabase
          .from('leads')
          .update({ app_status: 'kontakt', last_contact: today })
          .eq('id', existing.id)
        toast.success(`${name} → Pipeline (Kontakt) ✓`)
      } else {
        const nameParts = decisionMakerName.trim().split(' ')
        await supabase.from('leads').insert({
          company:         name,
          first_name:      nameParts[0] || '',
          last_name:       nameParts.slice(1).join(' ') || '',
          position:        decisionMakerRole.trim() || null,
          company_website: websiteUrl.trim() || null,
          app_status:      'kontakt',
          last_contact:    today,
          ai_score_num:    50,
          ai_score_label:  'warm',
          segment:         'usługi',
          outreach_history: [],
        })
        toast.success(`Nowy lead: ${name} → Pipeline ✓`)
      }
      setDmSentState('done')
    } catch {
      toast.error('Błąd podczas aktualizacji leada')
      setDmSentState('idle')
    }
  }

  return (
    <div className="max-w-[1100px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white flex items-center gap-2.5">
            <Send size={20} className="text-[#E8A838]" />
            Outreach Generator
          </h1>
          <p className="text-[12px] text-white/40 mt-1">
            Podaj dane firmy — 3 eksperci wygenerują równolegle 3 różne podejścia do cold outreach.
          </p>
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="bg-card border border-border rounded-[14px] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-[#E8A838]" />
          <p className="text-[13px] font-semibold text-white">Sekwencja follow-up — 5 punktów kontaktu</p>
          <span className="px-2 py-0.5 rounded-full bg-[#E8A838]/10 text-[#E8A838] text-[10px] font-bold">DEFAULT</span>
        </div>
        <div className="flex items-start gap-0 overflow-x-auto pb-1">
          {[
            { step: 'DM #1',  label: 'Icebreaker',    delay: 'Dzień 1',   angle: 'Personalizacja + ból',       color: '#E8A838' },
            { step: 'FU #1',  label: 'Case Study',    delay: '+3 dni',    angle: 'Dowód z podobnej branży',     color: '#60a5fa' },
            { step: 'FU #2',  label: 'Kalendarz',     delay: '+5 dni',    angle: 'Mały krok — 15 min',          color: '#60a5fa' },
            { step: 'FU #3',  label: 'Social Proof',  delay: '+3 dni',    angle: 'Inny klient / cytat',         color: '#a78bfa' },
            { step: 'FU #4',  label: 'Direct Ask',    delay: '+5 dni',    angle: 'Pytanie o decyzję + pilność', color: '#f87171' },
            { step: 'FU #5',  label: 'Breakup',       delay: '+7 dni',    angle: 'Zamknięcie tematu',           color: '#6b7280' },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex items-start flex-shrink-0">
              <div className="flex flex-col items-center w-[110px]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black mb-2 flex-shrink-0"
                  style={{ background: s.color }}
                >
                  {i + 1}
                </div>
                <p className="text-[10px] font-bold text-white text-center leading-tight">{s.step}</p>
                <p className="text-[9px] text-white/50 text-center mt-0.5">{s.label}</p>
                <span className="text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">{s.delay}</span>
                <p className="text-[9px] text-white/30 text-center mt-1.5 leading-snug px-1">{s.angle}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="w-6 flex-shrink-0 mt-4 border-t border-dashed border-white/[0.12]" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/25 mt-3">
          Generuj pierwszą wiadomość poniżej. Follow-upy generujesz z poziomu karty leada w zakładce Leady lub Pipeline.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-[16px] p-6 space-y-5">

        {/* Lead Picker */}
        <LeadPicker onSelect={handleLeadSelect} />

        <div className="border-t border-white/[0.06]" />

        {/* Row 1: Company + Decision Maker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Nazwa firmy <span className="text-[#E8A838]">*</span>
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="np. MediaFlow Agency"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Imię i nazwisko decydenta
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="np. Piotr Nowak"
              value={decisionMakerName}
              onChange={e => setDecisionMakerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Stanowisko
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="np. CEO / Founder / Właściciel"
              value={decisionMakerRole}
              onChange={e => setDecisionMakerRole(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: URL + Industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              URL strony firmowej
            </label>
            <div className="flex gap-2">
              <input
                ref={urlInputRef}
                type="text"
                className={inputCls + ' flex-1'}
                placeholder="https://firma.pl"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
              />
              <button
                onClick={handleAnalyzeUrl}
                disabled={urlAnalyzing}
                title="Przeanalizuj stronę i uzupełnij formularz"
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#E8A838]/10 border border-[#E8A838]/25 text-[#E8A838] text-[11px] font-semibold hover:bg-[#E8A838]/20 transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {urlAnalyzing
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Globe size={13} />
                }
                {urlAnalyzing ? 'Analizuję…' : 'Quick Fill'}
              </button>
            </div>
            {!websiteUrl && (
              <p className="text-[10px] text-white/25 mt-1 flex items-center gap-1">
                <AlertCircle size={9} />
                Dla lepszych wyników dodaj URL strony
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Branża / typ firmy
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="np. agencja marketingowa, firma IT, kancelaria"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
            />
          </div>
        </div>

        {/* Row 3: Observations */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
            Twoje obserwacje <span className="text-white/20 font-normal normal-case">(opcjonalnie — daje wiadomościom konkretny kontekst)</span>
          </label>
          <textarea
            className={inputCls}
            rows={3}
            placeholder="np. &quot;Nie mają chatbota&quot;, &quot;Niedawno zatrudnili handlowca&quot;, &quot;Chwalili się wzrostem na LinkedIn&quot;, &quot;Brak sekcji case studies na stronie&quot;"
            value={observations}
            onChange={e => setObservations(e.target.value)}
          />
        </div>

        {/* Row 4: Channel */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Kanał wysyłki
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] border text-[12px] font-semibold transition-all ${
                  channel === ch.id
                    ? 'bg-[#E8A838]/15 border-[#E8A838]/40 text-[#E8A838]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/80'
                }`}
              >
                {ch.label}
                <span className={`text-[10px] ${channel === ch.id ? 'text-[#E8A838]/70' : 'text-white/25'}`}>{ch.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-[12px] bg-[#E8A838] hover:bg-[#C47D1A] disabled:opacity-40 disabled:cursor-not-allowed text-black text-[14px] font-bold transition-all shadow-lg shadow-[#E8A838]/15"
        >
          {generating
            ? <>
                <Loader2 size={16} className="animate-spin" />
                Konsultuję ekspertów…
              </>
            : <>
                <Zap size={16} />
                Generuj 3 warianty
              </>
          }
        </button>
      </div>

      {/* Loading cards skeleton */}
      {generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {['Dan Kennedy', 'Jordan Belfort', 'Alex Hormozi'].map((name, i) => (
            <ExpertCard key={i} variant={null} label={name} loading={true} />
          ))}
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <>
          {/* Demo banner */}
          {result._demo && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>Tryb demo — wiadomości są przykładowe. Dodaj <code className="bg-white/10 px-1 py-0.5 rounded text-[11px]">ANTHROPIC_API_KEY</code> aby generować spersonalizowane teksty.</span>
            </div>
          )}

          {/* Brain incomplete warning — hidden in demo mode */}
          {!result._demo && !result._brainUsed && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <Brain size={13} className="flex-shrink-0" />
              <span>
                Company Brain nie jest uzupełniony — jakość outputu będzie niższa.{' '}
                <Link href="/company-brain/dna" className="underline underline-offset-2 hover:text-amber-300 transition-colors">
                  Uzupełnij teraz →
                </Link>
              </span>
            </div>
          )}
          {!result._demo && result._brainUsed && !result._brainComplete && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <Brain size={13} className="flex-shrink-0" />
              <span>
                Company Brain jest uzupełniony częściowo — dodanie więcej danych poprawi trafność wiadomości.{' '}
                <Link href="/company-brain/dna" className="underline underline-offset-2 hover:text-amber-300 transition-colors">
                  Uzupełnij DNA →
                </Link>
              </span>
            </div>
          )}

          {/* Expert cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ExpertCard variant={result.variants.kennedy} label="Dan Kennedy" loading={false} brainUsed={result._brainUsed} />
            <ExpertCard variant={result.variants.belfort} label="Jordan Belfort" loading={false} brainUsed={result._brainUsed} />
            <ExpertCard variant={result.variants.hormozi} label="Alex Hormozi" loading={false} brainUsed={result._brainUsed} />
          </div>

          {/* ICP Analysis */}
          {result.icp && (
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowIcp(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={14} className="text-[#E8A838]" />
                  <span className="text-[13px] font-semibold text-white">Analiza ICP</span>
                  <IcpBadge fit={result.icp.fit} />
                  <span className="text-[12px] font-bold text-white/50">
                    {result.icp.score}/10
                  </span>
                </div>
                {showIcp ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
              </button>
              {showIcp && (
                <div className="px-5 pb-4 border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide mb-1">Dopasowanie do ICP</p>
                    <p className="text-[13px] text-white/70 leading-relaxed">{result.icp.reason}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide mb-1">Główny ból do zaadresowania</p>
                    <p className="text-[13px] text-white/70 leading-relaxed">{result.icp.pain_point}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DM Sent → Pipeline */}
          <div className="flex items-center justify-center">
            {dmSentState === 'done' ? (
              <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--c-green)' }}>
                <Check size={14} /> Lead przeniesiony do Pipeline
              </div>
            ) : (
              <button
                onClick={handleDmSent}
                disabled={dmSentState === 'sending'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border text-[13px] font-semibold transition-colors disabled:opacity-40"
                style={{
                  background: 'rgba(48, 192, 96, 0.10)',
                  borderColor: 'rgba(48, 192, 96, 0.25)',
                  color: 'var(--c-green)',
                }}
              >
                {dmSentState === 'sending'
                  ? <><Loader2 size={14} className="animate-spin" /> Aktualizuję…</>
                  : <><Check size={14} /> DM Wysłany — Przenieś do Pipeline</>
                }
              </button>
            )}
          </div>

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <Zap size={13} /> Generuj jeszcze raz (inne wersje)
          </button>
        </>
      )}
    </div>
  )
}
