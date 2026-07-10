'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { LayoutProvider } from '@/components/layout/LayoutContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MainContent } from '@/components/layout/MainContent'
import { useAppUser } from '@/contexts/UserContext'
import { OnboardingModal } from '@/components/sales/OnboardingModal'

const ADMIN_ONLY_PATHS = ['/finance', '/company-brain', '/settings', '/analytics']

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isSales } = useAppUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (!loading && isSales) {
      const blocked = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))
      if (blocked) router.replace('/dashboard')
    }
  }, [user, loading, router, isSales, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <LayoutProvider>
        <div className="min-h-screen bg-transparent text-fg">
          <Sidebar />
          <MainContent>
            <Topbar />
            <main className="flex-1 p-4 md:px-2 md:pt-0 md:pb-4 overflow-x-hidden">
              {children}
            </main>
          </MainContent>
          <OnboardingModal />
        </div>

        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f1418',
              color: '#e8edf2',
              border: '1px solid #1c2329',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontFamily: 'var(--font-inter, system-ui)',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#30c060', secondary: '#0f1418' } },
            error:   { iconTheme: { primary: '#e84040', secondary: '#0f1418' } },
          }}
        />
      </LayoutProvider>
    </DashboardGuard>
  )
}
