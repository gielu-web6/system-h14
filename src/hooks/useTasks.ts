'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface Task {
  id: string
  title: string
  description?: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  completed: boolean
  completed_at?: string | null
  created_at: string
}

// Returns today's date as YYYY-MM-DD in Europe/Warsaw timezone
export function getTodayWarsaw(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date())
}

// "wczoraj" / "3 dni temu" / "12 listopada" for dates in the past
export function formatTaskDate(dateStr: string): string {
  const today = getTodayWarsaw()
  const todayMs = new Date(today).getTime()
  const taskMs  = new Date(dateStr).getTime()
  const diffDays = Math.round((todayMs - taskMs) / 86_400_000)

  if (diffDays === 1) return 'wczoraj'
  if (diffDays < 7)  return `${diffDays} dni temu`
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (payload: {
    title: string
    description?: string
    priority?: Task['priority']
    assigned_to?: string
    due_date?: string
  }): Promise<Task | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...payload,
        user_id: user?.id,
        completed: false,
        priority: payload.priority ?? 'medium',
        due_date: payload.due_date ?? getTodayWarsaw(),
      })
      .select()
      .single()
    if (error) { toast.error('Błąd dodawania zadania'); return null }
    const task = data as Task
    setTasks(prev => [task, ...prev])
    toast.success('Zadanie dodane')
    return task
  }, [])

  // Two-way toggle — used in today's view (can undo completed)
  const toggle = useCallback(async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const supabase = createClient()
    const update = task.completed
      ? { completed: false, completed_at: null }
      : { completed: true, completed_at: new Date().toISOString() }
    const { error } = await supabase.from('tasks').update(update).eq('id', id)
    if (error) { toast.error('Błąd aktualizacji zadania'); return }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...update } : t))
  }, [tasks])

  // One-way complete — used for overdue tasks (no undo), with optimistic update
  const complete = useCallback(async (id: string): Promise<void> => {
    const snapshot = tasks
    const now = new Date().toISOString()
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true, completed_at: now } : t
    ))
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: now })
      .eq('id', id)
    if (error) {
      setTasks(snapshot) // rollback
      toast.error('Błąd — zadanie nie zostało zapisane')
    }
  }, [tasks])

  const remove = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { toast.error('Błąd usuwania zadania'); return }
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Zadanie usunięte')
  }, [])

  return { tasks, loading, load, create, toggle, complete, remove }
}
