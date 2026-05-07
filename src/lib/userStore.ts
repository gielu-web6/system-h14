// Simple user store — no Supabase Auth, just localStorage

export type UserRole = 'admin' | 'sales'

export interface AppUser {
  id: string
  name: string
  fullName: string
  company: string
  initials: string
  color: string
  role: UserRole
  onboardingCompleted?: boolean
}

export const USERS: AppUser[] = [
  { id: 'adrian',     name: 'Adrian',     fullName: 'Adrian',     company: 'AM Automations', initials: 'A', color: '#6366f1', role: 'admin' },
  { id: 'maciek',     name: 'Maciek',     fullName: 'Maciek',     company: 'AM Automations', initials: 'M', color: '#8b5cf6', role: 'admin' },
  { id: 'handlowiec', name: 'Handlowiec', fullName: 'Handlowiec', company: 'AM Automations', initials: 'H', color: '#f59e0b', role: 'sales', onboardingCompleted: false },
  { id: 'demo',       name: 'Demo',       fullName: 'Demo',       company: 'AM Automations', initials: 'D', color: '#22c55e', role: 'admin' },
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

export function isAdminUser(): boolean {
  return getCurrentUser()?.role === 'admin'
}

export function isSalesUser(): boolean {
  return getCurrentUser()?.role === 'sales'
}

const ONBOARDING_KEY = 'am_onboarding_completed'

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  } catch {
    return true
  }
}

export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_KEY, 'true')
}
