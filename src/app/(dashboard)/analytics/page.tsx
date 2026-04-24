'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, Target, BarChart3, AlertCircle } from 'lucide-react'
import {
  DEMO_SEGMENT_PERFORMANCE,
  DEMO_PIPELINE_VELOCITY,
  DEMO_WIN_LOSS_REASONS,
  DEMO_REVENUE_FORECAST,
  DEMO_OUTREACH_FUNNEL,
} from '@/lib/demo-data'

type SegmentRow = { segment: string; leads: number; replyRate: number; closeRate: number; avgTicket: number; revenue: number }
type PipelineRow  = { stage: string; avgDays: number }
type WinLossRow   = { reason: string; percentage: number; color: string }
type ForecastRow  = { period: string; amount: number; deals: number; probability: string }
type FunnelRow    = { stage: string; count: number; color: string }

const SEGMENT_PERFORMANCE: SegmentRow[] = DEMO_SEGMENT_PERFORMANCE
const PIPELINE_VELOCITY: PipelineRow[]  = DEMO_PIPELINE_VELOCITY
const WIN_LOSS_REASONS: WinLossRow[]    = DEMO_WIN_LOSS_REASONS
const REVENUE_FORECAST: ForecastRow[]   = DEMO_REVENUE_FORECAST
const OUTREACH_FUNNEL: FunnelRow[]      = DEMO_OUTREACH_FUNNEL

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-[10px] px-3 py-2 text-[12px] shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-[8px] px-3 py-2 text-[12px]">
      <p style={{ color: payload[0].payload.color }}>{payload[0].name}: <strong>{payload[0].value}%</strong></p>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1300px] space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <BarChart3 size={19} className="text-[#6366f1]" />
          Analityka Sprzedażowa
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">Segmenty, pipeline velocity, win/loss, prognoza przychodów</p>
      </div>

      {/* Revenue Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REVENUE_FORECAST.map((f) => (
          <div key={f.period} className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Prognoza {f.period}</span>
              <TrendingUp size={15} className="text-[#6366f1]" />
            </div>
            <p className="text-[26px] font-bold text-white leading-none">
              {f.amount.toLocaleString('pl-PL')} <span className="text-[14px] text-white/40">PLN</span>
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-white/40">{f.deals} dealów w pipeline</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] font-semibold">{f.probability}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Performance table */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <p className="text-[14px] font-semibold text-white">Segment Performance</p>
          <p className="text-[11px] text-white/40 mt-0.5">Wyniki sprzedaży per segment ICP</p>
        </div>
        <div className="overflow-x-auto">
        <div className="min-w-[580px]">
        <div className="grid grid-cols-[140px_70px_80px_80px_110px_110px] gap-3 px-5 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wide border-b border-white/[0.05]">
          <span>Segment</span>
          <span className="text-right">Leady</span>
          <span className="text-right">Reply rate</span>
          <span className="text-right">Close rate</span>
          <span className="text-right">Avg ticket</span>
          <span className="text-right">Revenue</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {SEGMENT_PERFORMANCE.sort((a, b) => b.revenue - a.revenue).map((s, i) => (
            <div key={s.segment} className="grid grid-cols-[140px_70px_80px_80px_110px_110px] gap-3 px-5 py-3 hover:bg-white/[0.02] items-center">
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">#1</span>}
                <span className="text-[13px] font-semibold text-white">{s.segment}</span>
              </div>
              <span className="text-[12px] text-white/60 text-right">{s.leads}</span>
              <div className="flex flex-col items-end">
                <span className="text-[12px] text-white/70">{s.replyRate}%</span>
                <div className="h-1 w-12 bg-white/[0.06] rounded-full mt-0.5">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${s.replyRate}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[12px] text-white/70">{s.closeRate}%</span>
                <div className="h-1 w-12 bg-white/[0.06] rounded-full mt-0.5">
                  <div className="h-full rounded-full bg-green-400" style={{ width: `${s.closeRate}%` }} />
                </div>
              </div>
              <span className="text-[12px] text-white/70 text-right">{s.avgTicket.toLocaleString('pl-PL')} PLN</span>
              <span className="text-[12px] font-bold text-[#6366f1] text-right">{s.revenue.toLocaleString('pl-PL')} PLN</span>
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      {/* Pipeline Velocity + Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-white">Pipeline Velocity</p>
            <p className="text-[11px] text-white/40 mt-0.5">Średni czas w każdym etapie (dni)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PIPELINE_VELOCITY} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" width={130} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="avgDays" name="Dni" fill="#6366f1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-white">Win/Loss Analysis</p>
            <p className="text-[11px] text-white/40 mt-0.5">Powody przegranych dealów</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={WIN_LOSS_REASONS} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="percentage">
                  {WIN_LOSS_REASONS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {WIN_LOSS_REASONS.map((r) => (
                <div key={r.reason}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />
                      <span className="text-[12px] text-white/60">{r.reason}</span>
                    </div>
                    <span className="text-[13px] font-bold text-white">{r.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05]">
            <AlertCircle size={13} className="text-white/20 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/30 leading-relaxed italic">
              Brak danych — wnioski AI pojawią się automatycznie na podstawie Twoich rzeczywistych wygranych i przegranych szans.
            </p>
          </div>
        </div>
      </div>

      {/* Outreach Funnel */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
        <div className="mb-5">
          <p className="text-[14px] font-semibold text-white">Lejek Outreach – kwiecień 2026</p>
          <p className="text-[11px] text-white/40 mt-0.5">Konwersja na każdym etapie</p>
        </div>
        <div className="flex items-end gap-3 justify-between">
          {OUTREACH_FUNNEL.map((f, i) => {
            const maxCount = OUTREACH_FUNNEL[0].count
            const heightPct = (f.count / maxCount) * 100
            const convRate = i > 0 ? Math.round((f.count / OUTREACH_FUNNEL[i-1].count) * 100) : 100
            return (
              <div key={f.stage} className="flex-1 flex flex-col items-center">
                <p className="text-[11px] font-bold text-white mb-1">{f.count}</p>
                <div className="w-full rounded-[8px]" style={{ height: `${Math.max(heightPct * 1.6, 20)}px`, background: f.color, opacity: 0.75 }} />
                <p className="text-[9px] text-white/40 mt-1.5 text-center leading-tight">{f.stage}</p>
                {i > 0 && <p className="text-[9px] font-bold mt-0.5" style={{ color: f.color }}>{convRate}% CR</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue per segment chart */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
        <div className="mb-4">
          <p className="text-[14px] font-semibold text-white">Przychód per segment</p>
          <p className="text-[11px] text-white/40 mt-0.5">Łączne przychody wygenerowane z każdego segmentu ICP</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[...SEGMENT_PERFORMANCE].sort((a, b) => b.revenue - a.revenue)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="segment" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="revenue" name="Revenue (PLN)" fill="#6366f1" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
