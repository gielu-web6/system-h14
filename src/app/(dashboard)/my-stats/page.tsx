'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, Trophy, Send, MessageSquare,
  Calendar, Percent, DollarSign, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'

interface StatsData {
  wonDeals: number
  wonValue: number
  activeDeals: number
  outreachSentThisMonth: number
  outreachSentThisWeek: number
  meetingsThisMonth: number
  topLostReason: string | null
  recentWins: Array<{ title: string; value: number; won_at: string }>
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = '#6366f1',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="bg-card border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <p className="text-[11px] text-white/50 font-medium">{label}</p>
      </div>
      <p className="text-[22px] font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-white/35 mt-1">{sub}</p>}
    </div>
  )
}

export default function MyStatsPage() {
  const { user, isSales } = useAppUser()
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSales) router.replace('/demo')
  }, [isSales, router])

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString()

      const [wonResult, activeResult, outreachMonthResult, outreachWeekResult, meetingsResult, lostResult, recentWinsResult] =
        await Promise.all([
          supabase
            .from('deals')
            .select('value, won_at')
            .eq('stage', 'wygrana')
            .gte('won_at', startOfMonth),
          supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .not('stage', 'in', '("wygrana","przegrana","nie_teraz")'),
          supabase
            .from('outreach_messages')
            .select('*', { count: 'exact', head: true })
            .gte('sent_at', startOfMonth),
          supabase
            .from('outreach_messages')
            .select('*', { count: 'exact', head: true })
            .gte('sent_at', startOfWeek),
          supabase
            .from('meetings')
            .select('*', { count: 'exact', head: true })
            .gte('starts_at', startOfMonth),
          supabase
            .from('deals')
            .select('lost_reason')
            .eq('stage', 'przegrana')
            .gte('lost_at', startOfMonth)
            .not('lost_reason', 'is', null),
          supabase
            .from('deals')
            .select('title, value, won_at')
            .eq('stage', 'wygrana')
            .order('won_at', { ascending: false })
            .limit(5),
        ])

      const wonDeals = wonResult.data ?? []
      const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0)

      // Top lost reason
      const reasonCounts: Record<string, number> = {}
      for (const d of lostResult.data ?? []) {
        if (d.lost_reason) reasonCounts[d.lost_reason] = (reasonCounts[d.lost_reason] ?? 0) + 1
      }
      const topLostReason =
        Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      setStats({
        wonDeals: wonDeals.length,
        wonValue,
        activeDeals: activeResult.count ?? 0,
        outreachSentThisMonth: outreachMonthResult.count ?? 0,
        outreachSentThisWeek: outreachWeekResult.count ?? 0,
        meetingsThisMonth: meetingsResult.count ?? 0,
        topLostReason,
        recentWins: (recentWinsResult.data ?? []) as StatsData['recentWins'],
      })
    } catch (err) {
      console.error('[my-stats]', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (!isSales) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    )
  }

  const s = stats ?? {
    wonDeals: 0, wonValue: 0, activeDeals: 0,
    outreachSentThisMonth: 0, outreachSentThisWeek: 0,
    meetingsThisMonth: 0, topLostReason: null, recentWins: [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-white">Moje Wyniki</h1>
        <p className="text-[12px] text-white/40 mt-0.5">Twoje osobiste statystyki sprzedażowe</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Zamknięte (m-c)"
          value={`${s.wonValue.toLocaleString('pl-PL')} PLN`}
          sub={`${s.wonDeals} dealów`}
          icon={Trophy}
          color="#22c55e"
        />
        <StatCard
          label="Aktywne deale"
          value={s.activeDeals}
          icon={TrendingUp}
          color="#6366f1"
        />
        <StatCard
          label="Outreach (m-c)"
          value={s.outreachSentThisMonth}
          sub={`${s.outreachSentThisWeek} w tym tygodniu`}
          icon={Send}
          color="#f59e0b"
        />
        <StatCard
          label="Spotkania (m-c)"
          value={s.meetingsThisMonth}
          icon={Calendar}
          color="#ec4899"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent wins */}
        <div className="bg-card border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={15} className="text-[#22c55e]" />
            <p className="text-[13px] font-semibold text-white">Ostatnie wygrane</p>
          </div>
          {s.recentWins.length === 0 ? (
            <p className="text-[12px] text-white/30 text-center py-4">Brak wygranych w tym miesiącu</p>
          ) : (
            <div className="space-y-2">
              {s.recentWins.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-white">{w.title}</p>
                    <p className="text-[10px] text-white/40">
                      {w.won_at ? new Date(w.won_at).toLocaleDateString('pl-PL') : '—'}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-[#22c55e]">
                    {(w.value ?? 0).toLocaleString('pl-PL')} PLN
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top objection + tips */}
        <div className="bg-card border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-[#f59e0b]" />
            <p className="text-[13px] font-semibold text-white">Insights</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Najczęstsza obiekcja (m-c)</p>
              <p className="text-[13px] text-white/80">{s.topLostReason ?? '— brak danych'}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#6366f1]/[0.08] border border-accent/20">
              <p className="text-[10px] text-accent uppercase tracking-wide mb-1">Cel tygodniowy</p>
              <div className="flex items-center gap-2">
                <Send size={12} className="text-accent" />
                <p className="text-[12px] text-white/70">30–50 wiadomości Takt 1 dziennie</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Percent size={12} className="text-accent" />
                <p className="text-[12px] text-white/70">Cel: 15% odpowiedzi na Takt 1</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign size={12} className="text-accent" />
                <p className="text-[12px] text-white/70">Prowizja za zamknięty deal: indywidualna</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
