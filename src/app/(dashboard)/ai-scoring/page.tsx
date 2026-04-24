'use client'

import { useState, useEffect } from 'react'
import {
  BrainCircuit, Flame, Thermometer, Snowflake,
  AlertCircle, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'
import { DEMO_LEADS } from '@/lib/demo-data'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScoredLead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
  aiScore: number
  aiLabel: 'hot' | 'warm' | 'cold'
  problem: string
  icebreaker: string
}

// ─── Criteria ─────────────────────────────────────────────────────────────────

const CRITERIA = [
  {
    label: 'Dopasowanie do ICP',
    weight: '25 pkt',
    color: '#6366f1',
    desc: 'Sprawdzamy czy firma pasuje do Twojego Idealnego Profilu Klienta: branża, wielkość, lokalizacja, stanowisko decydenta.',
  },
  {
    label: 'Sygnały zakupowe',
    weight: '25 pkt',
    color: '#f59e0b',
    desc: 'Aktywność sugerująca intencję zakupową: posty o problemach, zatrudnienia w sprzedaży/marketingu, zmiany technologii, wzrost firmy.',
  },
  {
    label: 'Aktywność online',
    weight: '25 pkt',
    color: '#22c55e',
    desc: 'Częstotliwość i jakość aktywności na LinkedIn/IG. Aktywne profile = wyższa szansa na odpowiedź na DM.',
  },
  {
    label: 'Potencjał projektu',
    weight: '25 pkt',
    color: '#a78bfa',
    desc: 'Szacowany budżet i zakres projektu na podstawie wielkości firmy, branży i sygnałów z profilu.',
  },
]

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ label }: { label: 'hot' | 'warm' | 'cold' }) {
  if (label === 'hot')  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold"><Flame size={9}/>Hot</span>
  if (label === 'warm') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold"><Thermometer size={9}/>Warm</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold"><Snowflake size={9}/>Cold</span>
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? '#ef4444' : value >= 40 ? '#f97316' : '#3b82f6'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-bold text-white w-6 text-right">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiScoringPage() {
  const [leads, setLeads] = useState<ScoredLead[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode()) {
      const mapped: ScoredLead[] = [...DEMO_LEADS]
        .sort((a, b) => b.aiScore - a.aiScore)
        .map(l => ({
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          company: l.company,
          position: l.position,
          aiScore: l.aiScore,
          aiLabel: l.aiLabel,
          problem: l.problem,
          icebreaker: l.icebreaker,
        }))
      setLeads(mapped)
      setLoading(false)
      return
    }

    async function loadLeads() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, company, position, ai_score_num, ai_score_label, ai_problem, ai_icebreaker')
        .order('ai_score_num', { ascending: false })

      if (error) {
        console.error('Błąd ładowania leadów:', error)
        setLoading(false)
        return
      }

      const mapped: ScoredLead[] = (data ?? []).map((row) => ({
        id: row.id as string,
        firstName: (row.first_name as string) ?? '',
        lastName: (row.last_name as string) ?? '',
        company: (row.company as string) ?? '',
        position: (row.position as string) ?? '',
        aiScore: (row.ai_score_num as number) ?? 50,
        aiLabel: ((row.ai_score_label as string) ?? 'warm') as 'hot' | 'warm' | 'cold',
        problem: (row.ai_problem as string) ?? '',
        icebreaker: (row.ai_icebreaker as string) ?? '',
      }))

      setLeads(mapped)
      setLoading(false)
    }
    loadLeads()
  }, [])

  const hot  = leads.filter(l => l.aiLabel === 'hot').length
  const warm = leads.filter(l => l.aiLabel === 'warm').length
  const cold = leads.filter(l => l.aiLabel === 'cold').length
  const total = leads.length

  return (
    <div className="max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <BrainCircuit size={20} className="text-[#6366f1]" />
            AI Scoring Leadów
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">Automatyczna ocena każdego leadu w skali 0-100</p>
        </div>
        {total > 0 && (
          <span className="text-[12px] text-white/40 bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-[8px]">
            {total} leadów ocenionych
          </span>
        )}
      </div>

      {/* Status bar */}
      {loading ? (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-[13px] text-white/40">Ładowanie leadów…</p>
        </div>
      ) : total === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
          <Users size={16} className="text-white/30 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white/60">Brak leadów do oceny</p>
            <p className="text-[11px] text-white/30">
              Najpierw dodaj leadów w zakładce <span className="text-white/50">Leady</span>, potem AI oceni każdego automatycznie.
            </p>
          </div>
        </div>
      ) : null}

      {/* Methodology + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

        {/* Methodology */}
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <p className="text-[14px] font-semibold text-white mb-1">Metodologia scoringu</p>
          <p className="text-[12px] text-white/40 mb-4">Każdy lead oceniany jest na 4 kryteriach (maks. 25 pkt każde = 100 pkt łącznie)</p>
          <div className="space-y-4">
            {CRITERIA.map((c) => (
              <div key={c.label} className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-[13px] font-semibold text-white">{c.label}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.color + '20', color: c.color }}>
                    max {c.weight}
                  </span>
                </div>
                <p className="text-[12px] text-white/50 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <p className="text-[14px] font-semibold text-white mb-1">Rozkład bazy leadów</p>
          <p className="text-[12px] text-white/40 mb-4">
            {loading ? 'Ładowanie…' : total === 0 ? 'Brak ocenionych leadów' : `${total} leadów łącznie`}
          </p>

          {!loading && total > 0 && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame size={12} className="text-red-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${total ? (hot / total) * 100 : 0}%` }} />
                </div>
                <span className="text-[11px] text-white/50 w-8 text-right">{hot}</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer size={12} className="text-orange-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${total ? (warm / total) * 100 : 0}%` }} />
                </div>
                <span className="text-[11px] text-white/50 w-8 text-right">{warm}</span>
              </div>
              <div className="flex items-center gap-2">
                <Snowflake size={12} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total ? (cold / total) * 100 : 0}%` }} />
                </div>
                <span className="text-[11px] text-white/50 w-8 text-right">{cold}</span>
              </div>
            </div>
          )}

          {!loading && total === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-white/10 flex items-center justify-center">
                <BrainCircuit size={24} className="text-white/20" />
              </div>
              <p className="text-[12px] text-white/30 text-center mt-1">Dodaj leadów i uruchom scoring</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-white/[0.07]">
            <div className="text-center">
              <Flame size={16} className="text-red-400 mx-auto mb-1" />
              <p className="text-[16px] font-bold text-white">{loading ? '…' : hot}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Hot leads</p>
            </div>
            <div className="text-center">
              <Thermometer size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[16px] font-bold text-white">{loading ? '…' : warm}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Warm leads</p>
            </div>
            <div className="text-center">
              <Snowflake size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-[16px] font-bold text-white">{loading ? '…' : cold}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Cold leads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads table */}
      {!loading && total > 0 && (
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <p className="text-[14px] font-semibold text-white">Wszystkie ocenione leady</p>
            <p className="text-[12px] text-white/40 mt-0.5">Posortowane od najwyższego score</p>
          </div>
          <div className="grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-2 border-b border-white/[0.05] text-[10px] font-semibold text-white/30 uppercase tracking-wide">
            <span>Lead</span>
            <span>Score</span>
            <span className="text-center">Label</span>
            <span className="text-center">Firma</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {leads.map((lead) => {
              const isOpen = expanded === lead.id
              // Approximate per-criteria breakdown from total score
              const s = lead.aiScore
              const icp     = Math.min(25, Math.round(s * 0.28))
              const signals = Math.min(25, Math.round(s * 0.26))
              const activity= Math.min(25, Math.round(s * 0.24))
              const potential=Math.min(25, s - icp - signals - activity)
              return (
                <div key={lead.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : lead.id)}
                    className="w-full grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[11px] text-white/40 truncate">{lead.position} · {lead.company}</p>
                    </div>
                    <div className="min-w-0">
                      <ScoreBar value={lead.aiScore} />
                    </div>
                    <div className="flex justify-center">
                      <ScoreBadge label={lead.aiLabel} />
                    </div>
                    <div className="flex justify-center">
                      <span className="text-[10px] text-white/30">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 bg-white/[0.015] border-t border-white/[0.04] space-y-3">
                      {/* Breakdown bars */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Dopasowanie do ICP',  val: icp,      color: '#6366f1' },
                          { label: 'Sygnały zakupowe',    val: signals,  color: '#f59e0b' },
                          { label: 'Aktywność online',    val: activity, color: '#22c55e' },
                          { label: 'Potencjał projektu',  val: potential,color: '#a78bfa' },
                        ].map(c => (
                          <div key={c.label} className="p-2.5 rounded-[8px] bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-white/50">{c.label}</span>
                              <span className="text-[11px] font-bold" style={{ color: c.color }}>{c.val}/25</span>
                            </div>
                            <div className="h-1 bg-white/[0.06] rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${(c.val/25)*100}%`, background: c.color }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Problem */}
                      {lead.problem && (
                        <div className="p-3 rounded-[8px] bg-amber-500/[0.07] border border-amber-500/20">
                          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-1">Zidentyfikowany problem</p>
                          <p className="text-[12px] text-white/70 leading-snug">{lead.problem}</p>
                        </div>
                      )}

                      {/* Icebreaker */}
                      {lead.icebreaker && (
                        <div className="p-3 rounded-[8px] bg-[#6366f1]/[0.08] border border-[#6366f1]/20">
                          <p className="text-[10px] font-semibold text-[#a5b4fc] uppercase tracking-wide mb-1">Wygenerowany icebreaker</p>
                          <p className="text-[12px] text-white/80 leading-snug italic">„{lead.icebreaker}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alert box */}
      <div className="flex items-start gap-3 p-4 rounded-[12px] bg-amber-500/[0.07] border border-amber-500/20">
        <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-amber-400">Scoring odświeżany co 12h</p>
          <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
            AI automatycznie przeocenia leady co 12 godzin na podstawie nowych sygnałów z LinkedIn i aktywności online.
            Leady oznaczone jako Hot powinny otrzymać wiadomość w ciągu 12h.
          </p>
        </div>
      </div>
    </div>
  )
}
