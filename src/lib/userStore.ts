// Simple user store — no Supabase Auth, just localStorage

export interface AppUser {
  id: string
  name: string
  fullName: string
  company: string
  initials: string
  color: string
}

export const USERS: AppUser[] = [
  { id: 'adrian', name: 'Adrian', fullName: 'Adrian', company: 'AM Automations', initials: 'A', color: '#6366f1' },
  { id: 'maciek', name: 'Maciek', fullName: 'Maciek', company: 'AM Automations', initials: 'M', color: '#8b5cf6' },
  { id: 'demo',   name: 'Demo',   fullName: 'Demo',   company: 'AM Automations', initials: 'D', color: '#22c55e' },
]

export const DEMO_PASSWORD = 'Zyś'

const KEY = 'am_current_user'

export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return USERS.find((u) => u.id === raw) ?? null
  } catch {
    return null
  }
}

export function setCurrentUser(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, id)
}

export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function isDemoMode(): boolean {
  return getCurrentUser()?.id === 'demo'
}
