'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Wand2, Camera, FileText, Plus, Calendar, CheckCircle2,
  Clock, Send, TrendingUp, Loader2, Building2, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSClient, CSPost } from '@/lib/content-studio/types'

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c',
  facebook: '#1877f2',
  linkedin: '#0077b5',
  google_business: '#4285f4',
  all: '#6366f1',
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  linkedin: 'LI',
  google_business: 'GMB',
  all: 'Wszystkie',
}

const STATUS_CONFIG = {
  draft: { label: 'Szkic', color: '#94a3b8' },
  pending_approval: { label: 'Do akceptacji', color: '#f59e0b' },
  approved: { label: 'Zatwierdzony', color: '#22c55e' },
  scheduled: { label: 'Zaplanowany', color: '#6366f1' },
  published: { label: 'Opublikowany', color: '#22c55e' },
  failed: { label: 'Błąd', color: '#ef4444' },
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07] flex items-center gap-3">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-[22px] font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function ContentStudioDashboard() {
  const [clients, setClients] = useState<CSClient[]>([])
  const [recentPosts, setRecentPosts] = useState<(CSPost & { cs_clients?: { business_name: string } })[]>([])
  const [stats, setStats] = useState({ total: 0, scheduled: 0, published: 0, drafts: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [clientsRes, postsRes] = await Promise.all([
      supabase.from('cs_clients').select('*').order('created_at', { ascending: false }),
      supabase
        .from('cs_posts')
        .select('*, cs_clients(business_name)')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setClients(clientsRes.data ?? [])
    const posts = postsRes.data ?? []
    setRecentPosts(posts)
    setStats({
      total: posts.length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
      drafts: posts.filter(p => p.status === 'draft').length,
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={20} className="animate-spin text-[#6366f1]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Wand2 size={20} className="text-[#6366f1]" />
            Content Studio
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">AI-powered social media dla Twoich klientów</p>
        </div>
        <Link
          href="/content-studio/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={14} /> Nowy klient
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Wszystkich postów" value={stats.total} icon={FileText} color="#6366f1" />
        <StatCard label="Zaplanowanych" value={stats.scheduled} icon={Calendar} color="#f59e0b" />
        <StatCard label="Opublikowanych" value={stats.published} icon={CheckCircle2} color="#22c55e" />
        <StatCard label="Szkiców" value={stats.drafts} icon={Clock} color="#94a3b8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Clients */}
        <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-white flex items-center gap-2">
              <Building2 size={14} className="text-[#a5b4fc]" /> Klienci ({clients.length})
            </p>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[12px] text-white/30">Brak klientów. Dodaj pierwszego!</p>
              <Link
                href="/content-studio/onboarding"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-[9px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all"
              >
                <Plus size={12} /> Dodaj klienta
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map(client => (
                <Link
                  key={client.id}
                  href={`/content-studio/clients/${client.id}`}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] hover:border-[#6366f1]/30 hover:bg-white/[0.06] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: client.brand_colors?.primary ?? '#6366f1' }}
                    >
                      {client.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{client.business_name}</p>
                      <p className="text-[10px] text-white/40">{client.business_type} · {client.subscription_status}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/25 group-hover:text-[#a5b4fc] transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-3">
          <p className="text-[13px] font-semibold text-white flex items-center gap-2">
            <Send size={14} className="text-[#a5b4fc]" /> Ostatnie posty
          </p>

          {recentPosts.length === 0 ? (
            <p className="text-[12px] text-white/30 py-6 text-center">Brak postów. Zacznij generować!</p>
          ) : (
            <div className="space-y-2">
              {recentPosts.slice(0, 8).map(post => {
                const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft
                const plt = post.platform ?? 'all'
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ background: PLATFORM_COLOR[plt] ?? '#6366f1' }}
                    >
                      {PLATFORM_LABEL[plt]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white/80 line-clamp-2 leading-snug">{post.caption}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {post.cs_clients && (
                          <span className="text-[10px] text-white/30">{post.cs_clients.business_name}</span>
                        )}
                        <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/content-studio/onboarding', icon: Building2, label: 'Onboarding klienta', sub: 'Brand voice & ustawienia', color: '#6366f1' },
          { href: '#', icon: Camera, label: 'Wgraj zdjęcia', sub: 'Analiza AI + galeria', color: '#ec4899' },
          { href: '#', icon: TrendingUp, label: 'Analityka', sub: 'Zasięgi i zaangażowanie', color: '#22c55e' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07] hover:border-white/[0.15] transition-all group flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}1a` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">{item.label}</p>
              <p className="text-[11px] text-white/35">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
