export type UITheme = 'dark-operator' | 'arctic-executive'

const STORAGE_KEY = 'h14-theme'
const DEFAULT_THEME: UITheme = 'dark-operator'

export function getStoredTheme(): UITheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'arctic-executive' ? 'arctic-executive' : DEFAULT_THEME
}

export function applyTheme(theme: UITheme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (theme === 'arctic-executive') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
  }
  localStorage.setItem(STORAGE_KEY, theme)
}

export function toggleTheme(current: UITheme): UITheme {
  return current === 'dark-operator' ? 'arctic-executive' : 'dark-operator'
}

export const THEME_META = {
  'dark-operator': {
    label: 'Refined Dark Operator',
    description: 'Ciemny motyw operacyjny',
  },
  'arctic-executive': {
    label: 'Arctic Executive',
    description: 'Jasny motyw executive',
  },
} as const
