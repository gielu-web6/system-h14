'use client'

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react'
import { getCurrentUser, setCurrentUser, clearCurrentUser, type AppUser } from '@/lib/userStore'

interface UserContextValue {
  user: AppUser | null
  loading: boolean
  isAdmin: boolean
  isSales: boolean
  switchUser: (id: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isAdmin: true,
  isSales: false,
  switchUser: () => {},
  logout: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    setLoading(false)
  }, [])

  const switchUser = useCallback((id: string) => {
    setCurrentUser(id)
    setUser(getCurrentUser())
  }, [])

  const logout = useCallback(() => {
    clearCurrentUser()
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin' || user?.role === undefined
  const isSales = user?.role === 'sales'

  return (
    <UserContext.Provider value={{ user, loading, isAdmin, isSales, switchUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useAppUser() {
  return useContext(UserContext)
}
