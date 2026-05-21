'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FileText, Calendar, Loader2, CheckCircle2, Clock,
  Send, AlertCircle, Plus, Wand2, Globe,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSPost } from '@/lib/content-studio/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { pl } from 'date-fns/locale'

const STATUS_CONFIG = {
  draft: { label: 'Szkic', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: FileText },
  pending_approval: { label: 'Do akceptacji', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  approved: { label: 'Zatwierdzony', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
  scheduled: { label: 'Zaplanowany', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: Calendar },
  published: { label: 'Opublikowany', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
  failed: { label: 'Błąd', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Globe, facebook: Globe, linkedin: Globe, google_business: Globe, all: Globe,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c', facebook: '#1877f2', linkedin: '#0077b5',
  google_business: '#4285f4', all: '#6366f1',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', linkedin: 'LI', google_business: 'GMB', all: 'ALL',
}

function PostRow({ post, onClick }: { post: CSPost; onClick: () => void }) {
  const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft
  const plt = post.platform ?? 'all'
  const StatusIcon = cfg.icon

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
    >
      <div
        className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
        style={{ background: `${PLATFORM_COLORS[plt]}20`, color: PLATFORM_COLORS[plt] }}
      >
        {PLATFORM_LABELS[plt] ?? plt.toUpperCase().slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-white/80 line-clamp-1">{post.caption}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
          {post.scheduled_at && (
            <span className="text-[10px] text-white/30">
              {format(new Date(post.scheduled_at), 'dd MMM, HH:mm', { locale: pl })}
            </span>
          )}
          {post.platform && <span className="text-[10px] text-white/25">{post.platform}</span>}
        </div>
      </div>

      <div className="flex-shrink-0">
        <StatusIcon size={13} style={{ color: cfg.color }} />
      </div>
    </div>
  )
}

export default function PostsPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const [posts, setPosts] = useState<CSPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<CSPost | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('cs_posts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  const filtered = statusFilter === 'all' ? posts : posts.filter(p => p.status === statusFilter)

  // Calendar data
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const scheduledPosts = posts.filter(p => p.scheduled_at)

  function getPostsForDay(day: Date) {
    return scheduledPosts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day))
  }

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-[#6366f1]" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-[#22c55e]" /> Posty & Kalendarz
          </h1>
          <p className="text-[11px] text-white/40 mt-0.5">{posts.length} postów łącznie</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(v => v === 'list' ? 'calendar' : 'list')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] hover:text-white transition-all"
          >
            {view === 'list' ? <><Calendar size={12} /> Kalendarz</> : <><FileText size={12} /> Lista</>}
          </button>
          <button
            onClick={() => router.push(`/content-studio/clients/${clientId}/generate`)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[12px] font-semibold transition-all"
          >
            <Plus size={13} /> Nowy post
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG.draft][]).map(([status, cfg]) => {
          const count = posts.filter(p => p.status === status).length
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-2 rounded-[10px] border text-center transition-all ${
                statusFilter === status
                  ? 'border-white/25'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
              }`}
              style={statusFilter === status ? { background: cfg.bg, borderColor: `${cfg.color}40` } : {}}
            >
              <p className="text-[16px] font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-[9px] text-white/35 mt-0.5">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {view === 'list' ? (
        /* ── List view ──────────────────────────────────────────────────────── */
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 size={24} className="text-white/15 mx-auto mb-3" />
              <p className="text-[12px] text-white/30">Brak postów. Wygeneruj pierwszy!</p>
              <button
                onClick={() => router.push(`/content-studio/clients/${clientId}/generate`)}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-[9px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all"
              >
                <Wand2 size={12} /> Generuj post
              </button>
            </div>
          ) : (
            filtered.map(post => (
              <PostRow key={post.id} post={post} onClick={() => setSelectedPost(post)} />
            ))
          )}
        </div>
      ) : (
        /* ── Calendar view ──────────────────────────────────────────────────── */
        <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(d => { const m = new Date(d); m.setMonth(m.getMonth() - 1); return m })}
              className="px-3 py-1.5 rounded-[7px] text-white/50 hover:text-white hover:bg-white/[0.06] text-[12px] transition-all"
            >
              ←
            </button>
            <p className="text-[14px] font-semibold text-white capitalize">
              {format(currentMonth, 'LLLL yyyy', { locale: pl })}
            </p>
            <button
              onClick={() => setCurrentMonth(d => { const m = new Date(d); m.setMonth(m.getMonth() + 1); return m })}
              className="px-3 py-1.5 rounded-[7px] text-white/50 hover:text-white hover:bg-white/[0.06] text-[12px] transition-all"
            >
              →
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Offset for first day */}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(day => {
              const dayPosts = getPostsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[52px] rounded-[8px] p-1.5 border transition-all ${
                    isToday(day)
                      ? 'border-[#6366f1]/50 bg-[#6366f1]/10'
                      : 'border-white/[0.05] hover:border-white/[0.12]'
                  }`}
                >
                  <p className={`text-[10px] font-semibold mb-1 ${isToday(day) ? 'text-[#a5b4fc]' : 'text-white/40'}`}>
                    {format(day, 'd')}
                  </p>
                  {dayPosts.slice(0, 2).map(post => {
                    const plt = post.platform ?? 'all'
                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="px-1.5 py-0.5 rounded-[4px] mb-0.5 cursor-pointer truncate"
                        style={{ background: `${PLATFORM_COLORS[plt]}20`, borderLeft: `2px solid ${PLATFORM_COLORS[plt]}` }}
                        title={post.caption}
                      >
                        <p className="text-[8px] font-medium truncate" style={{ color: PLATFORM_COLORS[plt] }}>
                          {post.caption.slice(0, 18)}…
                        </p>
                      </div>
                    )
                  })}
                  {dayPosts.length > 2 && (
                    <p className="text-[8px] text-white/30">+{dayPosts.length - 2} więcej</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Post detail overlay */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div
            className="bg-[#0F0F1A] border border-white/[0.12] rounded-[16px] p-5 max-w-[500px] w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const plt = selectedPost.platform ?? 'all'
                  const cfg = STATUS_CONFIG[selectedPost.status]
                  return (
                    <>
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[9px] font-bold" style={{ background: `${PLATFORM_COLORS[plt]}20`, color: PLATFORM_COLORS[plt] }}>
                        {PLATFORM_LABELS[plt] ?? plt.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                    </>
                  )
                })()}
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-white/40 hover:text-white transition-colors">
                ×
              </button>
            </div>

            <div className="bg-white/[0.03] rounded-[10px] p-3">
              <p className="text-[12px] text-white/70 leading-relaxed whitespace-pre-wrap">{selectedPost.caption}</p>
            </div>

            {selectedPost.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedPost.hashtags.map(h => (
                  <span key={h} className="px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#a5b4fc] text-[10px]">{h}</span>
                ))}
              </div>
            )}

            {selectedPost.scheduled_at && (
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Calendar size={12} />
                Zaplanowany: {format(new Date(selectedPost.scheduled_at), "dd MMM yyyy 'o' HH:mm", { locale: pl })}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { router.push(`/content-studio/clients/${clientId}/generate`); setSelectedPost(null) }}
                className="flex-1 py-2 rounded-[9px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all flex items-center justify-center gap-1.5"
              >
                <Wand2 size={12} /> Edytuj
              </button>
              <button className="flex-1 py-2 rounded-[9px] bg-[#6366f1] text-white text-[12px] font-semibold hover:bg-[#5254cc] transition-all flex items-center justify-center gap-1.5">
                <Send size={12} /> Publikuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
