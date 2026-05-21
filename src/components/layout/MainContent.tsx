'use client'

import { useLayout } from './LayoutContext'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useLayout()

  return (
    <div
      className={`
        flex flex-col min-h-screen sidebar-transition
        ${collapsed ? 'md:ml-[56px]' : 'md:ml-[220px]'}
      `}
    >
      {children}
    </div>
  )
}
