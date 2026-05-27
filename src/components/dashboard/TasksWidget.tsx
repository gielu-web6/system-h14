'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckSquare, Square, Plus, X, Share2, Check,
  ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import { useTasks, getTodayWarsaw, formatTaskDate } from '@/hooks/useTasks'

export function TasksWidget() {
  const { tasks, loading, create, toggle, complete, remove } = useTasks()
  const [newTitle, setNewTitle]         = useState('')
  const [shareWithMaciek, setShareWithMaciek] = useState(false)
  const [adding, setAdding]             = useState(false)
  const [showAll, setShowAll]           = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const today = getTodayWarsaw()

  // ── Default view filters ────────────────────────────────────────────────────
  const todayPending   = tasks.filter(t => t.due_date === today && !t.completed)
  const todayCompleted = tasks.filter(t => t.due_date === today && t.completed)

  // ── "Wszystkie zadania" panel filters ───────────────────────────────────────
  // Overdue: past due, not completed — newest first
  const overdue = tasks
    .filter(t => t.due_date < today && !t.completed)
    .sort((a, b) => b.due_date.localeCompare(a.due_date))

  // All completed — newest completed_at first
  const allCompleted = tasks
    .filter(t => t.completed)
    .sort((a, b) => {
      const aAt = a.completed_at ?? a.created_at
      const bAt = b.completed_at ?? b.created_at
      return bAt.localeCompare(aAt)
    })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await create({
      title: newTitle.trim(),
      assigned_to: shareWithMaciek ? 'maciek' : undefined,
      due_date: today,
    })
    setNewTitle('')
    setShareWithMaciek(false)
    setAdding(false)
  }

  return (
    <div className="bg-card border border-border rounded-[12px] p-5 flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <CheckSquare size={14} className="text-accent" />
        <p className="text-[13.5px] font-semibold text-fg">Zadania na dziś</p>
        {todayPending.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold num">
            {todayPending.length}
          </span>
        )}
      </div>

      {/* ── Add form ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="+ Dodaj zadanie na dziś…"
            className="flex-1 px-3 py-2 rounded-[8px] bg-raised border border-border text-fg text-[12.5px]
              placeholder:text-subtle focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex-shrink-0 px-3 py-2 rounded-[8px] bg-accent text-bg text-[12px] font-bold
              disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            {adding ? '…' : <Plus size={15} />}
          </button>
        </div>
        {newTitle.trim() && (
          <label className="flex items-center gap-2 cursor-pointer px-1">
            <button
              type="button"
              onClick={() => setShareWithMaciek(v => !v)}
              className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all
                ${shareWithMaciek ? 'bg-info border-info' : 'bg-raised border-border'}`}
            >
              {shareWithMaciek && <Check size={9} className="text-bg" />}
            </button>
            <span className="flex items-center gap-1 text-[11.5px] text-muted">
              <Share2 size={10} className="text-info" />
              Udostępnij Maćkowi
            </span>
          </label>
        )}
      </form>

      {/* ── Today's task list ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-4 text-center text-[12px] text-subtle">Ładowanie…</div>
      ) : todayPending.length === 0 && todayCompleted.length === 0 ? (
        <p className="text-center text-[12px] text-subtle py-2">Brak zadań — wpisz coś powyżej</p>
      ) : (
        <div className="space-y-1 max-h-[340px] overflow-y-auto">

          {todayPending.map(task => (
            <div key={task.id}
              className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-raised hover:bg-raised/80 group transition-colors">
              <button
                onClick={() => void toggle(task.id)}
                className="flex-shrink-0 mt-0.5 text-subtle hover:text-accent transition-colors"
              >
                <Square size={14} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-fg leading-tight">{task.title}</p>
                {task.assigned_to === 'maciek' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-info/70">
                    <Share2 size={9} /> Udostępnione Maćkowi
                  </span>
                )}
              </div>
              <button
                onClick={() => void remove(task.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-subtle hover:text-danger transition-all p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {todayCompleted.length > 0 && (
            <div className="pt-1 mt-1 border-t border-border">
              <p className="section-label px-1 mb-1.5">Ukończone ({todayCompleted.length})</p>
              {todayCompleted.map(task => (
                <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-[8px] group">
                  <button
                    onClick={() => void toggle(task.id)}
                    className="flex-shrink-0 mt-0.5 text-accent/40 hover:text-accent transition-colors"
                  >
                    <CheckSquare size={14} />
                  </button>
                  <p className="flex-1 text-[12px] text-subtle line-through leading-tight">{task.title}</p>
                  <button
                    onClick={() => void remove(task.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-subtle hover:text-danger transition-all p-0.5"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── "Wszystkie zadania" toggle ──────────────────────────────────────── */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex items-center gap-1.5 section-label hover:text-fg transition-colors"
        >
          {showAll ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Wszystkie zadania
          {overdue.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold num">
              {overdue.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Expanded "Wszystkie zadania" panel ─────────────────────────────── */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            key="all-tasks-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-1">

              {/* ── NIEZREALIZOWANE (overdue) ─────────────────────────────── */}
              <section>
                <p className="section-label px-1 mb-2 flex items-center gap-1.5">
                  <Clock size={10} />
                  Niezrealizowane
                  {overdue.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold num">
                      {overdue.length}
                    </span>
                  )}
                </p>

                {overdue.length === 0 ? (
                  <p className="text-center text-[12px] text-subtle py-2">Brak zaległych zadań. Czysto.</p>
                ) : (
                  <div className="space-y-1 max-h-[240px] overflow-y-auto">
                    {overdue.map(task => (
                      <div key={task.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-raised hover:bg-raised/80 group transition-colors">
                        <button
                          onClick={() => void complete(task.id)}
                          className="flex-shrink-0 mt-0.5 text-subtle hover:text-accent transition-colors"
                          title="Oznacz jako zrealizowane"
                        >
                          <Square size={14} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] text-fg leading-tight">{task.title}</p>
                          <p className="text-[10.5px] text-danger/70 mt-0.5">
                            {formatTaskDate(task.due_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── ZREALIZOWANE (all completed) ─────────────────────────── */}
              <section className="border-t border-border pt-3">
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className="flex items-center gap-1.5 section-label hover:text-fg transition-colors mb-2 w-full text-left"
                >
                  {showCompleted ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Zrealizowane ({allCompleted.length})
                </button>

                <AnimatePresence>
                  {showCompleted && (
                    <motion.div
                      key="completed-list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {allCompleted.length === 0 ? (
                        <p className="text-center text-[12px] text-subtle py-2">Jeszcze nic nie zrealizowane.</p>
                      ) : (
                        <div className="space-y-1 max-h-[240px] overflow-y-auto">
                          {allCompleted.map(task => (
                            <div key={task.id}
                              className="flex items-start gap-2.5 p-2 rounded-[8px]">
                              <CheckSquare size={14} className="flex-shrink-0 mt-0.5 text-accent/40" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-subtle line-through leading-tight">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10.5px] text-subtle/60">
                                    termin: {formatTaskDate(task.due_date)}
                                  </span>
                                  {task.completed_at && (
                                    <span className="text-[10.5px] text-accent/50">
                                      · zrealizowane:{' '}
                                      {new Date(task.completed_at).toLocaleDateString('pl-PL', {
                                        day: 'numeric', month: 'long',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
