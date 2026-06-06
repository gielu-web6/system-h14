'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Loader2, Copy, Check, Edit3, Save, X,
  Globe, Zap, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Brain, Users, Search, User, Bell, PlayCircle,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'
import { MESSAGE_TYPE_META, type MessageType } from '@/lib/outreach/promptComposer'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Channel = 'linkedin' | 'email' | 'whatsapp'

interface OutreachVariant {
  temat?: string
  tresc: string
  katAtaku: string
  notatkaHandlowca?: string
}

interface IcpResult {
  score: number
  fit: 'hot' | 'warm' | 'cold'
  reason: string
  pain_point: string
}

interface GenerateResult {
  warianty: OutreachVariant[]
  typ: MessageType
  typLabel: string
  icp: IcpResult | null
  _demo?: boolean
  _brainUsed?: boolean
  _brainComplete?: boolean
  _warned?: boolean
}

interface LeadOption {
  id: string
  company: string
  first_name: string
  last_name: string
  position: string | null
  company_website: string | null
  app_status: string | null
}

interface ReminderRow {
  id: string
  lead_id: string
  message_type: string
  scheduled_for: string
  company: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_OPTIONS: { id: Channel; label: string; desc: string }[] = [
  { id: 'linkedin', label: 'LinkedIn DM', desc: '5-6 zdań' },
  { id: 'email',    label: 'Cold Email',  desc: 'do 150 słów' },
  { id: 'whatsapp', label: 'WhatsApp',    desc: '3-4 zdania' },
]

const MESSAGE_TYPE_OPTIONS: { id: MessageType; label: string; day: string }[] = [
  { id: 'dm1',         label: 'DM #1 — Icebreaker',   day: 'Dzień 1'  },
  { id: 'fu1',         label: 'FU #1 — Case study',    day: '+3 dni'   },
  { id: 'fu2',         label: 'FU #2 — Kalendarz',     day: '+5 dni'   },
  { id: 'fu3',         label: 'FU #3 — Social proof',  day: '+3 dni'   },
  { id: 'fu4',         label: 'FU #4 — Direct Ask',    day: '+5 dni'   },
  { id: 'fu5',         label: 'FU #5 — Breakup',       day: '+7 dni'   },
  { id: 'po_ofercie',  label: 'Po ofercie (48h)',       day: '+2 dni'   },
  { id: 'reengagement',label: 'Re-engagement',          day: '+90 dni'  },
]

// Kolejność kroków i offsety (dni od poprzedniego kroku)
const SEQUENCE_STEPS: { type: MessageType; offsetDays: number }[] = [
  { type: 'dm1',          offsetDays: 0  },
  { type: 'fu1',          offsetDays: 3  },
  { type: 'fu2',          offsetDays: 5  },
  { type: 'fu3',          offsetDays: 3  },
  { type: 'fu4',          offsetDays: 5  },
  { type: 'fu5',          offsetDays: 7  },
  { type: 'po_ofercie',   offsetDays: 2  },
  { type: 'reengagement', offsetDays: 90 },
]

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const VARIANT_COLORS = ['#E8A838', '#60a5fa', '#a78bfa']

const inputCls = `w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
  text-white placeholder:text-white/25 text-[13px]
  focus:outline-none focus:border-[#E8A838]/50 focus:bg-[#E8A838]/[0.02]
  transition-all`

// ─── ICP Badge ────────────────────────────────────────────────────────────────

function IcpBadge({ fit }: { fit: 'hot' | 'warm' | 'cold' }) {
  if (fit === 'hot')  return <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">Hot ICP</span>
  if (fit === 'warm') return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">Warm ICP</span>
  return <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">Cold ICP</span>
}

// ─── Variant Card ─────────────────────────────────────────────────────────────

function VariantCard({
  variant,
  index,
  loading,
  brainUsed,
  channel,
}: {
  variant: OutreachVariant | null
  index: number
  loading: boolean
  brainUsed?: boolean
  channel: Channel
}) {
  const [copied, setCopied]       = useState(false)
  const [editing, setEditing]     = useState(false)
  const [editText, setEditText]   = useState('')
  const [savedText, setSavedText] = useState<string | null>(null)

  const displayMessage = savedText ?? variant?.tresc ?? ''
  const color = VARIANT_COLORS[index] ?? '#E8A838'

  const handleCopy = async () => {
    const text = editing ? editText : displayMessage
    if (!text) return
    const toCopy = channel === 'email' && variant?.temat
      ? `Temat: ${variant.temat}\n\n${text}`
      : text
    await navigator.clipboard.writeText(toCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = () => { setEditText(displayMessage); setEditing(true) }
  const saveEdit  = () => { setSavedText(editText); setEditing(false) }

  return (
    <div
      className="rounded-[14px] bg-card border border-border overflow-hidden flex flex-col"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: `${color}15`, color }}
          >
            Wariant {index + 1}
          </div>
          {variant?.katAtaku && (
            <span className="text-[10px] text-white/30 font-medium text-right max-w-[140px] leading-snug">
              {variant.katAtaku}
            </span>
          )}
        </div>
        {variant?.temat && channel === 'email' && (
          <p className="text-[11px] text-white/40 mt-1.5">
            <span className="text-white/20 mr-1">Temat:</span>
            {variant.temat}
          </p>
        )}
        {variant?.notatkaHandlowca && (
          <p className="text-[10px] text-amber-400/60 italic mt-1.5 leading-relaxed">
            {variant.notatkaHandlowca}
          </p>
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
            className="w-full px-3 py-2.5 rounded-[8px] bg-raised border border-border text-[12px] text-white/85 leading-relaxed resize-none focus:outline-none focus:border-[#E8A838]/40 font-mono"
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
            {brainUsed ? 'Wygenerowano z Company Brain' : 'Wygenerowano bez Company Brain'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Lead Picker ──────────────────────────────────────────────────────────────

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
      if (q.trim()) qb = qb.ilike('company', `%${q.trim()}%`)
      const { data } = await qb
      setLeads(data ?? [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchLeads(query)
  }, [open, query, fetchLeads])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
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
    nowy: '#60a5fa', kontakt: '#E8A838', negocjacje: '#a78bfa', klient: '#4ade80', odrzucony: '#f87171',
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
            : 'Wyszukaj firmę lub decydenta…'}
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
                    style={{ background: `${statusColor[lead.app_status] ?? '#6b7280'}18`, color: statusColor[lead.app_status] ?? '#6b7280' }}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachGeneratorPage() {
  const [messageType, setMessageType]             = useState<MessageType>('dm1')
  const [channel, setChannel]                     = useState<Channel>('linkedin')
  const [companyName, setCompanyName]             = useState('')
  const [decisionMakerName, setDecisionMakerName] = useState('')
  const [decisionMakerRole, setDecisionMakerRole] = useState('')
  const [websiteUrl, setWebsiteUrl]               = useState('')
  const [industry, setIndustry]                   = useState('')
  const [observations, setObservations]           = useState('')
  const [context, setContext]                     = useState('')
  const [wysylajacy, setWysylajacy]               = useState('Maciek')

  const [generating, setGenerating]               = useState(false)
  const [result, setResult]                       = useState<GenerateResult | null>(null)
  const [dmSentState, setDmSentState]             = useState<'idle' | 'sending' | 'done'>('idle')
  const [urlAnalyzing, setUrlAnalyzing]           = useState(false)
  const [showIcp, setShowIcp]                     = useState(true)
  const [formOpen, setFormOpen]                   = useState(false)

  // ── Sequence state ────────────────────────────────────────────────────────────
  const [selectedLead, setSelectedLead]           = useState<LeadOption | null>(null)
  const [reminders, setReminders]                 = useState<ReminderRow[]>([])
  const [remindersLoading, setRemindersLoading]   = useState(true)
  const [leadStep, setLeadStep]                   = useState<string | null>(null)
  const [startingSeq, setStartingSeq]             = useState(false)
  const [markingId, setMarkingId]                 = useState<string | null>(null)

  const urlInputRef = useRef<HTMLInputElement>(null)
  const typeMeta = MESSAGE_TYPE_META[messageType]
  const needsContext = messageType === 'reengagement' || messageType === 'po_ofercie'
  const canGenerate = companyName.trim().length >= 2 && !generating

  // ── Reminders ─────────────────────────────────────────────────────────────────

  const fetchReminders = useCallback(async () => {
    setRemindersLoading(true)
    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('outreach_messages')
        .select('id, lead_id, message_type, scheduled_for, leads(company, first_name, last_name)')
        .is('sent_at', null)
        .lte('scheduled_for', today)
        .order('scheduled_for', { ascending: true })
      setReminders(
        (data ?? []).map((r: any) => ({
          id: r.id,
          lead_id: r.lead_id,
          message_type: r.message_type,
          scheduled_for: r.scheduled_for,
          company: r.leads?.company ?? '(nieznany lead)',
        }))
      )
    } catch { /* ignore */ } finally { setRemindersLoading(false) }
  }, [])

  const fetchLeadStep = useCallback(async (leadId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('outreach_messages')
      .select('message_type')
      .eq('lead_id', leadId)
      .is('sent_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(1)
    setLeadStep(data?.[0]?.message_type ?? null)
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  // ── Lead picker ──────────────────────────────────────────────────────────────

  const handleLeadSelect = (lead: LeadOption) => {
    setSelectedLead(lead)
    setCompanyName(lead.company ?? '')
    setDecisionMakerName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
    setDecisionMakerRole(lead.position ?? '')
    setWebsiteUrl(lead.company_website ?? '')
    fetchLeadStep(lead.id)
  }

  // ── Sequence actions ──────────────────────────────────────────────────────────

  const handleStartSequence = async () => {
    if (!selectedLead || startingSeq) return
    setStartingSeq(true)
    try {
      const supabase = createClient()
      await supabase.from('outreach_messages').insert({
        lead_id: selectedLead.id,
        message_type: 'dm1',
        status: 'scheduled',
        scheduled_for: addDays(0),
      })
      toast.success(`Sekwencja dla ${selectedLead.company} uruchomiona!`)
      setLeadStep('dm1')
      await fetchReminders()
    } catch { toast.error('Błąd zapisu sekwencji') } finally { setStartingSeq(false) }
  }

  const handleMarkSent = async (reminder: ReminderRow) => {
    if (markingId) return
    setMarkingId(reminder.id)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      await supabase
        .from('outreach_messages')
        .update({ sent_at: now, status: 'sent' })
        .eq('id', reminder.id)
      const currentIdx = SEQUENCE_STEPS.findIndex(s => s.type === reminder.message_type)
      if (currentIdx >= 0 && currentIdx < SEQUENCE_STEPS.length - 1) {
        const next = SEQUENCE_STEPS[currentIdx + 1]
        await supabase.from('outreach_messages').insert({
          lead_id: reminder.lead_id,
          message_type: next.type,
          status: 'scheduled',
          scheduled_for: addDays(next.offsetDays),
        })
      }
      toast.success('Oznaczono jako wysłane ✓')
      await fetchReminders()
      if (selectedLead?.id === reminder.lead_id) await fetchLeadStep(selectedLead.id)
    } catch { toast.error('Błąd') } finally { setMarkingId(null) }
  }

  // ── Quick Fill ───────────────────────────────────────────────────────────────

  const handleAnalyzeUrl = async () => {
    const url = websiteUrl.trim()
    if (!url) { urlInputRef.current?.focus(); toast.error('Wklej URL strony firmy'); return }
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
        if (data.result.industry) setIndustry(data.result.industry)
        if (data.result.observations) setObservations(prev => prev || data.result.observations)
        toast.success('Formularz uzupełniony z analizy strony')
      } else {
        toast.error(data.error ?? 'Nie udało się przeanalizować strony')
      }
    } catch { toast.error('Błąd połączenia') } finally { setUrlAnalyzing(false) }
  }

  // ── Generate ─────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!canGenerate) return
    if (messageType === 'reengagement' && !context.trim()) {
      toast.error('Re-engagement wymaga wypełnienia pola Kontekst')
      return
    }
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType,
          channel,
          companyName: companyName.trim(),
          decisionMakerName: decisionMakerName.trim() || undefined,
          decisionMakerRole: decisionMakerRole.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          industry: industry.trim() || undefined,
          observations: observations.trim() || undefined,
          context: context.trim() || undefined,
          wysylajacy: wysylajacy.trim() || 'Maciek',
        }),
      })
      const data = await res.json()
      if (data.warianty) {
        setResult(data)
        setShowIcp(true)
        setDmSentState('idle')
      } else {
        toast.error(data.error ?? 'Błąd generowania')
      }
    } catch { toast.error('Błąd połączenia z AI') } finally { setGenerating(false) }
  }

  // ── DM Sent → Pipeline ───────────────────────────────────────────────────────

  const handleDmSent = async () => {
    if (!companyName.trim() || dmSentState !== 'idle') return
    if (isDemoMode()) { toast('Tryb demo — zapis pominięty', { icon: '🔒' }); setDmSentState('done'); return }
    setDmSentState('sending')
    try {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)
      const name = companyName.trim()
      const { data: existing } = await supabase.from('leads').select('id').ilike('company', name).limit(1).single()
      if (existing) {
        await supabase.from('leads').update({ app_status: 'kontakt', last_contact: today }).eq('id', existing.id)
        toast.success(`${name} → Pipeline (Kontakt) ✓`)
      } else {
        const nameParts = decisionMakerName.trim().split(' ')
        await supabase.from('leads').insert({
          company: name, first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '',
          position: decisionMakerRole.trim() || null, company_website: websiteUrl.trim() || null,
          app_status: 'kontakt', last_contact: today, ai_score_num: 50, ai_score_label: 'warm',
          segment: 'usługi', outreach_history: [],
        })
        toast.success(`Nowy lead: ${name} → Pipeline ✓`)
      }
      setDmSentState('done')
    } catch { toast.error('Błąd podczas aktualizacji leada'); setDmSentState('idle') }
  }

  return (
    <div className="max-w-[1100px] space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white flex items-center gap-2.5">
          <Send size={20} className="text-[#E8A838]" />
          Outreach Generator
        </h1>
        <p className="text-[12px] text-white/40 mt-1">
          Sekwencja 8 punktów kontaktu. Wybierz typ wiadomości i kanał — AI wygeneruje 3 zróżnicowane warianty.
        </p>
      </div>

      {/* Follow-upy na dziś i zaległe */}
      <div className="bg-card border border-border rounded-[14px] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={14} className="text-[#E8A838]" />
          <p className="text-[13px] font-semibold text-white">Follow-upy na dziś i zaległe</p>
        </div>
        {remindersLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 size={13} className="animate-spin text-white/30" />
            <span className="text-[12px] text-white/30">Ładowanie…</span>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[12px] text-white/40">
            <Check size={13} className="text-green-400" />
            Brak follow-upów na dziś. Dobra robota.
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map(r => {
              const today = new Date().toISOString().split('T')[0]
              const isOverdue = r.scheduled_for < today
              const stepLabel = MESSAGE_TYPE_OPTIONS.find(m => m.id === r.message_type)?.label ?? r.message_type
              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border transition-colors ${isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{r.company}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {stepLabel}
                      <span className={`ml-1.5 ${isOverdue ? 'text-red-400 font-semibold' : 'text-white/30'}`}>
                        · {isOverdue ? `zaległe (${r.scheduled_for})` : r.scheduled_for}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkSent(r)}
                    disabled={markingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-green-500/10 border border-green-500/25 text-green-400 text-[11px] font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    {markingId === r.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Check size={11} />
                    }
                    Wysłane
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lead picker dla sekwencji */}
      <div className="bg-card border border-border rounded-[14px] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#E8A838]" />
          <p className="text-[13px] font-semibold text-white">Wybierz lead do sekwencji</p>
        </div>
        <LeadPicker onSelect={handleLeadSelect} />
        {selectedLead && (
          <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-white/[0.03] border border-white/[0.07]">
            <div>
              <p className="text-[12px] text-white/50 mb-0.5">Aktywny krok dla <span className="text-white font-semibold">{selectedLead.company}</span></p>
              {leadStep ? (
                <p className="text-[13px] font-semibold text-[#E8A838]">
                  {MESSAGE_TYPE_OPTIONS.find(m => m.id === leadStep)?.label ?? leadStep}
                </p>
              ) : (
                <p className="text-[12px] text-white/30">Brak aktywnej sekwencji</p>
              )}
            </div>
            {!leadStep && (
              <button
                onClick={handleStartSequence}
                disabled={startingSeq}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#E8A838] hover:bg-[#C47D1A] disabled:opacity-50 text-black text-[12px] font-bold transition-all flex-shrink-0"
              >
                {startingSeq
                  ? <Loader2 size={13} className="animate-spin" />
                  : <PlayCircle size={13} />
                }
                Rozpocznij sekwencję
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sequence Timeline */}
      <div className="bg-card border border-border rounded-[14px] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-[#E8A838]" />
          <p className="text-[13px] font-semibold text-white">Sekwencja prospectingowa — 8 punktów kontaktu</p>
        </div>
        <div className="flex items-start gap-0 overflow-x-auto pb-1">
          {MESSAGE_TYPE_OPTIONS.map((t, i, arr) => {
            const isActive = messageType === t.id
            const isLeadHere = leadStep === t.id
            const circleColor = isActive ? '#E8A838' : isLeadHere ? '#4ade80' : undefined
            return (
              <div key={t.id} className="flex items-start flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMessageType(t.id)}
                  className="flex flex-col items-center w-[100px] group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mb-2 flex-shrink-0 transition-all"
                    style={{
                      background: circleColor ?? 'rgba(255,255,255,0.06)',
                      color: circleColor ? '#000' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className={`text-[10px] font-bold text-center leading-tight transition-colors ${isActive ? 'text-[#E8A838]' : isLeadHere ? 'text-green-400' : 'text-white/40 group-hover:text-white/70'}`}>{t.label.split(' — ')[0]}</p>
                  <p className={`text-[9px] text-center mt-0.5 ${isActive ? 'text-[#E8A838]/70' : isLeadHere ? 'text-green-400/70' : 'text-white/25'}`}>{t.label.split(' — ')[1] ?? ''}</p>
                  <span className={`text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#E8A838]/15 text-[#E8A838]' : isLeadHere ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.06] text-white/30'}`}>{t.day}</span>
                </button>
                {i < arr.length - 1 && (
                  <div className="w-4 flex-shrink-0 mt-4 border-t border-dashed border-white/[0.10]" />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-white/25 mt-3">
          Kliknij krok w sekwencji żeby wybrać typ wiadomości do wygenerowania.
        </p>
      </div>

      {/* Form — collapsible */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setFormOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[14px] font-bold text-white flex items-center gap-2">
              <Zap size={14} className="text-[#E8A838]" />
              Szkic wiadomości AI
            </span>
            <span className="text-[11px] text-white/35">opcjonalne — AI może pomóc napisać draft</span>
          </div>
          {formOpen
            ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
            : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
          }
        </button>

        {formOpen && (
          <div className="border-t border-border p-6 space-y-5">

            {/* Warning box */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] bg-amber-500/8 border border-amber-500/25">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] font-bold text-amber-300 leading-relaxed">
                To szkic generowany przez AI — może zawierać błędy. Przejrzyj i popraw przed wysłaniem.
              </p>
            </div>

            {/* Lead Picker */}
            <LeadPicker onSelect={handleLeadSelect} />

        <div className="border-t border-white/[0.06]" />

        {/* Row 1: Company + Decision Maker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Nazwa firmy <span className="text-[#E8A838]">*</span>
            </label>
            <input type="text" className={inputCls} placeholder="np. MediaFlow Agency" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Imię decydenta</label>
            <input type="text" className={inputCls} placeholder="np. Piotr Nowak" value={decisionMakerName} onChange={e => setDecisionMakerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Stanowisko</label>
            <input type="text" className={inputCls} placeholder="np. CEO / Founder" value={decisionMakerRole} onChange={e => setDecisionMakerRole(e.target.value)} />
          </div>
        </div>

        {/* Row 2: URL + Industry + Wysylajacy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">URL strony firmowej</label>
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#E8A838]/10 border border-[#E8A838]/25 text-[#E8A838] text-[11px] font-semibold hover:bg-[#E8A838]/20 transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {urlAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                {urlAnalyzing ? 'Analizuję…' : 'Fill'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Branża / typ firmy</label>
            <input type="text" className={inputCls} placeholder="np. agencja marketingowa" value={industry} onChange={e => setIndustry(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              <User size={10} className="inline mr-1 mb-0.5" />
              Podpisuje się
            </label>
            <input type="text" className={inputCls} placeholder="Maciek" value={wysylajacy} onChange={e => setWysylajacy(e.target.value)} />
          </div>
        </div>

        {/* Row 3: Observations */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
            Obserwacje o firmie
            <span className="text-white/20 font-normal normal-case ml-1">(opcjonalnie — daje wiadomościom konkretny kontekst)</span>
          </label>
          <textarea
            className={inputCls}
            rows={2}
            placeholder='np. "Nie mają chatbota", "Niedawno zatrudnili handlowca", "Chwalili się wzrostem na LinkedIn"'
            value={observations}
            onChange={e => setObservations(e.target.value)}
          />
        </div>

        {/* Row 4: Context (for po_ofercie/reengagement) */}
        {needsContext && (
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
              Kontekst <span className="text-[#E8A838]">*</span>
              <span className="text-white/20 font-normal normal-case ml-1">
                {messageType === 'reengagement'
                  ? '(wymagane — nowy haczyk / powód powrotu)'
                  : '(opcjonalnie — np. otworzył cennik wielokrotnie)'}
              </span>
            </label>
            <textarea
              className={inputCls}
              rows={2}
              placeholder={
                messageType === 'reengagement'
                  ? 'np. "Dodaliśmy moduł X", "Widziałem że zatrudnili handlowca"'
                  : 'np. "Otworzył ofertę 5 razy, wracał do sekcji cennika"'
              }
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>
        )}

        {/* Row 5: Channel */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Kanał wysyłki</label>
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

        {/* Selected type summary */}
        <div className="px-3 py-2 rounded-[8px] bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-wide">Generuję:</span>
          <span className="text-[11px] font-semibold text-[#E8A838]">{typeMeta.label}</span>
          <span className="text-[10px] text-white/30">{typeMeta.day}</span>
          <span className="text-[10px] text-white/20 ml-auto">{typeMeta.angle}</span>
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-[12px] bg-[#E8A838] hover:bg-[#C47D1A] disabled:opacity-40 disabled:cursor-not-allowed text-black text-[14px] font-bold transition-all shadow-lg shadow-[#E8A838]/15"
        >
          {generating
            ? <><Loader2 size={16} className="animate-spin" /> Generuję 3 warianty…</>
            : <><Zap size={16} /> Generuj 3 warianty</>
          }
        </button>

          </div>
        )}
      </div>

      {/* Skeleton */}
      {generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <VariantCard key={i} variant={null} index={i} loading={true} channel={channel} />)}
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <>
          {/* Banners */}
          {result._demo && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>Tryb demo — wiadomości są przykładowe. Dodaj <code className="bg-white/10 px-1 py-0.5 rounded text-[11px]">OPENAI_API_KEY</code> aby generować spersonalizowane teksty.</span>
            </div>
          )}
          {result._warned && !result._demo && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>Walidacja nie przeszła w pełni — sprawdź wiadomości przed wysłaniem.</span>
            </div>
          )}
          {!result._demo && !result._brainUsed && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <Brain size={13} className="flex-shrink-0" />
              <span>
                Company Brain nie jest uzupełniony — jakość outputu będzie niższa.{' '}
                <Link href="/company-brain/dna" className="underline underline-offset-2 hover:text-amber-300">Uzupełnij teraz →</Link>
              </span>
            </div>
          )}

          {/* Type header */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-white/60">{result.typLabel}</span>
            <span className="text-[11px] text-white/30">— {MESSAGE_TYPE_META[result.typ].angle}</span>
          </div>

          {/* Variant cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {result.warianty.map((v, i) => (
              <VariantCard key={i} variant={v} index={i} loading={false} brainUsed={result._brainUsed} channel={channel} />
            ))}
          </div>

          {/* ICP */}
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
                  <span className="text-[12px] font-bold text-white/50">{result.icp.score}/10</span>
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
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide mb-1">Główny ból</p>
                    <p className="text-[13px] text-white/70 leading-relaxed">{result.icp.pain_point}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DM Sent */}
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
                style={{ background: 'rgba(48, 192, 96, 0.10)', borderColor: 'rgba(48, 192, 96, 0.25)', color: 'var(--c-green)' }}
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
