'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { type UITheme, getStoredTheme, applyTheme, toggleTheme as toggleFn } from '@/lib/theme'

interface UIThemeContextValue {
  theme: UITheme
  setTheme: (t: UITheme) => void
  toggleTheme: () => void
  isArctic: boolean
}

const UIThemeContext = createContext<UIThemeContextValue>({
  theme: 'dark-operator',
  setTheme: () => {},
  toggleTheme: () => {},
  isArctic: false,
})

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<UITheme>('dark-operator')

  useEffect(() => {
    const stored = getStoredTheme()
    setThemeState(stored)
    applyTheme(stored)
  }, [])

  const setTheme = useCallback((t: UITheme) => {
    setThemeState(t)
    applyTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = toggleFn(prev)
      applyTheme(next)
      return next
    })
  }, [])

  return (
    <UIThemeContext.Provider value={{ theme, setTheme, toggleTheme, isArctic: theme === 'arctic-executive' }}>
      {children}
    </UIThemeContext.Provider>
  )
}

export function useUITheme() {
  return useContext(UIThemeContext)
}
