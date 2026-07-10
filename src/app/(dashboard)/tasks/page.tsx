'use client'

import { useState } from 'react'
import {
  CheckSquare, Square, Plus, X, Check,
  Clock, AlertCircle, CalendarDays,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTasks, getTodayWarsaw, formatTaskDate, type Task } from '@/hooks/useTasks'
import { useAppUser } from '@/contexts/UserContext'

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY = {
  high:   { label: 'Wysoki',  color: 'text-danger',  bg: 'bg-danger/15'  },
  medium: { label: 'Średni',  color: 'text-amber',   bg: 'bg-amber/15'   },
  low:    { label: 'Niski',   color: 'text-info',    bg: 'bg-info/15'    },
} as const

// User identity colours — mapped to design system tokens
const USER_COLORS: Record<string, string> = {
  adrian: 'var(--c-violet)',
  maciek: 'var(--accent)',
  patka:  '#f43f5e',
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task, onToggle, onRemove, showDate = false,
}: {
  task: Task; onToggle: (id: string) => void; onRemove: (id: string) => void; showDate?: boolean
}) {
  const p = PRIORITY[task.priority] ?? PRIORITY.medium
  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-fg/[0.03] transition-colors group ${task.completed ? 'opacity-55' : ''}`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 mt-0.5 transition-colors ${task.completed ? 'text-accent/60 hover:text-accent' : 'text-subtle hover:text-accent'}`}
      >
        {task.completed ? <CheckSquare size={15} /> : <Square size={15} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${task.completed ? 'text-muted line-through' : 'text-fg'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${p.bg} ${p.color}`}>{p.label}</span>
          {showDate && (
            <span className={`text-[11px] ${task.completed ? 'text-subtle' : 'text-danger/80'}`}>{formatTaskDate(task.due_date)}</span>
          )}
          {task.completed && task.completed_at && (
            <span className="text-[10px] text-accent/40">
              · zrealizowane {new Date(task.completed_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-subtle hover:text-danger transition-all p-1 rounded-[6px] hover:bg-danger/10"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Per-user tasks panel ─────────────────────────────────────────────────────

function UserTaskPanel({ userId, userName, isCurrentUser }: { userId: string; userName: string; isCurrentUser: boolean }) {
  const { tasks, loading, create, toggle, remove } = useTasks(userId)
  const today = getTodayWarsaw()
  const [newTitle, setNewTitle]   = useState('')
  const [priority, setPriority]   = useState<Task['priority']>('medium')
  const [dueDate, setDueDate]     = useState(today)
  const [adding, setAdding]       = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const todayPending   = tasks.filter(t => t.due_date === today && !t.completed)
  const todayCompleted = tasks.filter(t => t.due_date === today && t.completed)
  const overdue        = tasks.filter(t => t.due_date < today && !t.completed).sort((a, b) => b.due_date.localeCompare(a.due_date))
  const upcoming       = tasks.filter(t => t.due_date > today && !t.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const allCompleted   = tasks.filter(t => t.completed).sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))

  const pendingCount = todayPending.length + overdue.length + upcoming.length
  const color = USER_COLORS[userId] ?? 'var(--c-violet)'

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await create({ title: newTitle.trim(), priority, due_date: dueDate, assigned_to: userId })
    setNewTitle('')
    setPriority('medium')
    setDueDate(today)
    setAdding(false)
  }

  return (
    <div
      className="card-elevated rounded-[14px] overflow-hidden"
      style={{ '--card-accent': color } as React.CSSProperties}
    >

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border"
        style={{ borderLeft: `3px solid ${color}` }}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            border: `1.5px solid ${color}`,
            color,
          }}
        >
          {userName[0]}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-fg">{userName}</p>
          <p className="text-[10px] text-muted">
            {pendingCount > 0 ? `${pendingCount} do zrobienia` : 'Wszystko zrobione'}
            {overdue.length > 0 && <span className="text-danger ml-1">· {overdue.length} zaległych</span>}
          </p>
        </div>
        {isCurrentUser && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-fg/[0.06] text-muted uppercase tracking-wide">Twoje konto</span>
        )}
      </div>

      {/* Add form — only for current user's panel */}
      {isCurrentUser && (
        <div className="px-5 py-4 border-b border-border">
          <form onSubmit={handleAdd} className="space-y-2.5">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Nowe zadanie…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-fg/[0.04] border border-fg/[0.08]
                text-fg text-[12.5px] placeholder:text-muted focus:outline-none
                focus:border-accent/40 transition-all"
            />
            {newTitle.trim() && (
              <div className="flex items-center gap-2 flex-wrap">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-[6px] transition-all ${priority === p
                      ? `${PRIORITY[p].bg} ${PRIORITY[p].color} border border-current/20`
                      : 'text-subtle bg-fg/[0.03] border border-fg/[0.06] hover:text-muted'}`}>
                    {PRIORITY[p].label}
                  </button>
                ))}
                <input
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="bg-transparent text-[11px] text-muted focus:outline-none cursor-pointer ml-1"
                />
                <button type="submit" disabled={adding || !newTitle.trim()}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-accent
                    text-[11px] font-semibold disabled:opacity-30 hover:opacity-90 hover:shadow-[var(--glow-teal)] transition-all"
                  style={{ color: 'var(--nav-pill-text)' }}>
                  {adding ? '…' : <><Plus size={11} /> Dodaj</>}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tasks list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {/* Overdue */}
          {overdue.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-danger/[0.06] border-b border-border">
                <p className="text-[10px] font-semibold text-danger uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={10} /> Zaległe ({overdue.length})
                </p>
              </div>
              <div className="divide-y divide-fg/[0.06]">
                {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={isCurrentUser ? toggle : () => {}} onRemove={isCurrentUser ? remove : () => {}} showDate />)}
              </div>
            </div>
          )}

          {/* Today */}
          <div>
            <div className="px-5 py-2 bg-fg/[0.02] border-b border-border">
              <p className="section-label flex items-center gap-1 text-subtle">
                <Clock size={10} /> Dzisiaj ({todayPending.length})
              </p>
            </div>
            {todayPending.length === 0 && todayCompleted.length === 0 ? (
              <p className="px-5 py-4 text-[12px] text-muted text-center">Brak zadań na dziś.</p>
            ) : (
              <div className="divide-y divide-fg/[0.06]">
                {todayPending.map(t => <TaskRow key={t.id} task={t} onToggle={isCurrentUser ? toggle : () => {}} onRemove={isCurrentUser ? remove : () => {}} />)}
                {todayCompleted.map(t => <TaskRow key={t.id} task={t} onToggle={isCurrentUser ? toggle : () => {}} onRemove={isCurrentUser ? remove : () => {}} />)}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-fg/[0.02] border-b border-border">
                <p className="section-label flex items-center gap-1 text-subtle">
                  <CalendarDays size={10} /> Nadchodzące ({upcoming.length})
                </p>
              </div>
              <div className="divide-y divide-fg/[0.06]">
                {upcoming.map(t => <TaskRow key={t.id} task={t} onToggle={isCurrentUser ? toggle : () => {}} onRemove={isCurrentUser ? remove : () => {}} />)}
              </div>
            </div>
          )}

          {/* Completed toggle */}
          {allCompleted.length > 0 && (
            <div className="border-t border-border">
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="w-full flex items-center gap-2 px-5 py-2.5 hover:bg-fg/[0.02] transition-colors text-left"
              >
                <Check size={11} className="text-subtle" />
                <span className="text-[11px] text-muted flex-1">Zrealizowane ({allCompleted.length})</span>
                <span className="text-subtle text-[10px]">{showCompleted ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence initial={false}>
                {showCompleted && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden border-t border-border">
                    <div className="divide-y divide-fg/[0.04]">
                      {allCompleted.map(t => <TaskRow key={t.id} task={t} onToggle={isCurrentUser ? toggle : () => {}} onRemove={isCurrentUser ? remove : () => {}} />)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tasks.length === 0 && (
            <p className="px-5 py-6 text-[12px] text-muted text-center">Brak zadań.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_USERS = [
  { id: 'adrian', name: 'Adrian' },
  { id: 'maciek', name: 'Maciek' },
  { id: 'patka',  name: 'Patka'  },
]

export default function TasksPage() {
  const { user } = useAppUser()
  const currentUserId = user?.id ?? 'adrian'
  const isPatka = currentUserId === 'patka'

  // Patka widzi tylko swój panel; Maciek i Adrian widzą wszystkich
  const visibleUsers = isPatka
    ? ALL_USERS.filter(u => u.id === 'patka')
    : ALL_USERS

  // Sort: current user first
  const sortedUsers = [...visibleUsers].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return 0
  })

  return (
    <div className="max-w-[860px] space-y-5">

      <div>
        <h1 className="text-[20px] font-bold text-fg flex items-center gap-2">
          <CheckSquare size={19} className="text-accent" />
          Zadania
        </h1>
        <p className="text-[12px] text-muted mt-0.5">
          {isPatka ? 'Twoje zadania' : 'Widok zbiorczy — Twoje zadania i zadania zespołu'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${sortedUsers.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
        {sortedUsers.map(u => (
          <UserTaskPanel
            key={u.id}
            userId={u.id}
            userName={u.name}
            isCurrentUser={u.id === currentUserId}
          />
        ))}
      </div>

    </div>
  )
}
