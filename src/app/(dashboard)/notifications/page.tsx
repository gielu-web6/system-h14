'use client'

import { Bell, Check, Flame, TrendingUp, FileText, DollarSign, Users, AlertCircle, Clock } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useNotifications, type AppNotification } from '@/components/layout/NotificationsDropdown'

// ─── Icon/color config per type ──────────────────────────────────────────────

function notifStyle(type: string) {
  switch (type) {
    case 'hot_lead':          return { Icon: Flame,      color: 'text-red-400',     bg: 'bg-red-500/15',     label: 'Hot Lead' }
    case 'offer_accepted':    return { Icon: DollarSign,  color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Oferta zaakceptowana' }
    case 'offer_viewed':      return { Icon: FileText,    color: 'text-blue-400',    bg: 'bg-blue-500/15',    label: 'Oferta wyświetlona' }
    case 'deal_won':          return { Icon: TrendingUp,  color: 'text-accent',      bg: 'bg-accent/15',      label: 'Deal wygrany' }
    case 'new_lead':          return { Icon: Users,       color: 'text-secondary',   bg: 'bg-secondary/15',   label: 'Nowy lead' }
    case 'pricing_attention': return { Icon: DollarSign,  color: 'text-amber-400',   bg: 'bg-amber-500/15',   label: 'Cena' }
    case 'section_time':      return { Icon: Clock,       color: 'text-blue-300',    bg: 'bg-blue-400/10',    label: 'Czas sekcji' }
    case 'cta_clicked':       return { Icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'CTA' }
    default:                  return { Icon: AlertCircle, color: 'text-white/40',    bg: 'bg-white/5',        label: 'Powiadomienie' }
  }
}

// ─── Date group label ─────────────────────────────────────────────────────────

function dateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Dzisiaj'
  if (isYesterday(d)) return 'Wczoraj'
  return format(d, 'd MMMM yyyy', { locale: pl })
}

// ─── Group notifications by date ─────────────────────────────────────────────

function groupByDate(notifications: AppNotification[]) {
  const groups = new Map<string, AppNotification[]>()
  for (const n of notifications) {
    const label = dateGroupLabel(n.created_at)
    const arr = groups.get(label) ?? []
    arr.push(n)
    groups.set(label, arr)
  }
  return [...groups.entries()]
}

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: AppNotification['priority'] }) {
  if (priority === 'normal') return null
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${
      priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/15 text-amber-400'
    }`}>
      {priority === 'urgent' ? 'Pilne' : 'Ważne'}
    </span>
  )
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({ n, onMarkRead }: { n: AppNotification; onMarkRead: (id: string) => void }) {
  const { Icon, color, bg, label } = notifStyle(n.type)
  const time = format(new Date(n.created_at), 'HH:mm')
  const ago  = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })

  return (
    <div className={`relative flex items-start gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors ${
      !n.is_read ? 'bg-accent/[0.03]' : ''
    }`}>
      {n.priority === 'urgent' && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-full" />
      )}

      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
        <Icon size={15} className={color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-[13px] font-medium leading-snug ${n.is_read ? 'text-white/55' : 'text-white/90'}`}>
            {n.title}
          </span>
          <PriorityBadge priority={n.priority} />
        </div>
        {n.body && (
          <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">{n.body}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-white/25 uppercase tracking-wide">{label}</span>
          <span className="text-white/15 text-[10px]">·</span>
          <span className="text-[11px] text-white/30" title={ago}>{time}</span>
          <span className="text-white/15 text-[10px]">·</span>
          <span className="text-[11px] text-white/25">{ago}</span>
        </div>
      </div>

      {!n.is_read && (
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <button
            onClick={() => onMarkRead(n.id)}
            className="p-1 rounded-[6px] text-white/20 hover:text-accent hover:bg-accent/10 transition-colors"
            title="Oznacz jako przeczytane"
          >
            <Check size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications()
  const groups = groupByDate(notifications)

  return (
    <div className="max-w-[760px] space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Bell size={19} className="text-accent" />
            Powiadomienia
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystkie przeczytane'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[12px] text-accent hover:text-accent/80 transition-colors px-3 py-1.5 rounded-[8px] border border-accent/20 hover:bg-accent/5"
          >
            <Check size={12} />
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-card border border-white/[0.07] rounded-[14px] p-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-white/[0.07] rounded-[14px] p-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Bell size={20} className="text-white/20" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/40">Brak powiadomień</p>
            <p className="text-[12px] text-white/25 mt-1">Powiadomienia pojawią się tutaj automatycznie.</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
          {groups.map(([dateLabel, items], gi) => (
            <div key={dateLabel}>
              <div className={`px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.05] ${gi > 0 ? 'border-t border-white/[0.05]' : ''}`}>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">{dateLabel}</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {items.map(n => (
                  <NotifRow key={n.id} n={n} onMarkRead={markRead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
