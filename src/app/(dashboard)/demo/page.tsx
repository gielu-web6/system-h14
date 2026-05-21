'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, TrendingUp, MessageSquare, DollarSign, Target,
  ArrowUpRight, PlusCircle, MessageCircle, ReceiptText,
  ChevronRight, Clock, Zap, BookOpen, CheckSquare,
  Square, Plus, X, Share2, Trash2, Check,
} from 'lucide-react'
import { useAppUser } from '@/contexts/UserContext'
import { createClient } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'
import { isDemoMode, getCurrentUser } from '@/lib/userStore'
import { DEMO_KPI, DEMO_PNL } from '@/lib/demo-data'

interface KpiData {
  leadsThisMonth: number
  activeDeals: number
  revenueThisMonth: number
}

function formatPLN(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(0) + ' tys. PLN'
  return value + ' PLN'
}

// ─── Tasks Widget ─────────────────────────────────────────────────────────────

function TasksWidget() {
  const { tasks, loading, create, toggle, remove } = useTasks()
  const [newTitle, setNewTitle] = useState('')
  const [shareWithMaciek, setShareWithMaciek] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await create({
      title: newTitle.trim(),
      assigned_to: shareWithMaciek ? 'maciek' : undefined,
      due_date: new Date().toISOString().slice(0, 10),
    })
    setNewTitle('')
    setShareWithMaciek(false)
    setAdding(false)
  }

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CheckSquare size={15} className="text-[#6366f1]" />
        <p className="text-[14px] font-semibold text-white">Zadania na dziś</p>
        {pending.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc] text-[10px] font-bold">{pending.length}</span>
        )}
      </div>

      {/* Always-visible add form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="+ Dodaj zadanie na dziś..."
            className="flex-1 px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]/60 transition-all"
          />
          <button type="submit" disabled={adding || !newTitle.trim()}
            className="flex-shrink-0 px-3.5 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[12px] font-bold disabled:opacity-40 hover:bg-[#5254cc] transition-all">
            {adding ? '…' : <Plus size={16} />}
          </button>
        </div>
        {newTitle.trim() && (
          <label className="flex items-center gap-2 cursor-pointer px-1">
            <button type="button" onClick={() => setShareWithMaciek(v => !v)}
              className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all ${shareWithMaciek ? 'bg-violet-500 border-violet-500' : 'bg-white/[0.04] border-white/[0.20]'}`}>
              {shareWithMaciek && <Check size={10} className="text-white" />}
            </button>
            <span className="flex items-center gap-1 text-[12px] text-white/50">
              <Share2 size={11} className="text-violet-400" />
              Udostępnij Maćkowi
            </span>
          </label>
        )}
      </form>

      {loading ? (
        <div className="py-4 text-center text-[12px] text-white/30">Ładowanie…</div>
      ) : tasks.length === 0 ? (
        <p className="text-center text-[12px] text-white/20 py-2">Brak zadań — wpisz coś powyżej</p>
      ) : (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
          {pending.map(task => (
            <div key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-white/[0.03] hover:bg-white/[0.05] group transition-colors">
              <button onClick={() => void toggle(task.id)} className="flex-shrink-0 mt-0.5 text-white/30 hover:text-[#6366f1] transition-colors">
                <Square size={15} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white leading-tight">{task.title}</p>
                {task.assigned_to === 'maciek' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-violet-400/70">
                    <Share2 size={9} /> Udostępnione Maćkowi
                  </span>
                )}
              </div>
              <button onClick={() => void remove(task.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all p-0.5">
                <X size={13} />
              </button>
            </div>
          ))}
          {done.length > 0 && (
            <div className="pt-1 mt-1 border-t border-white/[0.05]">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wide px-1 mb-1.5">Ukończone ({done.length})</p>
              {done.map(task => (
                <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-[8px] group">
                  <button onClick={() => void toggle(task.id)} className="flex-shrink-0 mt-0.5 text-[#6366f1]/50 hover:text-[#6366f1] transition-colors">
                    <CheckSquare size={15} />
                  </button>
                  <p className="flex-1 text-[12px] text-white/30 line-through leading-tight">{task.title}</p>
                  <button onClick={() => void remove(task.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/60 transition-all p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAppUser()
  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

  const [kpi, setKpi] = useState<KpiData>({ leadsThisMonth: 0, activeDeals: 0, revenueThisMonth: 0 })
  const [kpiLoading, setKpiLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setKpi({
        leadsThisMonth: DEMO_KPI.leadsThisMonth,
        activeDeals: DEMO_KPI.activeDeals,
        revenueThisMonth: DEMO_KPI.revenueThisMonth,
      })
      setKpiLoading(false)
      return
    }

    async function loadKpi() {
      const supabase = createClient()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [leadsRes, dealsRes, incomeRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .not('stage', 'in', '("wygrana","przegrana","nie_teraz")'),
        supabase
          .from('income')
          .select('paid_amount')
          .eq('status', 'oplacona')
          .gte('paid_date', monthStart.slice(0, 10)),
      ])

      const revenue = (incomeRes.data ?? []).reduce(
        (sum: number, row: { paid_amount: number | null }) => sum + (row.paid_amount ?? 0), 0
      )

      setKpi({
        leadsThisMonth: leadsRes.count ?? 0,
        activeDeals: dealsRes.count ?? 0,
        revenueThisMonth: revenue,
      })
      setKpiLoading(false)
    }
    loadKpi()
  }, [])

  const isDemo = isDemoMode()
  const replyRateValue = isDemo ? DEMO_KPI.replyRate : '—'

  const kpiCards = [
    { label: 'Leady w tym miesiącu', value: kpiLoading ? '…' : String(kpi.leadsThisMonth),      icon: Users,        color: '#6366f1', href: '/leads',    sub: 'dodane w tym miesiącu' },
    { label: 'Aktywne deale',        value: kpiLoading ? '…' : String(kpi.activeDeals),          icon: TrendingUp,   color: '#22c55e', href: '/pipeline', sub: 'w toku (bez zakończonych)' },
    { label: 'Reply rate',           value: replyRateValue,                                       icon: MessageSquare,color: '#f59e0b', href: '/outreach', sub: isDemo ? 'ze wszystkich wiadomości' : 'wkrótce dostępne' },
    { label: 'Przychód miesiąc',     value: kpiLoading ? '…' : formatPLN(kpi.revenueThisMonth), icon: DollarSign,   color: '#06b6d4', href: '/finance',  sub: 'opłacone faktury' },
  ]

  return (
    <div className="max-w-[1400px] space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">
            Dzień dobry, {isDemo ? 'Adrian' : (user?.fullName ?? 'tam')} 👋
          </h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <Link href="/leads" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.07] hover:text-white transition-all">
            <PlusCircle size={13} /> Dodaj lead
          </Link>
          <Link href="/outreach" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-[12px] font-medium hover:bg-white/[0.07] hover:text-white transition-all">
            <MessageCircle size={13} /> Nowa wiadomość
          </Link>
          <Link href="/finance" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/20 transition-all">
            <ReceiptText size={13} /> Dodaj przychód
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group bg-[#16213E] border border-white/[0.07] rounded-[14px] p-4 hover:border-white/15 hover:bg-[#1a2748] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: kpi.color + '20' }}>
                <kpi.icon size={17} style={{ color: kpi.color }} />
              </div>
              <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors mt-0.5" />
            </div>
            <p className="text-[11px] text-white/40 mb-1">{kpi.label}</p>
            <p className="text-[22px] font-bold text-white tracking-tight leading-none">{kpi.value}</p>
            <p className="text-[11px] text-white/25 mt-2">{kpi.sub}</p>
          </Link>
        ))}
      </div>

      {/* Cel miesięczny */}
      {(() => {
        const goalRevenue = isDemo ? DEMO_KPI.monthlyGoal : 0
        const currentRevenue = kpi.revenueThisMonth
        const pct = goalRevenue > 0 ? Math.min(100, Math.round(currentRevenue / goalRevenue * 100)) : 0
        return (
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-[#6366f1]" />
            <span className="text-[13px] font-semibold text-white">Cel przychodowy — bieżący miesiąc</span>
          </div>
          <span className="text-[13px] text-white/30">{pct}%</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-white/30">{isDemo ? `${formatPLN(currentRevenue)} z ${formatPLN(goalRevenue)} celu` : 'Dodaj przychód w zakładce Finanse'}</span>
          <Link href="/finance" className="text-[11px] text-[#6366f1]/60 hover:text-[#6366f1] transition-colors">
            Przejdź →
          </Link>
        </div>
      </div>
        )
      })()}

      {/* P&L mini chart (demo only) */}
      {isDemo && (
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-[#6366f1]" />
            <p className="text-[14px] font-semibold text-white">P&L — ostatnie 6 miesięcy</p>
          </div>
          <div className="flex items-end gap-2 h-[80px]">
            {DEMO_PNL.map((m) => {
              const max = Math.max(...DEMO_PNL.map(x => x.revenue))
              const revH = Math.round((m.revenue / max) * 76)
              const costH = Math.round((m.costs / max) * 76)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 76 }}>
                    <div className="w-[45%] rounded-t-[3px] bg-[#6366f1]/70" style={{ height: revH }} title={`Przychód: ${m.revenue} PLN`} />
                    <div className="w-[45%] rounded-t-[3px] bg-red-500/40" style={{ height: costH }} title={`Koszty: ${m.costs} PLN`} />
                  </div>
                  <span className="text-[10px] text-white/30">{m.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-white/40"><span className="w-3 h-2 rounded-sm bg-[#6366f1]/70 inline-block" /> Przychód</span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/40"><span className="w-3 h-2 rounded-sm bg-red-500/40 inline-block" /> Koszty</span>
            <span className="ml-auto text-[11px] text-[#22c55e]">+52% vs 6 mies. temu</span>
          </div>
        </div>
      )}

      {/* Sugerowane leady (demo only) */}
      {isDemo && (
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-[#f59e0b]" />
            <p className="text-[14px] font-semibold text-white">Skontaktuj się dziś</p>
            <span className="text-[11px] text-white/30 ml-1">— system sugeruje kogo ruszyć</span>
          </div>
          <div className="space-y-2">
            {DEMO_KPI.suggestedLeads.map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
                <div className="w-7 h-7 rounded-full bg-[#f59e0b]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-[#f59e0b]">{name.split(' ').map(w => w[0]).join('').slice(0,2)}</span>
                </div>
                <span className="text-[13px] text-white">{name}</span>
                <Link href="/outreach" className="ml-auto text-[11px] text-[#6366f1]/60 hover:text-[#6366f1] transition-colors">
                  Wyślij →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: start guide + tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">

        {/* Quick start */}
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-[#6366f1]" />
            <p className="text-[14px] font-semibold text-white">Zacznij tutaj</p>
          </div>
          <div className="space-y-2">
            {[
              { href: '/knowledge-base', icon: BookOpen,     color: '#6366f1', title: '1. Wypełnij Bazę Wiedzy',     desc: 'Dodaj info o firmie, usługach i ICP — AI będzie lepiej działać' },
              { href: '/leads',          icon: Users,         color: '#22c55e', title: '2. Dodaj pierwszych leadów',   desc: 'Ręcznie lub przez import CSV z LinkedIn Sales Navigator' },
              { href: '/ai-scoring',     icon: Target,        color: '#f59e0b', title: '3. Uruchom AI Scoring',        desc: 'AI oceni leadów i wygeneruje personalizowane wiadomości' },
              { href: '/pipeline',       icon: TrendingUp,    color: '#06b6d4', title: '4. Otwórz deal w pipeline',    desc: 'Po pierwszym kontakcie przesuń lead do CRM Pipeline' },
              { href: '/content-generator', icon: MessageSquare, color: '#a78bfa', title: '5. Wygeneruj treści',       desc: 'Posty LinkedIn, Instagram, newsletter — AI na podstawie Twojej firmy' },
            ].map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
              >
                <div className="w-8 h-8 rounded-[8px] flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: step.color + '20' }}>
                  <step.icon size={14} style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white group-hover:text-white leading-tight">{step.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{step.desc}</p>
                </div>
                <ChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Tasks widget */}
        <TasksWidget />
      </div>

    </div>
  )
}
