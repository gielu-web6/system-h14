'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BrainCircuit, Flame, Thermometer, Snowflake,
  Users, RefreshCw, Play, Loader2, CheckCircle2, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'
import { DEMO_LEADS } from '@/lib/demo-data'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoredLead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
  aiScore: number
  aiLabel: 'hot' | 'warm' | 'cold'
  // real per-criteria scores (0–25 each)
  icpScore: number
  signalsScore: number
  activityScore: number
  potentialScore: number
  problem: string
  icebreaker: string
  reasoning: string
  scoredAt: string | null
  // raw data for re-scoring
  industry: string
  linkedin: string
  website: string
  segment: string
  notes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreLabelOf(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}

function dbToScoredLead(row: Record<string, unknown>): ScoredLead {
  const raw = (row.ai_score_num as number) ?? 0
  const icp      = (row.ai_icp_score      as number) ?? 0
  const signals  = (row.ai_signals_score  as number) ?? 0
  const activity = (row.ai_activity_score as number) ?? 0
  const potential= (row.ai_potential_score as number) ?? 0
  return {
    id:           row.id as string,
    firstName:    (row.first_name    as string) ?? '',
    lastName:     (row.last_name     as string) ?? '',
    company:      (row.company       as string) ?? '',
    position:     (row.position      as string) ?? '',
    aiScore:      raw,
    aiLabel:      ((row.ai_score_label as string) ?? scoreLabelOf(raw)) as ScoredLead['aiLabel'],
    icpScore:     icp,
    signalsScore: signals,
    activityScore: activity,
    potentialScore: potential,
    problem:      (row.ai_problem    as string) ?? '',
    icebreaker:   (row.ai_icebreaker as string) ?? '',
    reasoning:    (row.ai_reasoning  as string) ?? '',
    scoredAt:     (row.ai_scored_at  as string) ?? null,
    industry:     (row.industry      as string) ?? '',
    linkedin:     (row.linkedin_url  as string) ?? '',
    website:      (row.company_website as string) ?? '',
    segment:      (row.segment       as string) ?? '',
    notes:        (row.notes         as string) ?? '',
  }
}

// ─── UI components ────────────────────────────────────────────────────────────

function ScoreBadge({ label }: { label: 'hot' | 'warm' | 'cold' }) {
  if (label === 'hot')  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/15 text-danger text-[10px] font-bold" style={{ boxShadow: '0 0 8px rgba(232,64,64,0.25)' }}><Flame size={9}/>Hot</span>
  if (label === 'warm') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/15 text-amber text-[10px] font-bold"><Thermometer size={9}/>Warm</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-bold"><Snowflake size={9}/>Cold</span>
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = max === 100
    ? (value >= 70 ? 'var(--c-red)' : value >= 40 ? 'var(--c-amber)' : 'var(--c-blue)')
    : 'var(--accent)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-fg/[0.06] rounded-full">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold text-fg w-7 text-right">{value}</span>
    </div>
  )
}

const CRITERIA = [
  { key: 'icpScore',       label: 'Dopasowanie do ICP',  color: 'var(--c-violet)', desc: 'Branża, wielkość firmy, stanowisko decydenta' },
  { key: 'signalsScore',   label: 'Sygnały zakupowe',    color: 'var(--c-amber)',  desc: 'Aktywność sugerująca intencję zakupową' },
  { key: 'activityScore',  label: 'Aktywność online',    color: 'var(--c-green)',  desc: 'Aktywność na LinkedIn/IG — wyższy = łatwiejszy DM' },
  { key: 'potentialScore', label: 'Potencjał projektu',  color: 'var(--c-violet)', desc: 'Szacowany budżet i zakres projektu' },
] as const

// ─── Score all (batch) ────────────────────────────────────────────────────────

async function scoreOneLead(lead: ScoredLead): Promise<Partial<ScoredLead>> {
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
        industry:   lead.industry || lead.segment,
        linkedin_url:     lead.linkedin,
        company_website:  lead.website,
        segment:    lead.segment,
        notes:      lead.notes,
      },
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { result } = await res.json()
  return {
    aiScore:        result.total_score    ?? lead.aiScore,
    aiLabel:        result.label          ?? lead.aiLabel,
    icpScore:       result.icp_score      ?? 0,
    signalsScore:   result.signals_score  ?? 0,
    activityScore:  result.activity_score ?? 0,
    potentialScore: result.potential_score ?? 0,
    problem:        result.problem        ?? '',
    icebreaker:     result.icebreaker     ?? '',
    reasoning:      result.reasoning      ?? '',
    scoredAt:       new Date().toISOString(),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiScoringPage() {
  const [leads, setLeads]         = useState<ScoredLead[]>([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [scoring, setScoring]     = useState<Set<string>>(new Set())
  const [batchRunning, setBatch]  = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })
  const abortRef = useRef(false)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    if (isDemoMode()) {
      const mapped: ScoredLead[] = [...DEMO_LEADS]
        .sort((a, b) => b.aiScore - a.aiScore)
        .map(l => ({
          id: l.id, firstName: l.firstName, lastName: l.lastName,
          company: l.company, position: l.position,
          aiScore: l.aiScore, aiLabel: l.aiLabel,
          icpScore: 0, signalsScore: 0, activityScore: 0, potentialScore: 0,
          problem: l.problem, icebreaker: l.icebreaker, reasoning: '',
          scoredAt: null, industry: '', linkedin: '', website: '', segment: '', notes: '',
        }))
      setLeads(mapped)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .select(`id, first_name, last_name, company, position, industry, segment,
               linkedin_url, company_website, notes,
               ai_score_num, ai_score_label, ai_problem, ai_icebreaker,
               ai_icp_score, ai_signals_score, ai_activity_score, ai_potential_score,
               ai_reasoning, ai_scored_at`)
      .order('ai_score_num', { ascending: false })

    if (error) {
      toast.error('Błąd ładowania leadów')
      console.error(error)
    } else {
      setLeads((data ?? []).map(r => dbToScoredLead(r as Record<string, unknown>)))
    }
    setLoading(false)
  }, [])

  useEffect(() => { void loadLeads() }, [loadLeads])

  const rescoreLead = useCallback(async (lead: ScoredLead) => {
    if (isDemoMode()) { toast('Demo mode — scoring wyłączony'); return }
    setScoring(s => new Set(s).add(lead.id))
    try {
      const updates = await scoreOneLead(lead)
      setLeads(prev => prev
        .map(l => l.id === lead.id ? { ...l, ...updates } : l)
        .sort((a, b) => b.aiScore - a.aiScore))
      toast.success(`${lead.firstName}: ${updates.aiScore}/100`)
    } catch {
      toast.error(`Błąd scoringu: ${lead.firstName}`)
    } finally {
      setScoring(s => { const n = new Set(s); n.delete(lead.id); return n })
    }
  }, [])

  const unscored = leads.filter(l => !l.scoredAt && !isDemoMode())

  const runBatchScoring = useCallback(async () => {
    if (isDemoMode() || batchRunning) return
    const targets = leads.filter(l => !l.scoredAt)
    if (!targets.length) { toast('Wszystkie leady mają już scoring'); return }

    abortRef.current = false
    setBatch(true)
    setBatchProgress({ done: 0, total: targets.length })

    for (let i = 0; i < targets.length; i++) {
      if (abortRef.current) break
      const lead = targets[i]
      setScoring(s => new Set(s).add(lead.id))
      try {
        const updates = await scoreOneLead(lead)
        setLeads(prev =>
          prev.map(l => l.id === lead.id ? { ...l, ...updates } : l)
              .sort((a, b) => b.aiScore - a.aiScore)
        )
      } catch {
        // continue — don't abort on single failure
      }
      setScoring(s => { const n = new Set(s); n.delete(lead.id); return n })
      setBatchProgress({ done: i + 1, total: targets.length })

      // 1.5s pause between calls to avoid rate limiting
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 1500))
    }

    setBatch(false)
    toast.success('Batch scoring zakończony!')
  }, [leads, batchRunning])

  const stopBatch = () => { abortRef.current = true; setBatch(false) }

  const hot   = leads.filter(l => l.aiLabel === 'hot'  && l.scoredAt).length
  const warm  = leads.filter(l => l.aiLabel === 'warm' && l.scoredAt).length
  const cold  = leads.filter(l => l.aiLabel === 'cold' && l.scoredAt).length
  const scored = leads.filter(l => !!l.scoredAt).length
  const total  = leads.length

  return (
    <div className="max-w-[1200px] space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-bold text-fg flex items-center gap-2">
            <BrainCircuit size={20} className="text-accent" />
            AI Scoring Leadów
          </h1>
          <p className="text-[12px] text-muted mt-0.5">
            {loading ? 'Ładowanie…' : `${scored}/${total} ocenionych · ${unscored.length} czeka na scoring`}
          </p>
        </div>

        {!loading && !isDemoMode() && (
          <div className="flex items-center gap-2">
            {batchRunning ? (
              <>
                <span className="text-[12px] text-muted flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-accent" />
                  {batchProgress.done}/{batchProgress.total} leadów…
                </span>
                <button onClick={stopBatch}
                  className="px-3 py-1.5 rounded-[8px] bg-danger/15 border border-danger/30 text-danger text-[12px] font-medium hover:bg-danger/20 transition-all">
                  Zatrzymaj
                </button>
              </>
            ) : (
              <>
                <button onClick={() => void loadLeads()}
                  className="p-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.08] text-muted hover:text-fg transition-all" title="Odśwież">
                  <RefreshCw size={14} />
                </button>
                {unscored.length > 0 && (
                  <button onClick={() => void runBatchScoring()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent hover:opacity-90 hover:shadow-[var(--glow-teal)] text-[12px] font-bold transition-all"
                    style={{ color: 'var(--nav-pill-text)' }}>
                    <Play size={13} /> Oceń wszystkich bez scoringu ({unscored.length})
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-raised border border-border">
          <div className="w-4 h-4 border-2 border-fg/20 border-t-accent rounded-full animate-spin" />
          <p className="text-[13px] text-muted">Ładowanie leadów…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && total === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-raised border border-border">
          <Users size={16} className="text-subtle flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-fg">Brak leadów</p>
            <p className="text-[11px] text-muted">Dodaj leadów w zakładce Leady, AI oceni ich automatycznie.</p>
          </div>
        </div>
      )}

      {/* Stats + methodology */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* Methodology */}
          <div className="card-elevated rounded-[14px] p-5">
            <p className="text-[14px] font-semibold text-fg mb-1">Metodologia scoringu</p>
            <p className="text-[12px] text-muted mb-4">4 kryteria po max 25 pkt = 100 pkt łącznie</p>
            <div className="space-y-3">
              {CRITERIA.map(c => (
                <div key={c.key} className="p-3 rounded-[10px] bg-raised border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-[12px] font-semibold text-fg">{c.label}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${c.color} 14%, transparent)`, color: c.color }}>max 25</span>
                  </div>
                  <p className="text-[11px] text-muted ml-4">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div className="card-elevated rounded-[14px] p-5 flex flex-col">
            <p className="text-[14px] font-semibold text-fg mb-1">Rozkład bazy</p>
            <p className="text-[12px] text-muted mb-4">{scored} z {total} leadów ocenionych</p>

            {scored > 0 && (
              <div className="space-y-3 mb-4">
                {[
                  { icon: Flame,      color: 'text-danger', bar: 'var(--c-red)',   count: hot,  label: 'Hot' },
                  { icon: Thermometer,color: 'text-amber',  bar: 'var(--c-amber)', count: warm, label: 'Warm' },
                  { icon: Snowflake,  color: 'text-info',   bar: 'var(--c-blue)',  count: cold, label: 'Cold' },
                ].map(({ icon: Icon, color, bar, count, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={12} className={`${color} flex-shrink-0`} />
                    <div className="flex-1 h-2 bg-fg/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${scored ? (count / scored) * 100 : 0}%`, background: bar }} />
                    </div>
                    <span className="text-[11px] text-muted w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {unscored.length > 0 && (
              <div className="mt-auto p-3 rounded-[10px] bg-amber/[0.07] border border-amber/20">
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock size={12} className="text-amber" />
                  <p className="text-[12px] font-semibold text-amber">{unscored.length} leadów bez scoringu</p>
                </div>
                <p className="text-[10px] text-muted">Kliknij &quot;Oceń wszystkich&quot; aby uruchomić batch scoring</p>
              </div>
            )}

            {scored > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                {[
                  { icon: Flame,      color: 'text-danger', count: hot,  label: 'Hot leads' },
                  { icon: Thermometer,color: 'text-amber',  count: warm, label: 'Warm' },
                  { icon: Snowflake,  color: 'text-info',   count: cold, label: 'Cold' },
                ].map(({ icon: Icon, color, count, label }) => (
                  <div key={label} className="text-center">
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className="text-[16px] font-bold text-fg num">{count}</p>
                    <p className="text-[9px] text-subtle uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leads table */}
      {!loading && total > 0 && (
        <div className="card-elevated rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-fg">Wszystkie leady</p>
              <p className="text-[12px] text-muted mt-0.5">Posortowane od najwyższego score</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_140px_80px_80px_36px] gap-2 px-5 py-2 border-b border-border-s text-[10px] font-semibold text-subtle uppercase tracking-wide">
            <span>Lead</span>
            <span>Score</span>
            <span className="text-center">Label</span>
            <span className="text-center">Scoring</span>
            <span />
          </div>

          <div className="divide-y divide-border-s">
            {leads.map((lead) => {
              const isOpen    = expanded === lead.id
              const isScoring = scoring.has(lead.id)
              const hasScore  = !!lead.scoredAt

              return (
                <div key={lead.id}>
                  {/* Row */}
                  <div className="grid grid-cols-[1fr_140px_80px_80px_36px] gap-2 px-5 py-3 items-center hover:bg-fg/[0.03] transition-colors">
                    {/* Name */}
                    <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="text-left min-w-0">
                      <p className="text-[13px] font-semibold text-fg truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[11px] text-muted truncate">{lead.position} · {lead.company}</p>
                    </button>

                    {/* Score bar */}
                    <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="min-w-0">
                      {hasScore
                        ? <ScoreBar value={lead.aiScore} />
                        : <span className="text-[11px] text-subtle italic">nie oceniony</span>
                      }
                    </button>

                    {/* Label */}
                    <div className="flex justify-center">
                      {hasScore ? <ScoreBadge label={lead.aiLabel} /> : <span className="text-[10px] text-subtle">—</span>}
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      {isScoring ? (
                        <Loader2 size={13} className="animate-spin text-accent" />
                      ) : hasScore ? (
                        <CheckCircle2 size={13} className="text-success" />
                      ) : (
                        <Clock size={13} className="text-subtle" />
                      )}
                    </div>

                    {/* Re-score button */}
                    <button
                      onClick={() => void rescoreLead(lead)}
                      disabled={isScoring || batchRunning || isDemoMode()}
                      title={hasScore ? 'Re-score' : 'Oceń teraz'}
                      className="p-1.5 rounded-[6px] text-subtle hover:text-accent hover:bg-accent/10 disabled:opacity-30 transition-all"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 bg-raised border-t border-border-s space-y-4">

                      {/* Per-criteria breakdown */}
                      {hasScore && (
                        <div className="grid grid-cols-2 gap-3">
                          {CRITERIA.map(c => {
                            const val = lead[c.key as keyof ScoredLead] as number
                            return (
                              <div key={c.key} className="p-3 rounded-[10px] bg-fg/[0.04] border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] text-muted">{c.label}</span>
                                  <span className="text-[12px] font-bold num" style={{ color: c.color }}>{val}/25</span>
                                </div>
                                <div className="h-1.5 bg-fg/[0.06] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${(val / 25) * 100}%`, background: c.color }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Problem */}
                      {lead.problem && (
                        <div className="p-3 rounded-[8px] bg-amber/[0.07] border border-amber/20">
                          <p className="text-[10px] font-semibold text-amber uppercase tracking-wide mb-1">Zidentyfikowany problem</p>
                          <p className="text-[12px] text-fg leading-snug">{lead.problem}</p>
                        </div>
                      )}

                      {/* Icebreaker */}
                      {lead.icebreaker && (
                        <div className="p-3 rounded-[8px] bg-accent/[0.08] border border-accent/20">
                          <p className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-1">Icebreaker AI</p>
                          <p className="text-[12px] text-fg leading-snug italic">&quot;{lead.icebreaker}&quot;</p>
                        </div>
                      )}

                      {/* Reasoning */}
                      {lead.reasoning && (
                        <div className="p-3 rounded-[8px] bg-fg/[0.04] border border-border">
                          <p className="text-[10px] font-semibold text-subtle uppercase tracking-wide mb-1">Uzasadnienie AI</p>
                          <p className="text-[12px] text-muted leading-snug">{lead.reasoning}</p>
                        </div>
                      )}

                      {/* No score yet */}
                      {!hasScore && (
                        <button
                          onClick={() => void rescoreLead(lead)}
                          disabled={isScoring || batchRunning || isDemoMode()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-semibold hover:bg-accent/20 disabled:opacity-50 transition-all"
                        >
                          {isScoring
                            ? <><Loader2 size={13} className="animate-spin" /> Oceniam…</>
                            : <><BrainCircuit size={13} /> Oceń ten lead teraz</>
                          }
                        </button>
                      )}

                      {lead.scoredAt && (
                        <p className="text-[10px] text-subtle text-right">
                          Ostatni scoring: {new Date(lead.scoredAt).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
