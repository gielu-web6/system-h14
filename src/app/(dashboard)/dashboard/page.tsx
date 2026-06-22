'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, TrendingUp, MessageSquare, DollarSign, Target,
  ArrowUpRight, PlusCircle, MessageCircle, ReceiptText,
  ChevronRight, Clock, Zap, BookOpen, Brain, Timer,
} from 'lucide-react'
import { useAppUser } from '@/contexts/UserContext'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/userStore'
import { TasksWidget } from '@/components/dashboard/TasksWidget'
import { DEMO_KPI, DEMO_PNL } from '@/lib/demo-data'

interface KpiData {
  leadsThisMonth: number
  activeDeals: number
  revenueThisMonth: number
}

interface RoiData {
  hoursSaved: number
  pipelineValue: number
  messagesSent: number
  offersSent: number
}

function formatPLN(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(0) + ' tys. PLN'
  return value + ' PLN'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAppUser()
  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

  const [kpi, setKpi]           = useState<KpiData>({ leadsThisMonth: 0, activeDeals: 0, revenueThisMonth: 0 })
  const [kpiLoading, setKpiLoading] = useState(true)
  const [roi, setRoi]           = useState<RoiData | null>(null)
  const [replyRate, setReplyRate] = useState<string>('—')

  useEffect(() => {
    if (isDemoMode()) {
      setKpi({
        leadsThisMonth: DEMO_KPI.leadsThisMonth,
        activeDeals:    DEMO_KPI.activeDeals,
        revenueThisMonth: DEMO_KPI.revenueThisMonth,
      })
      setKpiLoading(false)
      setRoi({ hoursSaved: 47, pipelineValue: 185000, messagesSent: 124, offersSent: 18 })
      return
    }

    async function loadKpi() {
      const supabase = createClient()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      try {
        const [leadsRes, dealsRes, wonRes] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
          supabase.from('deals').select('id', { count: 'exact', head: true }).not('stage', 'in', '("wygrana","przegrana","nie_teraz")'),
          supabase.from('deals').select('value').eq('stage', 'wygrana').gte('won_at', monthStart),
        ])
        const revenue = (wonRes.data ?? []).reduce(
          (sum: number, row: { value: number | null }) => sum + (row.value ?? 0), 0
        )
        setKpi({ leadsThisMonth: leadsRes.count ?? 0, activeDeals: dealsRes.count ?? 0, revenueThisMonth: revenue })
      } catch {
        // KPI fallback — stays at defaults
      } finally {
        setKpiLoading(false)
      }

      // Reply rate — best-effort
      try {
        const [sentRes, repliedRes] = await Promise.all([
          supabase.from('outreach_messages').select('id', { count: 'exact', head: true }).not('sent_at', 'is', null),
          supabase.from('outreach_messages').select('id', { count: 'exact', head: true }).not('replied_at', 'is', null),
        ])
        const sent    = sentRes.count ?? 0
        const replied = repliedRes.count ?? 0
        if (sent > 0) setReplyRate(Math.round((replied / sent) * 100) + '%')
      } catch { /* stays '—' */ }

      // ROI queries are best-effort — don't block KPI display
      try {
        const [outreachRes, offersRes, aiLeadsRes, pipelineRes] = await Promise.all([
          supabase.from('outreach_messages').select('id', { count: 'exact', head: true }),
          supabase.from('deals').select('id', { count: 'exact', head: true }).not('offer_sent_at', 'is', null),
          supabase.from('leads').select('id', { count: 'exact', head: true }).not('ai_scored_at', 'is', null),
          supabase.from('deals').select('value').not('stage', 'in', '("wygrana","przegrana","nie_teraz")'),
        ])
        const msgs    = outreachRes.count ?? 0
        const offers  = offersRes.count ?? 0
        const scored  = aiLeadsRes.count ?? 0
        const pipelineValue = (pipelineRes.data ?? []).reduce(
          (s: number, r: { value: number | null }) => s + (r.value ?? 0), 0
        )
        const hoursSaved = Math.round((msgs * 12 + offers * 45 + scored * 5) / 60)
        setRoi({ hoursSaved, pipelineValue, messagesSent: msgs, offersSent: offers })
      } catch {
        // ROI widget stays hidden if queries fail
      }
    }
    loadKpi()
  }, [])

  const isDemo = isDemoMode()
  const replyRateValue = isDemo ? DEMO_KPI.replyRate : replyRate

  const kpiCards = [
    { label: 'Leady / miesiąc',   value: kpiLoading ? '…' : String(kpi.leadsThisMonth),      icon: Users,         iconColor: 'text-info',   iconBg: 'bg-info/[0.12]',   glowClass: 'glow-blue',   arrowHover: 'group-hover:text-info',   topColor: 'var(--c-blue)',   href: '/leads',    sub: 'dodane w tym miesiącu',              isHero: false },
    { label: 'Aktywne deale',     value: kpiLoading ? '…' : String(kpi.activeDeals),          icon: TrendingUp,    iconColor: 'text-violet', iconBg: 'bg-violet/[0.12]', glowClass: 'glow-violet', arrowHover: 'group-hover:text-violet', topColor: 'var(--c-violet)', href: '/pipeline', sub: 'w toku (bez zakończonych)',          isHero: false },
    { label: 'Reply rate',        value: replyRateValue,                                       icon: MessageSquare, iconColor: 'text-amber',  iconBg: 'bg-amber/[0.12]',  glowClass: 'glow-amber',  arrowHover: 'group-hover:text-amber',  topColor: 'var(--c-amber)',  href: '/outreach', sub: isDemo ? 'ze wszystkich wiadomości' : 'wkrótce dostępne', isHero: false },
    { label: 'Przychód miesiąc',  value: kpiLoading ? '…' : formatPLN(kpi.revenueThisMonth), icon: DollarSign,    iconColor: 'text-accent', iconBg: 'bg-accent/[0.12]', glowClass: 'glow-teal',   arrowHover: 'group-hover:text-accent', topColor: 'var(--accent)',   href: '/finance',  sub: 'wygrane deale (ten miesiąc)',        isHero: true  },
  ]

  const goalRevenue = isDemo ? DEMO_KPI.monthlyGoal : 0
  const pct = goalRevenue > 0 ? Math.min(100, Math.round(kpi.revenueThisMonth / goalRevenue * 100)) : 0

  return (
    <div className="max-w-[1400px] space-y-5">

      {/* ── Header ── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* atmosferyczna poświata teal za tytułem */}
        <div className="absolute -inset-x-4 -top-8 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(55% 80% at 20% 0%, color-mix(in srgb, var(--accent) 6%, transparent), transparent 72%)' }} />
        <div className="relative">
          <h1 className="text-[27px] font-bold text-fg tracking-tight leading-none">
            Dzień dobry, {isDemo ? 'Adrian' : (user?.fullName ?? 'tam')}
          </h1>
          <p className="text-[12px] text-muted mt-1.5 capitalize">{today}</p>
        </div>
        <div className="relative flex items-center gap-2 flex-wrap sm:justify-end">
          <Link href="/leads"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-raised border border-border
              text-muted text-[12px] font-medium hover:border-accent/40 hover:bg-accent/[0.06] hover:text-fg transition-colors">
            <PlusCircle size={12} /> Dodaj lead
          </Link>
          <Link href="/outreach"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-raised border border-border
              text-muted text-[12px] font-medium hover:border-accent/40 hover:bg-accent/[0.06] hover:text-fg transition-colors">
            <MessageCircle size={12} /> Nowa wiadomość
          </Link>
          <Link href="/finance"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-accent/10 border border-accent/20
              text-accent text-[12px] font-medium hover:bg-accent/15 hover:border-accent/40 hover:shadow-[var(--glow-teal)] transition-all">
            <ReceiptText size={12} /> Dodaj przychód
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="kpi-card group p-5"
            style={{ '--card-accent': card.topColor } as React.CSSProperties}
          >
            {/* hero: gradient wash */}
            {card.isHero && (
              <div className="absolute inset-0 pointer-events-none rounded-[14px]"
                style={{ background: 'var(--gradient-signature)', opacity: 0.14 }} />
            )}
            <div className="relative flex items-start justify-between mb-4">
              <div className="kpi-icon w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0">
                <card.icon size={20} style={{ color: 'var(--card-accent)' }} />
              </div>
              <ArrowUpRight size={13} className={`text-subtle transition-colors mt-0.5 ${card.arrowHover}`} />
            </div>
            <p className="relative section-label mb-1.5">{card.label}</p>
            <p className={`relative text-[36px] font-bold tracking-tight leading-none num ${card.isHero ? 'text-accent' : 'text-fg'}`}>
              {card.value}
            </p>
            <p className="relative text-[11px] text-muted mt-2 leading-snug">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* ── ROI Counter ── */}
      {roi && (
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={14} className="text-accent" />
            <p className="text-[13.5px] font-semibold text-fg">Co H14 zrobiło za Ciebie</p>
            <span className="text-[11px] text-muted ml-1 font-normal">— na podstawie Twojej aktywności w systemie</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: Timer,
                color: '#E8A838',
                label: 'Godziny zaoszczędzone',
                value: `~${roi.hoursSaved} godz.`,
                sub: `${roi.messagesSent} wiad. × 12 min + ${roi.offersSent} ofert × 45 min`,
              },
              {
                icon: TrendingUp,
                color: '#30c060',
                label: "Wartość pipeline'u",
                value: formatPLN(roi.pipelineValue),
                sub: 'suma aktywnych dealów',
              },
              {
                icon: MessageSquare,
                color: '#60a5fa',
                label: 'Wiadomości wysłane',
                value: String(roi.messagesSent),
                sub: 'łącznie przez system',
              },
              {
                icon: ReceiptText,
                color: '#a78bfa',
                label: 'Oferty wygenerowane',
                value: String(roi.offersSent),
                sub: 'z behawioralnym trackingiem',
              },
            ].map((item) => (
              <div key={item.label} className="kpi-card p-3.5"
                style={{ '--card-accent': item.color } as React.CSSProperties}>
                <div className="relative flex items-center gap-2 mb-2.5">
                  <div className="kpi-icon w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0">
                    <item.icon size={13} style={{ color: 'var(--card-accent)' }} />
                  </div>
                  <p className="text-[10.5px] text-muted font-medium leading-tight">{item.label}</p>
                </div>
                <p className="relative text-[20px] font-bold text-fg tracking-tight leading-none num">{item.value}</p>
                <p className="relative text-[10px] text-subtle mt-1.5 leading-snug">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly goal ── */}
      <div className="card-elevated p-4" style={{ '--card-accent': 'var(--accent)' } as React.CSSProperties}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent" />
            <span className="text-[13px] font-semibold text-fg">Cel przychodowy — bieżący miesiąc</span>
          </div>
          <span className="num text-[12px] text-muted">{pct}%</span>
        </div>
        <div className="h-3 bg-raised rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${pct}%`, boxShadow: pct > 0 ? 'var(--glow-teal)' : 'none' }} />
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] text-subtle">
            {isDemo
              ? `${formatPLN(kpi.revenueThisMonth)} z ${formatPLN(goalRevenue)} celu`
              : pct === 0
                ? 'Brak wygranych dealów w tym miesiącu'
                : 'Wygrane deale — pipeline'}
          </span>
          <Link href="/finance" className="text-[11px] text-accent/60 hover:text-accent transition-colors">Przejdź →</Link>
        </div>
      </div>

      {/* ── P&L mini chart (demo) ── */}
      {isDemo && (
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-[13.5px] font-semibold text-fg">P&L — ostatnie 6 miesięcy</p>
          </div>
          <div className="flex items-end gap-2 h-[72px]">
            {DEMO_PNL.map((m) => {
              const max = Math.max(...DEMO_PNL.map(x => x.revenue))
              const revH = Math.round((m.revenue / max) * 68)
              const costH = Math.round((m.costs / max) * 68)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-px w-full justify-center" style={{ height: 68 }}>
                    <div className="w-[46%] rounded-t-[2px] bg-accent/60" style={{ height: revH }}
                      title={`Przychód: ${m.revenue} PLN`} />
                    <div className="w-[46%] rounded-t-[2px] bg-danger/35" style={{ height: costH }}
                      title={`Koszty: ${m.costs} PLN`} />
                  </div>
                  <span className="section-label">{m.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="w-3 h-2 rounded-[2px] bg-accent/60 inline-block" /> Przychód
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="w-3 h-2 rounded-[2px] bg-danger/35 inline-block" /> Koszty
            </span>
            <span className="ml-auto text-[11px] text-success num">+52% vs 6 mies. temu</span>
          </div>
        </div>
      )}

      {/* ── Sugerowane leady (demo) ── */}
      {isDemo && (
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber" />
            <p className="text-[13.5px] font-semibold text-fg">Skontaktuj się dziś</p>
            <span className="text-[11px] text-subtle ml-1">— system sugeruje kogo ruszyć</span>
          </div>
          <div className="space-y-1.5">
            {DEMO_KPI.suggestedLeads.map((name, i) => (
              <div key={i}
                className="list-row flex items-center gap-3 p-2.5">
                <div className="w-7 h-7 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-amber num">
                    {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <span className="text-[12.5px] text-fg">{name}</span>
                <Link href="/outreach" className="ml-auto text-[11px] text-accent/60 hover:text-accent transition-colors">
                  Wyślij →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Start guide + Tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

        {/* Quick start */}
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-accent" />
            <p className="text-[13.5px] font-semibold text-fg">Zacznij tutaj</p>
          </div>
          <div className="space-y-1.5">
            {[
              { href: '/knowledge-base', icon: BookOpen,        color: '#60a5fa', title: '1. Wypełnij Bazę Wiedzy',     desc: 'Dodaj info o firmie, usługach i ICP — AI będzie lepiej działać' },
              { href: '/leads',          icon: Users,            color: '#30c060', title: '2. Dodaj pierwszych leadów',  desc: 'Ręcznie lub przez import CSV z LinkedIn Sales Navigator' },
              { href: '/ai-scoring',     icon: Target,           color: '#f0a040', title: '3. Uruchom AI Scoring',       desc: 'AI oceni leadów i wygeneruje personalizowane wiadomości' },
              { href: '/pipeline',       icon: TrendingUp,       color: '#00c8be', title: '4. Otwórz deal w pipeline',   desc: 'Po pierwszym kontakcie przesuń lead do CRM Pipeline' },
              { href: '/content-generator', icon: MessageSquare, color: '#a78bfa', title: '5. Wygeneruj treści',        desc: 'Posty LinkedIn, Instagram, newsletter — AI na podstawie Twojej firmy' },
            ].map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="list-row flex items-start gap-3 p-3 group transition-all hover:-translate-y-px"
              >
                <div className="w-7 h-7 rounded-[7px] flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: step.color + '18' }}>
                  <step.icon size={13} style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-fg leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-snug">{step.desc}</p>
                </div>
                <ChevronRight size={12} className="text-subtle group-hover:text-fg group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <TasksWidget />
      </div>
    </div>
  )
}
