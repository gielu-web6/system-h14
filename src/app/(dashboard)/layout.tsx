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
      if (blocked) router.replace('/demo')
    }
  }, [user, loading, router, isSales, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <LayoutProvider>
        <div className="min-h-screen bg-[#1A1A2E] text-white">
          <Sidebar />
          <MainContent>
            <Topbar />
            <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
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
              background: '#0F0F1A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-inter, system-ui)',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: '#00B894', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#FD7272', secondary: '#fff' } },
          }}
        />
      </LayoutProvider>
    </DashboardGuard>
  )
}
