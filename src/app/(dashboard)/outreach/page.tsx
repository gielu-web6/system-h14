'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, ChevronDown, ChevronUp, Copy, Check,
  Flame, Thermometer, Snowflake, UserPlus, MessageSquare,
  RotateCcw, Clock, Zap, Users, Loader2, RefreshCw, Search, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, isSalesUser, getCurrentUser } from '@/lib/userStore'
import { DEMO_OUTREACH } from '@/lib/demo-data'

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

const TYPE_CONFIG = {
  'zaproszenie':  { label: 'Zaproszenie LinkedIn', icon: UserPlus,     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'dm-pierwszy':  { label: 'Pierwsze DM',           icon: MessageSquare, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  'follow-up-1':  { label: 'Follow-up #1',          icon: RotateCcw,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'follow-up-2':  { label: 'Follow-up #2',          icon: Clock,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

// Map outreach type → API messageType
const TYPE_TO_API: Record<OutreachItem['type'], string> = {
  'zaproszenie':  'connection_request',
  'dm-pierwszy':  'dm1_icebreaker',
  'follow-up-1':  'fu1_case_study',
  'follow-up-2':  'fu2_calendar',
}

function ScoreBadge({ score }: { score: 'hot' | 'warm' | 'cold' }) {
  if (score === 'hot')  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9px] font-bold"><Flame size={8}/>Hot</span>
  if (score === 'warm') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[9px] font-bold"><Thermometer size={8}/>Warm</span>
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[9px] font-bold"><Snowflake size={8}/>Cold</span>
}

function OutreachCard({
  item,
  onDone,
  onRegenerate,
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
          <CheckCircle2 size={12} /> Oznacz jako wykonane
        </button>
      </div>
    </div>
  )
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const [queue, setQueue] = useState<OutreachItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch leads from Supabase (or demo data) and build initial queue
  useEffect(() => {
    if (isDemoMode()) {
      setQueue(DEMO_OUTREACH as unknown as OutreachItem[])
      setLoading(false)
      return
    }

    async function loadLeads() {
      const supabase = createClient()
      const currentUser = getCurrentUser()
      const salesOnly = isSalesUser() && !!currentUser

      const { data, error } = await (
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

      if (error) {
        console.error('Outreach: błąd ładowania leadów', error)
        setLoading(false)
        return
      }

      const items: OutreachItem[] = (data ?? []).map((row) => {
        const label = ((row.ai_score_label as string) ?? 'warm') as 'hot' | 'warm' | 'cold'
        const icebreaker = (row.ai_icebreaker as string) ?? ''

        const type: OutreachItem['type'] =
          label === 'hot'  ? 'dm-pierwszy' :
          label === 'warm' ? 'zaproszenie' :
                             'zaproszenie'

        return {
          id: row.id as string,
          type,
          firstName: (row.first_name as string) ?? '',
          lastName:  (row.last_name  as string) ?? '',
          company:   (row.company    as string) ?? '',
          position:  (row.position   as string) ?? '',
          score:     label,
          scoreNum:  (row.ai_score_num as number) ?? 0,
          message:   icebreaker,
          generating: false,
          done:       false,
        }
      })

      setQueue(items)
      setLoading(false)
    }
    loadLeads()
  }, [])

  // Generate message for a single item via API
  const generateOne = useCallback(async (id: string) => {
    setQueue(q => q.map(i => i.id === id ? { ...i, generating: true } : i))
    try {
      const item = queue.find(i => i.id === id)
      if (!item) return
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          messageType: TYPE_TO_API[item.type],
        }),
      })
      const data = await res.json()
      const message = data?.result?.message ?? ''
      setQueue(q => q.map(i => i.id === id ? { ...i, message, generating: false } : i))
    } catch {
      setQueue(q => q.map(i => i.id === id ? { ...i, generating: false } : i))
    }
  }, [queue])

  // Generate messages for ALL items that don't have one yet
  const generateAll = useCallback(async () => {
    const toGenerate = queue.filter(i => !i.done && !i.message && !i.generating)
    if (toGenerate.length === 0) return
    setGeneratingAll(true)
    await Promise.all(toGenerate.map(item => generateOne(item.id)))
    setGeneratingAll(false)
  }, [queue, generateOne])

  const handleDone = (id: string) => {
    setQueue(q => q.map(i => i.id === id ? { ...i, done: true } : i))
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? queue.filter(i =>
        `${i.firstName} ${i.lastName} ${i.company} ${i.position}`.toLowerCase().includes(q)
      )
    : queue

  const byType = (type: OutreachItem['type']) => visible.filter(i => i.type === type)
  const totalPending = visible.filter(i => !i.done).length
  const withoutMessage = visible.filter(i => !i.done && !i.message).length

  return (
    <div className="max-w-[860px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white">Outreach Queue</h1>
          <p className="text-[12px] text-white/40 mt-0.5">Kolejka zadań outreach na dziś</p>
        </div>
      </div>

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
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
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
          <p className="text-[13px] text-white/40">Ładowanie leadów…</p>
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
            <p className="text-[14px] font-semibold text-white/50">Brak leadów w bazie</p>
            <p className="text-[12px] text-white/25 mt-1 leading-relaxed max-w-xs">
              Dodaj leadów w zakładce <span className="text-white/40">Leady</span> i uruchom AI Scoring —
              system automatycznie wygeneruje kolejkę outreach z gotowymi wiadomościami.
            </p>
          </div>
        </div>
      )}

      {/* Sections */}
      {!loading && (
        <>
          <Section title="Pierwsze DM" type="dm-pierwszy" items={byType('dm-pierwszy')} onDone={handleDone} onRegenerate={generateOne} />
          <Section title="Zaproszenia LinkedIn" type="zaproszenie" items={byType('zaproszenie')} onDone={handleDone} onRegenerate={generateOne} />
          <Section title="Follow-up #1" type="follow-up-1" items={byType('follow-up-1')} onDone={handleDone} onRegenerate={generateOne} />
          <Section title="Follow-up #2" type="follow-up-2" items={byType('follow-up-2')} onDone={handleDone} onRegenerate={generateOne} />
        </>
      )}

      {!loading && queue.length > 0 && totalPending === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3 opacity-50" />
          <p className="text-[14px] font-semibold text-white/60">Wszystko gotowe!</p>
          <p className="text-[12px] text-white/30 mt-1">Dzienna kolejka outreach ukończona.</p>
        </div>
      )}
    </div>
  )
}
