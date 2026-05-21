'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, ChevronDown, ChevronUp, Copy, Check,
  Flame, Thermometer, Snowflake, UserPlus, MessageSquare,
  RotateCcw, Clock, Zap, Users, Loader2, RefreshCw, Search, X,
  History, CalendarClock, Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, isSalesUser, getCurrentUser } from '@/lib/userStore'
import { DEMO_OUTREACH } from '@/lib/demo-data'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OutreachItem {
  id: string
  type: 'zaproszenie' | 'dm-pierwszy' | 'follow-up-1' | 'follow-up-2'
  firstName: string
  lastName: string
  company: string
  position: string
  score: 'hot' | 'warm' | 'cold'
  scoreNum: number
  message: string
  generating: boolean
  done: boolean
}

interface SentMessage {
  id: string
  lead_id: string
  message_type: string
  sent_at: string
  message_content: string | null
}

interface HistoryLead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
  score: 'hot' | 'warm' | 'cold'
  messages: SentMessage[]
  nextType: OutreachItem['type'] | null
  nextDate: Date | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  'zaproszenie':  { label: 'Zaproszenie LinkedIn', icon: UserPlus,     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'dm-pierwszy':  { label: 'Pierwsze DM',           icon: MessageSquare, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  'follow-up-1':  { label: 'Follow-up #1',          icon: RotateCcw,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'follow-up-2':  { label: 'Follow-up #2',          icon: Clock,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const TYPE_TO_API: Record<OutreachItem['type'], string> = {
  'zaproszenie':  'connection_request',
  'dm-pierwszy':  'dm1_icebreaker',
  'follow-up-1':  'fu1_case_study',
  'follow-up-2':  'fu2_calendar',
}

const API_TO_TYPE: Record<string, OutreachItem['type']> = {
  'connection_request': 'zaproszenie',
  'dm1_icebreaker':     'dm-pierwszy',
  'fu1_case_study':     'follow-up-1',
  'fu2_calendar':       'follow-up-2',
}

// Dni oczekiwania przed kolejnym krokiem
const SEQUENCE_DELAYS: Partial<Record<OutreachItem['type'], number>> = {
  'zaproszenie':  2,
  'dm-pierwszy':  3,
  'follow-up-1':  5,
}

const SEQUENCE: OutreachItem['type'][] = ['zaproszenie', 'dm-pierwszy', 'follow-up-1', 'follow-up-2']

// ─── Sequence logic ────────────────────────────────────────────────────────────

function getNextStep(
  scorelabel: string,
  messages: SentMessage[],
  today: Date,
): { type: OutreachItem['type'] | null; nextDate: Date | null } {
  if (messages.length === 0) {
    const type = scorelabel === 'hot' ? 'dm-pierwszy' : 'zaproszenie'
    return { type, nextDate: null }
  }

  // Find furthest step in sequence that was sent
  let lastIdx = -1
  let lastSentAt: Date | null = null
  for (let i = SEQUENCE.length - 1; i >= 0; i--) {
    const msg = messages.find(m => m.message_type === TYPE_TO_API[SEQUENCE[i]])
    if (msg) {
      lastIdx = i
      lastSentAt = new Date(msg.sent_at)
      break
    }
  }

  // All steps done
  if (lastIdx >= SEQUENCE.length - 1) return { type: null, nextDate: null }

  const nextType = SEQUENCE[lastIdx + 1]
  const delay = lastIdx >= 0 ? (SEQUENCE_DELAYS[SEQUENCE[lastIdx]] ?? 0) : 0

  if (lastSentAt && delay > 0) {
    const unlockDate = new Date(lastSentAt)
    unlockDate.setDate(unlockDate.getDate() + delay)
    if (unlockDate > today) return { type: null, nextDate: unlockDate }
  }

  return { type: nextType, nextDate: null }
}

// ─── Badges ────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: 'hot' | 'warm' | 'cold' }) {
  if (score === 'hot')  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9px] font-bold"><Flame size={8}/>Hot</span>
  if (score === 'warm') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[9px] font-bold"><Thermometer size={8}/>Warm</span>
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[9px] font-bold"><Snowflake size={8}/>Cold</span>
}

// ─── OutreachCard ──────────────────────────────────────────────────────────────

function OutreachCard({
  item, onDone, onRegenerate,
}: {
  item: OutreachItem
  onDone: (id: string) => void
  onRegenerate: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const typeConf = TYPE_CONFIG[item.type]
  const TypeIcon = typeConf.icon
  const initials = (item.firstName[0] ?? '') + (item.lastName[0] ?? '')

  const handleCopy = async () => {
    if (!item.message) return
    await navigator.clipboard.writeText(item.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (item.done) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-[10px] bg-white/[0.02] border border-white/[0.04] opacity-50">
        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
        <span className="text-[12px] text-white/40 line-through">{item.firstName} {item.lastName} – {item.company}</span>
      </div>
    )
  }

  return (
    <div className="rounded-[12px] bg-[#16213E] border border-white/[0.07] overflow-hidden transition-all">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-[10px] bg-[#6366f1]/20 flex items-center justify-center text-[12px] font-bold text-[#6366f1] flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold text-white">{item.firstName} {item.lastName}</p>
            <ScoreBadge score={item.score} />
          </div>
          <p className="text-[11px] text-white/40">{item.company} · {item.position}</p>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[10px] font-semibold flex-shrink-0"
          style={{ background: typeConf.bg, color: typeConf.color }}
        >
          <TypeIcon size={10} />
          {typeConf.label}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wide">Sugerowana wiadomość AI</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRegenerate(item.id)}
                disabled={item.generating}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-white/40 text-[10px] hover:text-white hover:bg-white/[0.09] transition-all disabled:opacity-50"
              >
                {item.generating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                Regeneruj
              </button>
              <button
                onClick={handleCopy}
                disabled={!item.message || item.generating}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-white/50 text-[10px] hover:text-white hover:bg-white/[0.09] transition-all disabled:opacity-50"
              >
                {copied ? <><Check size={10} className="text-green-400" /> Skopiowano</> : <><Copy size={10} /> Kopiuj</>}
              </button>
            </div>
          </div>
          {item.generating ? (
            <div className="flex items-center gap-2 bg-[#0F0F1A] p-3 rounded-[8px] border border-white/[0.06]">
              <Loader2 size={13} className="animate-spin text-[#6366f1]" />
              <span className="text-[12px] text-white/40">Generuję wiadomość…</span>
            </div>
          ) : item.message ? (
            <p className="text-[13px] text-white/70 leading-relaxed bg-[#0F0F1A] p-3 rounded-[8px] border border-white/[0.06]">
              {item.message}
            </p>
          ) : (
            <div className="flex items-center justify-center bg-[#0F0F1A] p-4 rounded-[8px] border border-white/[0.06]">
              <button
                onClick={() => onRegenerate(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[11px] font-semibold hover:bg-[#6366f1]/20 transition-all"
              >
                <Zap size={11} /> Generuj wiadomość
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] text-[#6366f1] hover:text-[#a5b4fc] transition-colors"
        >
          {expanded ? 'Zwiń wiadomość' : 'Pokaż wiadomość AI'}
        </button>
        <button
          onClick={() => onDone(item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-green-500/10 border border-green-500/25 text-green-400 text-[11px] font-semibold hover:bg-green-500/20 transition-all"
        >
          <CheckCircle2 size={12} /> Oznacz jako wysłane
        </button>
      </div>
    </div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

function Section({ title, type, items, onDone, onRegenerate }: {
  title: string
  type: OutreachItem['type']
  items: OutreachItem[]
  onDone: (id: string) => void
  onRegenerate: (id: string) => void
}) {
  const conf = TYPE_CONFIG[type]
  const TypeIcon = conf.icon
  const pending = items.filter(i => !i.done).length
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: conf.bg }}>
          <TypeIcon size={14} style={{ color: conf.color }} />
        </div>
        <span className="text-[13px] font-semibold text-white">{title}</span>
        {pending > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: conf.bg, color: conf.color }}>
            {pending}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <OutreachCard key={item.id} item={item} onDone={onDone} onRegenerate={onRegenerate} />
        ))}
      </div>
    </div>
  )
}

// ─── Historia tab ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  connection_request: 'Zaproszenie',
  dm1_icebreaker:     'Pierwsze DM',
  fu1_case_study:     'Follow-up #1',
  fu2_calendar:       'Follow-up #2',
}

const TYPE_COLOR: Record<string, string> = {
  connection_request: '#3b82f6',
  dm1_icebreaker:     '#6366f1',
  fu1_case_study:     '#f59e0b',
  fu2_calendar:       '#ef4444',
}

function HistoriaTab({ leads }: { leads: HistoryLead[] }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = search.trim()
    ? leads.filter(l =>
        `${l.firstName} ${l.lastName} ${l.company}`.toLowerCase().includes(search.toLowerCase())
      )
    : leads

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-white/10 flex items-center justify-center">
          <History size={24} className="text-white/20" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-white/50">Brak historii</p>
          <p className="text-[12px] text-white/25 mt-1">Oznacz pierwsze zadania jako wysłane — pojawią się tutaj.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj — imię, firma…"
          className="w-full pl-9 pr-8 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/25 outline-none focus:border-[#6366f1]/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(TYPE_TO_API).map(([type, apiType]) => {
          const count = leads.filter(l => l.messages.some(m => m.message_type === apiType)).length
          const conf = TYPE_CONFIG[type as OutreachItem['type']]
          const Icon = conf.icon
          return (
            <div key={type} className="bg-[#16213E] border border-white/[0.07] rounded-[10px] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon size={11} style={{ color: conf.color }} />
                <span className="text-[10px] text-white/40">{conf.label}</span>
              </div>
              <p className="text-[20px] font-bold" style={{ color: conf.color }}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Lead list */}
      <div className="space-y-2">
        {filtered.map(lead => {
          const isOpen = expanded === lead.id
          const sentTypes = lead.messages.map(m => m.message_type)
          return (
            <div key={lead.id} className="rounded-[12px] bg-[#16213E] border border-white/[0.07] overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : lead.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#6366f1]/20 flex items-center justify-center text-[12px] font-bold text-[#6366f1] flex-shrink-0">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-white">{lead.firstName} {lead.lastName}</p>
                    <ScoreBadge score={lead.score} />
                  </div>
                  <p className="text-[11px] text-white/40">{lead.company} · {lead.position}</p>
                </div>

                {/* Sequence dots */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  {SEQUENCE.map(t => {
                    const sent = sentTypes.includes(TYPE_TO_API[t])
                    const conf = TYPE_CONFIG[t]
                    return (
                      <div
                        key={t}
                        title={conf.label}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${sent ? 'border-transparent' : 'border-white/20 bg-transparent'}`}
                        style={sent ? { background: conf.color } : {}}
                      />
                    )
                  })}
                </div>

                {/* Next step */}
                {lead.nextType && (
                  <div className="hidden md:flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: TYPE_CONFIG[lead.nextType].color }}>
                    <CalendarClock size={11} />
                    {lead.nextDate
                      ? `Za ${Math.ceil((lead.nextDate.getTime() - Date.now()) / 86400000)} dni`
                      : 'Dziś'
                    }
                  </div>
                )}
                {!lead.nextType && lead.messages.length > 0 && (
                  <span className="hidden md:flex items-center gap-1 text-[10px] text-green-400 flex-shrink-0">
                    <CheckCircle2 size={11} /> Sekwencja zakończona
                  </span>
                )}

                {isOpen ? <ChevronUp size={14} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={14} className="text-white/30 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-white/[0.06] p-4 space-y-3">
                  {/* Timeline */}
                  <div className="space-y-2">
                    {lead.messages
                      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
                      .map(msg => (
                        <div key={msg.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${TYPE_COLOR[msg.message_type]}20`, border: `1px solid ${TYPE_COLOR[msg.message_type]}40` }}>
                              <Send size={11} style={{ color: TYPE_COLOR[msg.message_type] }} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[12px] font-semibold text-white">{TYPE_LABEL[msg.message_type] ?? msg.message_type}</span>
                              <span className="text-[10px] text-white/30">
                                {new Date(msg.sent_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {msg.message_content && (
                              <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{msg.message_content}</p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Next step */}
                  {lead.nextType && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-[8px] border text-[11px]"
                      style={{ background: `${TYPE_CONFIG[lead.nextType].color}10`, borderColor: `${TYPE_CONFIG[lead.nextType].color}30`, color: TYPE_CONFIG[lead.nextType].color }}
                    >
                      <CalendarClock size={12} />
                      <span className="font-semibold">Następny krok:</span>
                      <span>{TYPE_CONFIG[lead.nextType].label}</span>
                      {lead.nextDate && (
                        <span className="text-white/40 ml-auto">
                          {lead.nextDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  )}
                  {!lead.nextType && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-green-500/10 border border-green-500/25 text-green-400 text-[11px]">
                      <CheckCircle2 size={12} /> Pełna sekwencja outreach zakończona
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const [tab, setTab] = useState<'queue' | 'historia'>('queue')
  const [queue, setQueue] = useState<OutreachItem[]>([])
  const [historyLeads, setHistoryLeads] = useState<HistoryLead[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [search, setSearch] = useState('')

  // ── Load queue ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemoMode()) {
      setQueue(DEMO_OUTREACH as unknown as OutreachItem[])
      setLoading(false)
      return
    }

    async function loadQueue() {
      const supabase = createClient()
      const currentUser = getCurrentUser()
      const salesOnly = isSalesUser() && !!currentUser

      const { data: leads, error } = await (
        salesOnly
          ? supabase
              .from('leads')
              .select('id, first_name, last_name, company, position, ai_score_num, ai_score_label, ai_icebreaker')
              .eq('assigned_to', currentUser!.id)
              .order('ai_score_num', { ascending: false })
          : supabase
              .from('leads')
              .select('id, first_name, last_name, company, position, ai_score_num, ai_score_label, ai_icebreaker')
              .order('ai_score_num', { ascending: false })
      )

      if (error || !leads) { setLoading(false); return }

      // Fetch all outreach history for these leads
      const { data: messages } = await supabase
        .from('outreach_messages')
        .select('id, lead_id, message_type, sent_at, message_content')
        .in('lead_id', leads.map(l => l.id as string))
        .eq('status', 'sent')

      const msgByLead = new Map<string, SentMessage[]>()
      for (const m of (messages ?? []) as SentMessage[]) {
        const arr = msgByLead.get(m.lead_id) ?? []
        arr.push(m)
        msgByLead.set(m.lead_id, arr)
      }

      const today = new Date()
      const items: OutreachItem[] = []

      for (const row of leads) {
        const id = row.id as string
        const label = ((row.ai_score_label as string) ?? 'warm') as 'hot' | 'warm' | 'cold'
        const history = msgByLead.get(id) ?? []
        const { type, nextDate } = getNextStep(label, history, today)

        // Only show if there's a pending action ready today
        if (!type || nextDate) continue

        items.push({
          id,
          type,
          firstName: (row.first_name as string) ?? '',
          lastName:  (row.last_name  as string) ?? '',
          company:   (row.company    as string) ?? '',
          position:  (row.position   as string) ?? '',
          score:     label,
          scoreNum:  (row.ai_score_num as number) ?? 0,
          message:   (row.ai_icebreaker as string) ?? '',
          generating: false,
          done:       false,
        })
      }

      setQueue(items)
      setLoading(false)
    }

    loadQueue()
  }, [])

  // ── Load history ─────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (isDemoMode() || historyLeads.length > 0) return
    setHistoryLoading(true)
    const supabase = createClient()
    const currentUser = getCurrentUser()
    const salesOnly = isSalesUser() && !!currentUser

    // Get all sent messages
    const { data: messages } = await supabase
      .from('outreach_messages')
      .select('id, lead_id, message_type, sent_at, message_content')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })

    if (!messages || messages.length === 0) { setHistoryLoading(false); return }

    const uniqueLeadIds = [...new Set((messages as SentMessage[]).map(m => m.lead_id))]

    const { data: leads } = await (
      salesOnly
        ? supabase.from('leads').select('id, first_name, last_name, company, position, ai_score_num, ai_score_label').in('id', uniqueLeadIds).eq('assigned_to', currentUser!.id)
        : supabase.from('leads').select('id, first_name, last_name, company, position, ai_score_num, ai_score_label').in('id', uniqueLeadIds)
    )

    const today = new Date()
    const msgByLead = new Map<string, SentMessage[]>()
    for (const m of messages as SentMessage[]) {
      const arr = msgByLead.get(m.lead_id) ?? []
      arr.push(m)
      msgByLead.set(m.lead_id, arr)
    }

    const history: HistoryLead[] = (leads ?? []).map(row => {
      const id = row.id as string
      const label = ((row.ai_score_label as string) ?? 'warm') as 'hot' | 'warm' | 'cold'
      const msgs = msgByLead.get(id) ?? []
      const { type: nextType, nextDate } = getNextStep(label, msgs, today)
      return {
        id,
        firstName: (row.first_name as string) ?? '',
        lastName:  (row.last_name  as string) ?? '',
        company:   (row.company    as string) ?? '',
        position:  (row.position   as string) ?? '',
        score:     label,
        messages:  msgs,
        nextType,
        nextDate,
      }
    })

    setHistoryLeads(history.sort((a, b) => {
      const aLast = a.messages[0]?.sent_at ?? ''
      const bLast = b.messages[0]?.sent_at ?? ''
      return bLast.localeCompare(aLast)
    }))
    setHistoryLoading(false)
  }, [historyLeads.length])

  useEffect(() => {
    if (tab === 'historia') loadHistory()
  }, [tab, loadHistory])

  // ── Generate ─────────────────────────────────────────────────────────────────

  const generateOne = useCallback(async (id: string) => {
    setQueue(q => q.map(i => i.id === id ? { ...i, generating: true } : i))
    try {
      const item = queue.find(i => i.id === id)
      if (!item) return
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, messageType: TYPE_TO_API[item.type] }),
      })
      const data = await res.json()
      const message = data?.result?.message ?? ''
      setQueue(q => q.map(i => i.id === id ? { ...i, message, generating: false } : i))
    } catch {
      setQueue(q => q.map(i => i.id === id ? { ...i, generating: false } : i))
    }
  }, [queue])

  const generateAll = useCallback(async () => {
    const toGenerate = queue.filter(i => !i.done && !i.message && !i.generating)
    if (toGenerate.length === 0) return
    setGeneratingAll(true)
    await Promise.all(toGenerate.map(item => generateOne(item.id)))
    setGeneratingAll(false)
  }, [queue, generateOne])

  // ── Done — save to Supabase ───────────────────────────────────────────────────

  const handleDone = useCallback(async (id: string) => {
    const item = queue.find(i => i.id === id)
    if (!item) return

    // Optimistic update
    setQueue(q => q.map(i => i.id === id ? { ...i, done: true } : i))

    if (!isDemoMode()) {
      const supabase = createClient()
      await supabase.from('outreach_messages').insert({
        lead_id:         id,
        message_type:    TYPE_TO_API[item.type],
        message_content: item.message || null,
        status:          'sent',
        sent_at:         new Date().toISOString(),
      })
    }
  }, [queue])

  // ── Render ───────────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase()
  const visible = q
    ? queue.filter(i =>
        `${i.firstName} ${i.lastName} ${i.company} ${i.position}`.toLowerCase().includes(q)
      )
    : queue

  const byType = (type: OutreachItem['type']) => visible.filter(i => i.type === type)
  const totalPending  = visible.filter(i => !i.done).length
  const withoutMessage = visible.filter(i => !i.done && !i.message).length

  return (
    <div className="max-w-[860px] space-y-5">

      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white">Outreach Queue</h1>
          <p className="text-[12px] text-white/40 mt-0.5">Kolejka zadań outreach z pełną sekwencją follow-upów</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-[10px] p-1">
          <button
            onClick={() => setTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all ${tab === 'queue' ? 'bg-[#6366f1] text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Zap size={12} /> Kolejka
          </button>
          <button
            onClick={() => setTab('historia')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all ${tab === 'historia' ? 'bg-[#6366f1] text-white' : 'text-white/40 hover:text-white'}`}
          >
            <History size={12} /> Historia
          </button>
        </div>
      </div>

      {/* ── QUEUE TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'queue' && (
        <>
          {/* Search */}
          {!loading && queue.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj leada — imię, firma, stanowisko…"
                className="w-full pl-9 pr-8 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/25 outline-none focus:border-[#6366f1]/50 focus:bg-white/[0.06] transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          {!loading && queue.length > 0 && (
            <div className="flex items-center justify-end gap-2">
              {withoutMessage > 0 && (
                <button
                  onClick={generateAll}
                  disabled={generatingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-semibold hover:bg-[#6366f1]/20 transition-all disabled:opacity-60"
                >
                  {generatingAll
                    ? <><Loader2 size={12} className="animate-spin" /> Generuję…</>
                    : <><Zap size={12} /> Generuj wiadomości ({withoutMessage})</>
                  }
                </button>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30">
                <Zap size={13} className="text-[#6366f1]" />
                <span className="text-[12px] font-semibold text-[#a5b4fc]">Do zrobienia dziś</span>
                <span className="w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] flex items-center justify-center font-bold">
                  {totalPending}
                </span>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
              <Loader2 size={16} className="animate-spin text-white/40" />
              <p className="text-[13px] text-white/40">Ładowanie kolejki…</p>
            </div>
          )}

          {/* Stats */}
          {!loading && queue.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Zaproszenia',  type: 'zaproszenie' as const,  color: '#3b82f6' },
                { label: 'Pierwsze DM',  type: 'dm-pierwszy' as const,  color: '#6366f1' },
                { label: 'Follow-up #1', type: 'follow-up-1' as const,  color: '#f59e0b' },
                { label: 'Follow-up #2', type: 'follow-up-2' as const,  color: '#ef4444' },
              ].map(s => {
                const items = byType(s.type)
                const pending = items.filter(i => !i.done).length
                return (
                  <div key={s.type} className="bg-[#16213E] border border-white/[0.07] rounded-[10px] p-3 text-center">
                    <p className="text-[20px] font-bold" style={{ color: s.color }}>{pending}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && queue.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-white/10 flex items-center justify-center">
                <Users size={26} className="text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-white/50">Kolejka pusta</p>
                <p className="text-[12px] text-white/25 mt-1 leading-relaxed max-w-xs">
                  Brak leadów do kontaktu na dziś. Dodaj leady w zakładce <span className="text-white/40">Leady</span> lub sprawdź jutro — system automatycznie wróci z follow-upami.
                </p>
              </div>
            </div>
          )}

          {/* Sections */}
          {!loading && (
            <div className="space-y-6">
              <Section title="Pierwsze DM"           type="dm-pierwszy"  items={byType('dm-pierwszy')}  onDone={handleDone} onRegenerate={generateOne} />
              <Section title="Zaproszenia LinkedIn"  type="zaproszenie"  items={byType('zaproszenie')}  onDone={handleDone} onRegenerate={generateOne} />
              <Section title="Follow-up #1"          type="follow-up-1"  items={byType('follow-up-1')} onDone={handleDone} onRegenerate={generateOne} />
              <Section title="Follow-up #2"          type="follow-up-2"  items={byType('follow-up-2')} onDone={handleDone} onRegenerate={generateOne} />
            </div>
          )}

          {!loading && queue.length > 0 && totalPending === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3 opacity-50" />
              <p className="text-[14px] font-semibold text-white/60">Wszystko gotowe na dziś!</p>
              <p className="text-[12px] text-white/30 mt-1">Follow-upy pojawią się automatycznie gdy nadejdzie ich czas.</p>
            </div>
          )}
        </>
      )}

      {/* ── HISTORIA TAB ──────────────────────────────────────────────────────── */}
      {tab === 'historia' && (
        historyLoading
          ? <div className="flex items-center gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
              <Loader2 size={16} className="animate-spin text-white/40" />
              <p className="text-[13px] text-white/40">Ładowanie historii…</p>
            </div>
          : <HistoriaTab leads={historyLeads} />
      )}
    </div>
  )
}
