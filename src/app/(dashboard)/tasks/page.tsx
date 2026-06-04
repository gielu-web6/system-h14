'use client'

import { useState } from 'react'
import {
  CheckSquare, Square, Plus, X, Check,
  Clock, AlertCircle, CalendarDays, Share2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTasks, getTodayWarsaw, formatTaskDate, type Task } from '@/hooks/useTasks'

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY = {
  high:   { label: 'Wysoki',  color: 'text-red-400',   bg: 'bg-red-500/15'   },
  medium: { label: 'Średni',  color: 'text-amber-400', bg: 'bg-amber-500/15' },
  low:    { label: 'Niski',   color: 'text-blue-400',  bg: 'bg-blue-500/15'  },
} as const

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onRemove,
  showDate = false,
}: {
  task: Task
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  showDate?: boolean
}) {
  const p = PRIORITY[task.priority] ?? PRIORITY.medium

  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors group ${
      task.completed ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 mt-0.5 transition-colors ${
          task.completed ? 'text-accent/50 hover:text-accent' : 'text-white/25 hover:text-accent'
        }`}
      >
        {task.completed ? <CheckSquare size={15} /> : <Square size={15} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${task.completed ? 'text-white/40 line-through' : 'text-white/85'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${p.bg} ${p.color}`}>
            {p.label}
          </span>
          {showDate && (
            <span className={`text-[11px] ${task.completed ? 'text-white/25' : 'text-danger/70'}`}>
              {formatTaskDate(task.due_date)}
            </span>
          )}
          {task.assigned_to === 'maciek' && (
            <span className="flex items-center gap-1 text-[10px] text-info/60">
              <Share2 size={9} /> Udostępnione Maćkowi
            </span>
          )}
          {task.completed && task.completed_at && (
            <span className="text-[10px] text-accent/40">
              · zrealizowane{' '}
              {new Date(task.completed_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onRemove(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1 rounded-[6px] hover:bg-red-500/10"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, count, danger, children, defaultOpen = true,
}: {
  title: string
  icon: React.ElementType
  count: number
  danger?: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <Icon size={14} className={danger ? 'text-red-400' : 'text-accent'} />
        <span className="text-[13px] font-semibold text-white/80 flex-1">{title}</span>
        {count > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            danger ? 'bg-red-500/15 text-red-400' : 'bg-accent/15 text-accent'
          }`}>
            {count}
          </span>
        )}
        <span className="text-white/20 text-[11px]">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { tasks, loading, create, toggle, remove } = useTasks()
  const today = getTodayWarsaw()

  const [newTitle, setNewTitle]   = useState('')
  const [priority, setPriority]   = useState<Task['priority']>('medium')
  const [dueDate, setDueDate]     = useState(today)
  const [shared, setShared]       = useState(false)
  const [adding, setAdding]       = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const todayPending   = tasks.filter(t => t.due_date === today && !t.completed)
  const todayCompleted = tasks.filter(t => t.due_date === today && t.completed)
  const overdue        = tasks.filter(t => t.due_date < today && !t.completed)
                              .sort((a, b) => b.due_date.localeCompare(a.due_date))
  const upcoming       = tasks.filter(t => t.due_date > today && !t.completed)
                              .sort((a, b) => a.due_date.localeCompare(b.due_date))
  const allCompleted   = tasks.filter(t => t.completed)
                              .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await create({
      title: newTitle.trim(),
      priority,
      due_date: dueDate,
      assigned_to: shared ? 'maciek' : undefined,
    })
    setNewTitle('')
    setPriority('medium')
    setDueDate(today)
    setShared(false)
    setAdding(false)
  }

  const pendingAll = todayPending.length + overdue.length + upcoming.length

  return (
    <div className="max-w-[760px] space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <CheckSquare size={19} className="text-accent" />
          Zadania
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">
          {pendingAll > 0 ? `${pendingAll} do zrobienia` : 'Wszystko zrobione'}
          {overdue.length > 0 && ` · ${overdue.length} zaległych`}
        </p>
      </div>

      {/* Add task form */}
      <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
        <p className="text-[12px] font-semibold text-white/50 mb-3 uppercase tracking-wide">Nowe zadanie</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Tytuł zadania…"
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
              text-white text-[13px] placeholder:text-white/25 focus:outline-none
              focus:border-accent/40 focus:bg-accent/[0.03] transition-all"
          />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Priority */}
            <div className="flex items-center gap-1.5">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-[7px] transition-all ${
                    priority === p
                      ? `${PRIORITY[p].bg} ${PRIORITY[p].color} border border-current/20`
                      : 'text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/50'
                  }`}
                >
                  {PRIORITY[p].label}
                </button>
              ))}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-white/40">
              <CalendarDays size={13} />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-transparent text-[12px] text-white/60 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Share with Maciek */}
            <button
              type="button"
              onClick={() => setShared(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-[7px] transition-all ${
                shared
                  ? 'bg-info/15 text-info border border-info/20'
                  : 'text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/50'
              }`}
            >
              <Share2 size={11} />
              Udostępnij Maćkowi
            </button>

            <button
              type="submit"
              disabled={adding || !newTitle.trim()}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-accent
                text-[12px] font-semibold text-bg disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {adding ? '…' : <><Plus size={13} /> Dodaj</>}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">

          {/* Overdue */}
          {overdue.length > 0 && (
            <Section title="Zaległe" icon={AlertCircle} count={overdue.length} danger>
              <div className="divide-y divide-white/[0.04]">
                {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onRemove={remove} showDate />)}
              </div>
            </Section>
          )}

          {/* Today */}
          <Section title="Dzisiaj" icon={Clock} count={todayPending.length}>
            {todayPending.length === 0 && todayCompleted.length === 0 ? (
              <p className="px-5 py-6 text-[12px] text-white/30 text-center">
                Brak zadań na dziś — dodaj powyżej.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {todayPending.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}
                {todayCompleted.length > 0 && (
                  <>
                    <div className="px-5 py-2 bg-white/[0.01]">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wide">
                        Ukończone dziś ({todayCompleted.length})
                      </p>
                    </div>
                    {todayCompleted.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}
                  </>
                )}
              </div>
            )}
          </Section>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Section title="Nadchodzące" icon={CalendarDays} count={upcoming.length} defaultOpen={false}>
              <div className="divide-y divide-white/[0.04]">
                {upcoming.map(t => (
                  <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors group">
                    <button onClick={() => toggle(t.id)} className="flex-shrink-0 mt-0.5 text-white/25 hover:text-accent transition-colors">
                      <Square size={15} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/85 leading-snug">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${PRIORITY[t.priority].bg} ${PRIORITY[t.priority].color}`}>
                          {PRIORITY[t.priority].label}
                        </span>
                        <span className="text-[11px] text-white/35 flex items-center gap-1">
                          <CalendarDays size={10} />
                          {new Date(t.due_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(t.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1 rounded-[6px] hover:bg-red-500/10"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* All completed */}
          <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <Check size={14} className="text-white/30" />
              <span className="text-[13px] font-semibold text-white/50 flex-1">Zrealizowane</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/30">
                {allCompleted.length}
              </span>
              <span className="text-white/20 text-[11px]">{showCompleted ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence initial={false}>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-white/[0.05]"
                >
                  {allCompleted.length === 0 ? (
                    <p className="px-5 py-6 text-[12px] text-white/25 text-center">Jeszcze nic nie zrealizowane.</p>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {allCompleted.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onRemove={remove} />)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  )
}
