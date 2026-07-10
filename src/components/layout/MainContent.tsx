'use client'

import { useLayout } from './LayoutContext'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useLayout()

  return (
    <div
      className={`
        flex flex-col min-h-screen sidebar-transition
        ml-0 md:mr-3.5 md:py-3.5
        ${collapsed ? 'md:ml-[84px]' : 'md:ml-[248px]'}
      `}
    >
      {children}
    </div>
  )
}
