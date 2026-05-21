'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, List, ChevronLeft, ChevronRight, Edit, Send, MoveRight, Plus, Users, User, Loader2, Trash2 } from 'lucide-react'
import { CHANNEL_CONFIG, type ContentPost, type ContentChannel } from '@/lib/mock-data/content'
import { createClient } from '@/lib/supabase/client'
import { useAppUser } from '@/contexts/UserContext'

const MOCK_CONTENT: ContentPost[] = []

// ─── Calendar event type ──────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  type: 'post' | 'meeting' | 'event'
  title: string
  description?: string
  date: string
  time?: string
  created_by: string
  shared: boolean
  color: string
}

const EVENT_TYPE_CONFIG = {
  post:    { label: 'Post',      color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  meeting: { label: 'Spotkanie', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  event:   { label: 'Wydarzenie',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  'opublikowany': { label: 'Opublikowany', bg: 'bg-green-500/15', text: 'text-green-400' },
  'zaplanowany':  { label: 'Zaplanowany',  bg: 'bg-blue-500/15',  text: 'text-blue-400' },
  'szkic':        { label: 'Szkic',         bg: 'bg-white/[0.07]', text: 'text-white/40' },
  'do-poprawki':  { label: 'Do poprawki',  bg: 'bg-amber-500/15', text: 'text-amber-400' },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Add event modal ──────────────────────────────────────────────────────────

function AddEventModal({
  date,
  onClose,
  onAdded,
  currentUser,
}: {
  date: string
  onClose: () => void
  onAdded: (event: CalendarEvent) => void
  currentUser: string
}) {
  const [type, setType]         = useState<CalendarEvent['type']>('post')
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [time, setTime]         = useState('')
  const [shared, setShared]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const newEvent = {
        type,
        title: title.trim(),
        description: description.trim() || null,
        date,
        time: time || null,
        created_by: currentUser,
        shared,
        color: EVENT_TYPE_CONFIG[type].color,
      }
      const { data, error: err } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select()
        .single()
      if (err) throw err
      onAdded(data as CalendarEvent)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px] bg-[#0F0F1A] border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <p className="text-[14px] font-bold text-white">Dodaj do kalendarza</p>
            <p className="text-[11px] text-white/40 mt-0.5 capitalize">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type picker */}
          <div>
            <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2">Typ</label>
            <div className="flex gap-2">
              {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEvent['type'], typeof EVENT_TYPE_CONFIG[CalendarEvent['type']]][]).map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className="flex-1 py-2 rounded-[8px] text-[12px] font-semibold border transition-all"
                  style={{
                    background: type === key ? conf.bg : 'rgba(255,255,255,0.03)',
                    borderColor: type === key ? conf.color + '60' : 'rgba(255,255,255,0.08)',
                    color: type === key ? conf.color : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Tytuł *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              placeholder={type === 'post' ? 'np. Post o zarządzaniu leadami' : type === 'meeting' ? 'np. Call z klientem X' : 'np. Launch nowego produktu'}
              className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Opis (opcjonalne)</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Dodatkowe notatki..."
              className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Godzina (opcjonalne)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
            />
          </div>

          {/* Visibility */}
          <button
            onClick={() => setShared(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border transition-all ${
              shared
                ? 'bg-[#6366f1]/10 border-[#6366f1]/40'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/15'
            }`}
          >
            {shared
              ? <Users size={15} className="text-[#6366f1] flex-shrink-0" />
              : <User  size={15} className="text-white/35 flex-shrink-0" />
            }
            <div className="text-left">
              <p className={`text-[12px] font-semibold ${shared ? 'text-[#a5b4fc]' : 'text-white/50'}`}>
                {shared ? 'Widoczne dla wszystkich użytkowników' : 'Tylko dla mnie'}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">
                {shared ? 'Bartosz i Karolina widzą to wydarzenie' : 'Kliknij aby udostępnić'}
              </p>
            </div>
          </button>

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] disabled:opacity-60 transition-all"
              style={{ background: EVENT_TYPE_CONFIG[type].color }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Zapisuję...' : 'Dodaj'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Event detail modal ───────────────────────────────────────────────────────

function EventDetailModal({
  event,
  onClose,
  onDelete,
  currentUser,
}: {
  event: CalendarEvent
  onClose: () => void
  onDelete: (id: string) => void
  currentUser: string
}) {
  const conf = EVENT_TYPE_CONFIG[event.type]
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('calendar_events').delete().eq('id', event.id)
      onDelete(event.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[400px] bg-[#0F0F1A] border border-white/[0.1] rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: conf.bg, color: conf.color }}>
                {conf.label}
              </span>
              {event.shared && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 text-[10px]">
                  <Users size={9} /> Udostępnione
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-bold text-white">{event.title}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {new Date(event.date + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {event.time && ` · ${event.time}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>
        <div className="p-5">
          {event.description && (
            <p className="text-[13px] text-white/60 leading-relaxed mb-4">{event.description}</p>
          )}
          <p className="text-[10px] text-white/25">Dodane przez: {event.created_by}</p>
          {event.created_by === currentUser && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition-all disabled:opacity-60"
            >
              <Trash2 size={12} /> {deleting ? 'Usuwam...' : 'Usuń'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Post modal ───────────────────────────────────────────────────────────────

function PostModal({ post, onClose }: { post: ContentPost; onClose: () => void }) {
  const channelConf = CHANNEL_CONFIG[post.channel]
  const statusConf  = STATUS_CONFIG[post.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] bg-[#0F0F1A] border border-white/[0.1] rounded-[16px] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: channelConf.bg, color: channelConf.color }}>{channelConf.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConf.bg} ${statusConf.text}`}>{statusConf.label}</span>
            </div>
            <h3 className="text-[14px] font-bold text-white">{post.title}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {new Date(post.scheduledDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })} · {post.scheduledTime}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[8px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2">Treść posta</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3">
              <pre className="text-[12px] text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{post.content}</pre>
            </div>
          </div>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.map(h => (
                <span key={h} className="px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#a5b4fc] text-[10px] font-medium">{h}</span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/55 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all"><Edit size={13} /> Edytuj</button>
            {post.status === 'zaplanowany' && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all"><Send size={13} /> Opublikuj teraz</button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.07] text-white/55 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all"><MoveRight size={13} /> Przesuń</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({
  year, month, posts, events, onPostClick, onDayClick, onEventClick,
}: {
  year: number
  month: number
  posts: ContentPost[]
  events: CalendarEvent[]
  onPostClick: (p: ContentPost) => void
  onDayClick: (date: string) => void
  onEventClick: (e: CalendarEvent) => void
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)

  const postsByDay = posts.reduce<Record<number, ContentPost[]>>((acc, p) => {
    const d = new Date(p.scheduledDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!acc[day]) acc[day] = []
      acc[day].push(p)
    }
    return acc
  }, {})

  const eventsByDay = events.reduce<Record<number, CalendarEvent[]>>((acc, e) => {
    const d = new Date(e.date + 'T12:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!acc[day]) acc[day] = []
      acc[day].push(e)
    }
    return acc
  }, {})

  const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {days.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="aspect-[4/3] min-h-[80px]" />
          const dayPosts  = postsByDay[day]  ?? []
          const dayEvents = eventsByDay[day] ?? []
          const allItems  = dayPosts.length + dayEvents.length
          const isToday   = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          const dateStr   = toDateStr(year, month, day)
          return (
            <div
              key={day}
              onClick={() => onDayClick(dateStr)}
              className={`group aspect-[4/3] min-h-[52px] sm:min-h-[80px] rounded-[8px] sm:rounded-[10px] p-1 sm:p-1.5 border transition-colors cursor-pointer ${
                isToday
                  ? 'bg-[#6366f1]/10 border-[#6366f1]/40'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-[#6366f1]/40 hover:bg-[#6366f1]/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[11px] font-bold ${isToday ? 'text-[#a5b4fc]' : 'text-white/40'}`}>{day}</p>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'bg-[#6366f1]/40' : 'bg-white/[0.08]'}`}>
                  <Plus size={9} className="text-white/70" />
                </div>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {/* Posts */}
                {dayPosts.slice(0, 2).map(p => (
                  <button
                    key={p.id}
                    onClick={e => { e.stopPropagation(); onPostClick(p) }}
                    className="w-full text-left px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium truncate opacity-85 hover:opacity-100"
                    style={{ background: CHANNEL_CONFIG[p.channel].bg, color: CHANNEL_CONFIG[p.channel].color }}
                  >
                    {p.title}
                  </button>
                ))}
                {/* Calendar events */}
                {dayEvents.slice(0, 2 - Math.min(dayPosts.length, 2)).map(ev => (
                  <button
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    className="w-full text-left px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium truncate opacity-85 hover:opacity-100 flex items-center gap-1"
                    style={{ background: EVENT_TYPE_CONFIG[ev.type].bg, color: EVENT_TYPE_CONFIG[ev.type].color }}
                  >
                    {ev.shared && <Users size={7} className="flex-shrink-0" />}
                    {ev.title}
                  </button>
                ))}
                {allItems > 3 && (
                  <p className="text-[9px] text-white/30 pl-1">+{allItems - 3} więcej</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  posts, events, onPostClick, onEventClick,
}: {
  posts: ContentPost[]
  events: CalendarEvent[]
  onPostClick: (p: ContentPost) => void
  onEventClick: (e: CalendarEvent) => void
}) {
  type ListItem = { date: string; isPost: true; post: ContentPost } | { date: string; isPost: false; event: CalendarEvent }
  const items: ListItem[] = [
    ...posts.map(p => ({ date: p.scheduledDate, isPost: true as const, post: p })),
    ...events.map(e => ({ date: e.date, isPost: false as const, event: e })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <Calendar size={28} className="text-white/15" />
        <p className="text-[13px] text-white/30">Brak wpisów w tym miesiącu</p>
        <p className="text-[11px] text-white/20">Kliknij na dowolny dzień w kalendarzu aby dodać wpis</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        if (item.isPost) {
          const p = item.post
          const channelConf = CHANNEL_CONFIG[p.channel]
          const statusConf  = STATUS_CONFIG[p.status]
          return (
            <button key={`post-${p.id}`} onClick={() => onPostClick(p)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: channelConf.dot }} />
              <div className="w-[90px] flex-shrink-0"><p className="text-[10px] text-white/40">{new Date(p.scheduledDate).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} {p.scheduledTime}</p></div>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-white truncate">{p.title}</p></div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:block" style={{ background: channelConf.bg, color: channelConf.color }}>{channelConf.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hidden md:block ${statusConf.bg} ${statusConf.text}`}>{statusConf.label}</span>
            </button>
          )
        } else {
          const ev = item.event
          const conf = EVENT_TYPE_CONFIG[ev.type]
          return (
            <button key={`ev-${ev.id}`} onClick={() => onEventClick(ev)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: conf.color }} />
              <div className="w-[90px] flex-shrink-0"><p className="text-[10px] text-white/40">{new Date(ev.date + 'T12:00:00').toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}{ev.time && ` ${ev.time}`}</p></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-white truncate">{ev.title}</p>
                  {ev.shared && <Users size={11} className="text-white/30 flex-shrink-0" />}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:block" style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
            </button>
          )
        }
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentCalendarPage() {
  const { user } = useAppUser()
  const [year, setYear]   = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null)
  const [channelFilter, setChannelFilter] = useState<ContentChannel | 'all'>('all')

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [addForDate, setAddForDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const monthName = new Date(year, month).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  const currentUserId = user?.id ?? 'unknown'

  // Load events from Supabase
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true })
      // Show own events + shared events from others
      const filtered = (data ?? []).filter((e: CalendarEvent) => e.created_by === currentUserId || e.shared)
      setEvents(filtered)
    } finally {
      setLoadingEvents(false)
    }
  }, [currentUserId])

  useEffect(() => { loadEvents() }, [loadEvents])

  const filteredPosts = channelFilter === 'all'
    ? MOCK_CONTENT
    : MOCK_CONTENT.filter(p => p.channel === channelFilter)

  // Filter events to current month for the counter
  const monthEvents = events.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  const totalItems = filteredPosts.length + monthEvents.length

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="max-w-[1200px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Calendar size={19} className="text-[#6366f1]" />
            Kalendarz Contentu
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            {totalItems > 0 ? `${totalItems} wpisów w tym miesiącu` : 'Kliknij na dzień aby dodać wpis'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-[8px] border transition-all ${viewMode === 'calendar' ? 'bg-[#6366f1]/15 border-[#6366f1]/30 text-[#a5b4fc]' : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white'}`}
          >
            <Calendar size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-[8px] border transition-all ${viewMode === 'list' ? 'bg-[#6366f1]/15 border-[#6366f1]/30 text-[#a5b4fc]' : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white'}`}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setAddForDate(toDateStr(year, month, new Date().getDate()))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/20 transition-all"
          >
            <Plus size={13} /> Nowy wpis
          </button>
        </div>
      </div>

      {/* Channel legend + filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setChannelFilter('all')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${channelFilter === 'all' ? 'bg-white/[0.12] border-white/20 text-white' : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white'}`}
        >
          Wszystkie
        </button>
        {(Object.entries(CHANNEL_CONFIG) as [ContentChannel, typeof CHANNEL_CONFIG[ContentChannel]][]).map(([key, conf]) => (
          <button
            key={key}
            onClick={() => setChannelFilter(key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all"
            style={{
              background: channelFilter === key ? conf.bg : 'rgba(255,255,255,0.03)',
              borderColor: channelFilter === key ? conf.color + '60' : 'rgba(255,255,255,0.08)',
              color: channelFilter === key ? conf.color : 'rgba(255,255,255,0.4)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: conf.dot }} />
            {conf.label}
          </button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 bg-[#16213E] border border-white/[0.07] rounded-[12px] px-4 py-3">
        <button onClick={prevMonth} className="p-1.5 rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><ChevronLeft size={15} /></button>
        <p className="text-[14px] font-semibold text-white flex-1 text-center capitalize">{monthName}</p>
        <button onClick={nextMonth} className="p-1.5 rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><ChevronRight size={15} /></button>
      </div>

      {/* Calendar / List */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-4">
        {viewMode === 'calendar' ? (
          <CalendarView
            year={year} month={month}
            posts={filteredPosts}
            events={events}
            onPostClick={setSelectedPost}
            onDayClick={setAddForDate}
            onEventClick={setSelectedEvent}
          />
        ) : (
          <ListView
            posts={filteredPosts}
            events={events}
            onPostClick={setSelectedPost}
            onEventClick={setSelectedEvent}
          />
        )}
      </div>

      {/* Modals */}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

      {addForDate && (
        <AddEventModal
          date={addForDate}
          currentUser={currentUserId}
          onClose={() => setAddForDate(null)}
          onAdded={ev => setEvents(prev => [...prev, ev])}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          currentUser={currentUserId}
          onClose={() => setSelectedEvent(null)}
          onDelete={id => setEvents(prev => prev.filter(e => e.id !== id))}
        />
      )}
    </div>
  )
}
