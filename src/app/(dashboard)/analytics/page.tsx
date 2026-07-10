'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, BarChart3, AlertCircle, Loader2,
  KanbanSquare, Users, Trophy, Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Stage config ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  kontakt:              'Kontakt',
  kwalifikacja:         'Kwalifikacja',
  oferta_wysłana:       'Oferta wysłana',
  oferta_prezentowana:  'Oferta prezentowana',
  negocjacje:           'Negocjacje',
  wygrana:              'Wygrana',
  przegrana:            'Przegrana',
  won:                  'Wygrana',
  lost:                 'Przegrana',
}

const STAGE_ORDER = [
  'kontakt', 'kwalifikacja', 'oferta_wysłana',
  'oferta_prezentowana', 'negocjacje',
]

const WON_STAGES  = new Set(['wygrana', 'won'])
const LOST_STAGES = new Set(['przegrana', 'lost'])

// Hex values matching design system tokens (works in Recharts fill + inline style)
const SCORE_COLORS = { hot: '#e84040', warm: '#f0a040', cold: '#5898f0' }
const PIE_COLORS   = ['#e84040', '#f0a040', '#5898f0', '#00c8be', '#30c060', '#8f7bff']

// Neutral tick/grid color readable in both dark and light mode
const CHART_TICK  = '#64748b'
const CHART_GRID  = '#64748b'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DealRow {
  id: string
  stage: string
  value: number
  created_at: string
  stage_changed_at: string | null
  contact_segment: string | null
  lost_reason: string | null
}

interface LeadRow {
  ai_score_label: string | null
}

interface AnalyticsData {
  pipelineValue: number
  activeDeals: number
  wonDeals: number
  wonValue: number
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  pipelineByStage: { stage: string; label: string; count: number; value: number }[]
  leadScoring: { name: string; count: number; color: string }[]
  segments: { segment: string; deals: number; value: number; avgTicket: number }[]
  velocity: { stage: string; label: string; avgDays: number }[]
  lostReasons: { reason: string; count: number; pct: number; color: string }[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string | null): number {
  const end = b ? new Date(b) : new Date()
  return Math.max(0, Math.round((end.getTime() - new Date(a).getTime()) / 86400000))
}

function buildAnalytics(deals: DealRow[], leads: LeadRow[]): AnalyticsData {
  const active = deals.filter(d => !WON_STAGES.has(d.stage) && !LOST_STAGES.has(d.stage))
  const won    = deals.filter(d => WON_STAGES.has(d.stage))
  const lost   = deals.filter(d => LOST_STAGES.has(d.stage))

  const stageMap = new Map<string, { count: number; value: number }>()
  for (const d of active) {
    const s = stageMap.get(d.stage) ?? { count: 0, value: 0 }
    stageMap.set(d.stage, { count: s.count + 1, value: s.value + (d.value ?? 0) })
  }
  const pipelineByStage = [
    ...STAGE_ORDER.filter(s => stageMap.has(s)),
    ...[...stageMap.keys()].filter(s => !STAGE_ORDER.includes(s)),
  ].map(s => ({
    stage: s,
    label: STAGE_LABELS[s] ?? s,
    count: stageMap.get(s)!.count,
    value: stageMap.get(s)!.value,
  }))

  const scoreCount = { hot: 0, warm: 0, cold: 0, other: 0 }
  for (const l of leads) {
    const k = l.ai_score_label as keyof typeof scoreCount
    if (k in scoreCount) scoreCount[k]++
    else scoreCount.other++
  }
  const leadScoring = [
    { name: 'Hot 🔥', count: scoreCount.hot,  color: SCORE_COLORS.hot  },
    { name: 'Warm',   count: scoreCount.warm, color: SCORE_COLORS.warm },
    { name: 'Cold',   count: scoreCount.cold, color: SCORE_COLORS.cold },
  ].filter(s => s.count > 0)

  const segMap = new Map<string, { deals: number; value: number }>()
  for (const d of deals) {
    const seg = d.contact_segment ?? 'Inne'
    const s = segMap.get(seg) ?? { deals: 0, value: 0 }
    segMap.set(seg, { deals: s.deals + 1, value: s.value + (d.value ?? 0) })
  }
  const segments = [...segMap.entries()]
    .map(([segment, { deals: cnt, value }]) => ({
      segment,
      deals: cnt,
      value,
      avgTicket: cnt > 0 ? Math.round(value / cnt) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  const velMap = new Map<string, number[]>()
  for (const d of active) {
    const days = daysBetween(d.created_at, d.stage_changed_at)
    const arr = velMap.get(d.stage) ?? []
    arr.push(days)
    velMap.set(d.stage, arr)
  }
  const velocity = [...velMap.entries()].map(([stage, arr]) => ({
    stage,
    label: STAGE_LABELS[stage] ?? stage,
    avgDays: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
  }))

  const reasonMap = new Map<string, number>()
  for (const d of lost) {
    const r = d.lost_reason ?? 'Brak powodu'
    reasonMap.set(r, (reasonMap.get(r) ?? 0) + 1)
  }
  const totalLost = lost.length
  const lostReasons = [...reasonMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count], i) => ({
      reason,
      count,
      pct: totalLost > 0 ? Math.round((count / totalLost) * 100) : 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))

  return {
    pipelineValue: active.reduce((s, d) => s + (d.value ?? 0), 0),
    activeDeals:   active.length,
    wonDeals:      won.length,
    wonValue:      won.reduce((s, d) => s + (d.value ?? 0), 0),
    totalLeads:    leads.length,
    hotLeads:      scoreCount.hot,
    warmLeads:     scoreCount.warm,
    coldLeads:     scoreCount.cold,
    pipelineByStage,
    leadScoring,
    segments,
    velocity,
    lostReasons,
  }
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ color?: string; fill?: string; name: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-raised border border-border rounded-[10px] px-3 py-2 text-[12px] shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.name.toLowerCase().includes('pln') ? p.value.toLocaleString('pl-PL') + ' PLN' : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function PieTooltipComp({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-raised border border-border rounded-[8px] px-3 py-2 text-[12px] shadow-lg">
      <p style={{ color: payload[0].payload.color }}>{payload[0].name}: <strong>{payload[0].value}</strong></p>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-[10px] bg-fg/[0.03] border border-border">
      <AlertCircle size={13} className="text-subtle flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted leading-relaxed italic">{text}</p>
    </div>
  )
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="kpi-card p-5"
      style={{ '--card-accent': color } as React.CSSProperties}>
      <div className="kpi-icon w-9 h-9 rounded-[10px] flex items-center justify-center mb-4">
        <Icon size={16} style={{ color }} />
      </div>
      <p className="section-label mb-1">{label}</p>
      <p className="text-[26px] font-bold text-fg num leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted mt-1.5">{sub}</p>}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [dealsRes, leadsRes] = await Promise.all([
        supabase
          .from('deals')
          .select('id, stage, value, created_at, stage_changed_at, contact_segment, lost_reason'),
        supabase
          .from('leads')
          .select('ai_score_label'),
      ])
      const deals = (dealsRes.data ?? []) as DealRow[]
      const leads = (leadsRes.data ?? []) as LeadRow[]
      setData(buildAnalytics(deals, leads))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-info" />
      </div>
    )
  }

  if (!data) return null

  const {
    pipelineValue, activeDeals, wonDeals, wonValue,
    totalLeads, hotLeads,
    pipelineByStage, leadScoring, segments, velocity, lostReasons,
  } = data

  return (
    <div className="max-w-[1200px] space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-fg flex items-center gap-2">
          <BarChart3 size={19} className="text-info" />
          Analityka Sprzedażowa
        </h1>
        <p className="text-[12px] text-muted mt-0.5">Dane live z Twojego pipeline, leadów i wyników sprzedaży</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Wartość pipeline"
          value={`${pipelineValue.toLocaleString('pl-PL')} PLN`}
          sub={`${activeDeals} aktywnych dealów`}
          icon={TrendingUp}
          color="var(--c-blue)"
        />
        <KpiCard
          label="Wygrane deale"
          value={String(wonDeals)}
          sub={wonValue > 0 ? `${wonValue.toLocaleString('pl-PL')} PLN` : 'Brak wygranych jeszcze'}
          icon={Trophy}
          color="var(--c-green)"
        />
        <KpiCard
          label="Wszystkich leadów"
          value={String(totalLeads)}
          sub={`${hotLeads} hot leads 🔥`}
          icon={Users}
          color="var(--c-violet)"
        />
        <KpiCard
          label="Etapy pipeline"
          value={String(pipelineByStage.length)}
          sub={activeDeals > 0 ? `${activeDeals} dealów w toku` : 'Brak aktywnych dealów'}
          icon={KanbanSquare}
          color="var(--c-blue)"
        />
      </div>

      {/* Pipeline by stage */}
      <div className="card-elevated rounded-[14px] p-5">
        <p className="text-[14px] font-semibold text-fg mb-0.5">Wartość pipeline per etap</p>
        <p className="text-[11px] text-muted mb-4">Łączna wartość dealów na każdym etapie (PLN)</p>
        {pipelineByStage.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineByStage} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} strokeOpacity={0.12} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART_TICK, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="label" width={150} tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.07)' }} />
              <Bar dataKey="value" name="Wartość PLN" fill="#5898f0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Brak aktywnych dealów w pipeline. Dodaj deale z zakładki Pipeline." />
        )}
      </div>

        {/* Win/Loss */}
        <div className="card-elevated rounded-[14px] p-5">
          <p className="text-[14px] font-semibold text-fg mb-0.5">Win/Loss Analysis</p>
          <p className="text-[11px] text-muted mb-4">Powody przegranych dealów</p>
          {lostReasons.length > 0 ? (
            <div className="space-y-3">
              {lostReasons.map(r => (
                <div key={r.reason}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: r.color }} />
                      <span className="text-[12px] text-muted">{r.reason}</span>
                    </div>
                    <span className="text-[13px] font-bold text-fg">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-fg/[0.06] rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Brak przegranych dealów z odnotowanym powodem. Kiedy zamkniesz deal jako 'Przegrany', wnioski pojawią się tutaj automatycznie." />
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-[10px] bg-success/[0.07] border border-success/20 text-center">
              <p className="text-[22px] font-bold text-success num">{wonDeals}</p>
              <p className="text-[10px] text-muted mt-0.5">Wygranych</p>
            </div>
            <div className="p-3 rounded-[10px] bg-danger/[0.07] border border-danger/20 text-center">
              <p className="text-[22px] font-bold text-danger num">{lostReasons.reduce((s, r) => s + r.count, 0)}</p>
              <p className="text-[10px] text-muted mt-0.5">Przegranych</p>
            </div>
          </div>
        </div>

      {/* Hot leads spotlight */}
      {hotLeads > 0 && (
        <div className="card-elevated rounded-[12px] flex items-center gap-3 p-4"
          style={{ '--card-accent': 'var(--c-red)' } as React.CSSProperties}>
          <div className="w-9 h-9 rounded-[10px] bg-danger/15 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 14px color-mix(in srgb, var(--c-red) 30%, transparent)' }}>
            <Flame size={17} className="text-danger" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-fg">
              {hotLeads} leadów z oceną <span className="text-danger">Hot 🔥</span> czeka na kontakt
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Przejdź do zakładki Outreach → wygeneruj wiadomości i zacznij od tych o najwyższym potencjale.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
