'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Camera, FileText, Wand2, Settings, ChevronRight } from 'lucide-react'

interface CSNav {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const TOP_LINKS: CSNav[] = [
  { href: '/content-studio', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/content-studio/onboarding', label: 'Nowy klient', icon: Users },
]

function NavLink({ href, label, icon: Icon, exact }: CSNav) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all ${
        active
          ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/30'
          : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
      }`}
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

export default function ContentStudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Extract clientId from URL if present
  const clientMatch = pathname.match(/\/content-studio\/clients\/([^/]+)/)
  const clientId = clientMatch?.[1]

  const clientLinks: CSNav[] = clientId
    ? [
        { href: `/content-studio/clients/${clientId}`, label: 'Profil marki', icon: Users, exact: true },
        { href: `/content-studio/clients/${clientId}/generate`, label: 'Generuj post', icon: Wand2 },
        { href: `/content-studio/clients/${clientId}/photos`, label: 'Zdjęcia', icon: Camera },
        { href: `/content-studio/clients/${clientId}/posts`, label: 'Posty & Kalendarz', icon: FileText },
        { href: `/content-studio/clients/${clientId}/settings`, label: 'Ustawienia', icon: Settings },
      ]
    : []

  return (
    <div className="max-w-[1400px] flex gap-6">
      {/* Sidebar */}
      <aside className="w-[180px] flex-shrink-0 space-y-1">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 mb-3">
          Content Studio
        </p>
        {TOP_LINKS.map(l => <NavLink key={l.href} {...l} />)}

        {clientId && (
          <>
            <div className="flex items-center gap-1 px-3 py-2 mt-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <ChevronRight size={10} className="text-white/20" />
            </div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 mb-1">
              Klient
            </p>
            {clientLinks.map(l => <NavLink key={l.href} {...l} />)}
          </>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
