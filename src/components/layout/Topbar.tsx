'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLayout } from './LayoutContext'
import { SearchModal } from './SearchModal'
import { NotificationsDropdown, useNotifications } from './NotificationsDropdown'
import { BrandThemeSwitcher } from './BrandThemeSwitcher'
import { useAppUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function useCompanyName() {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('company_profile').select('company_name').limit(1).single()
      .then(({ data }) => { if (data?.company_name) setName(data.company_name) })
  }, [])
  return name
}

// ─── Breadcrumb map ───────────────────────────────────────────────────────────

const BREADCRUMB_MAP: Record<string, { label: string; parent?: string }> = {
  '/':                      { label: 'Dashboard' },
  '/dashboard':                  { label: 'Dashboard' },
  '/knowledge-base':        { label: 'Baza Wiedzy' },
  '/pipeline':              { label: 'Pipeline',           parent: 'Sprzedaż' },
  '/leads':                 { label: 'Leady',              parent: 'Sprzedaż' },
  '/outreach':              { label: 'Outreach',           parent: 'Sprzedaż' },
  '/ai-scoring':            { label: 'AI Scoring',         parent: 'Sprzedaż' },
  '/content-generator':     { label: 'Generator Treści',   parent: 'Content' },
  '/content-calendar':      { label: 'Kalendarz',          parent: 'Content' },
  '/finance':               { label: 'Finanse',            parent: 'Raporty' },
  '/analytics':             { label: 'Analityka',          parent: 'Raporty' },
  '/portal':                { label: 'Portal Klienta',     parent: 'Klient' },
  '/offer-generator':       { label: 'Generator Ofert',    parent: 'Klient' },
  '/settings':              { label: 'Ustawienia' },
  '/notifications':         { label: 'Powiadomienia' },
  '/company-brain':         { label: 'Company Brain',      parent: 'AI System' },
  '/company-brain/dna':     { label: 'Company DNA',        parent: 'Company Brain' },
  '/company-brain/files':   { label: 'Pliki kontekstowe',  parent: 'Company Brain' },
  '/company-brain/test':    { label: 'Tester kontekstu',   parent: 'Company Brain' },
  '/reply-generator':       { label: 'Reply Generator',    parent: 'AI System' },
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const crumbs: { label: string; href: string }[] = []
  const entry = BREADCRUMB_MAP[pathname]

  if (!entry) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length >= 2) {
      const parentPath = '/' + parts.slice(0, -1).join('/')
      const parentEntry = BREADCRUMB_MAP[parentPath]
      if (parentEntry?.parent) crumbs.push({ label: parentEntry.parent, href: '#' })
      if (parentEntry) crumbs.push({ label: parentEntry.label, href: parentPath })
    }
    crumbs.push({ label: 'Detail', href: pathname })
    return crumbs
  }

  if (entry.parent) crumbs.push({ label: entry.parent, href: '#' })
  crumbs.push({ label: entry.label, href: pathname })
  return crumbs
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function DarkLightToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-[7px] text-muted hover:text-fg hover:bg-raised transition-colors"
      title={isDark ? 'Tryb jasny' : 'Tryb ciemny'}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

// ─── Avatar dropdown ──────────────────────────────────────────────────────────

function AvatarDropdown({ onClose, companyName }: { onClose: () => void; companyName: string | null }) {
  const { user, logout } = useAppUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/login')
  }

  return (
    <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-card border border-border rounded-[10px] shadow-xl overflow-hidden z-50 py-1">
      <div className="px-3 py-2.5 border-b border-border mb-1">
        <p className="text-[12.5px] font-medium text-fg">{(user as any)?.fullName ?? user?.name}</p>
        <p className="text-[11px] text-muted mt-0.5">{companyName ?? 'Moja Agencja'}</p>
      </div>
      <div className="px-3 py-1.5">
        <span className="section-label">Wersja demonstracyjna</span>
      </div>
      <div className="border-t border-border mt-1 pt-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-[12.5px] text-muted hover:text-fg hover:bg-raised transition-colors"
        >
          Wyloguj
        </button>
      </div>
      <div className="border-t border-border mt-1 pt-2 pb-1.5 px-3">
        <a
          href="https://amautomations.pl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-accent/60 hover:text-accent transition-colors"
        >
          Chcę wdrożyć w swojej agencji →
        </a>
      </div>
    </div>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const { openMobile } = useLayout()
  const crumbs = useBreadcrumbs()
  const pathname = usePathname()

  const [searchOpen, setSearchOpen]   = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [avatarOpen, setAvatarOpen]   = useState(false)

  const { unreadCount, notifications, markRead, markAllRead } = useNotifications()
  const { user: appUser } = useAppUser()
  const companyName = useCompanyName()

  const notifRef  = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on route change
  useEffect(() => {
    setNotifOpen(false)
    setAvatarOpen(false)
  }, [pathname])

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="h-14 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5
        bg-bg/90 backdrop-blur-md border-b border-border transition-colors duration-200">

        {/* ── Left: hamburger + breadcrumbs ── */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={openMobile}
            className="md:hidden p-2 rounded-[7px] text-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <Menu size={17} />
          </button>

          <nav className="flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={crumb.href + i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight size={11} className="text-subtle flex-shrink-0" />}
                  {isLast ? (
                    <span className="text-[13px] font-semibold text-fg truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href === '#' ? '#' : crumb.href}
                      className="text-[12px] text-muted hover:text-fg transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              )
            })}
          </nav>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-[7px]
              bg-raised border border-border text-muted hover:text-fg hover:border-border
              transition-colors text-[12px]"
          >
            <Search size={12} />
            <span>Szukaj…</span>
            <kbd className="ml-2 px-1 py-0.5 rounded-[4px] bg-bg border border-border text-[10px] font-mono text-subtle">⌘K</kbd>
          </button>

          {/* Dark/light toggle */}
          <DarkLightToggle />

          {/* Brand switcher */}
          <BrandThemeSwitcher />

          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-[7px] text-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <Search size={16} />
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false) }}
              className={`relative p-2 rounded-[7px] transition-colors
                ${notifOpen ? 'bg-accent/10 text-accent' : 'text-muted hover:text-fg hover:bg-raised'}`}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                markRead={markRead}
                markAllRead={markAllRead}
              />
            )}
          </div>

          {/* Avatar */}
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false) }}
              className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[7px]
                transition-colors hover:bg-raised
                ${avatarOpen ? 'bg-raised' : ''}`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{
                  background: (appUser?.color ?? '#00c8be') + '20',
                  border: `1px solid ${appUser?.color ?? '#00c8be'}40`,
                  color: appUser?.color ?? '#00c8be',
                }}
              >
                {appUser?.initials ?? 'AM'}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[12px] text-fg font-medium leading-tight truncate max-w-[120px]">
                  {(appUser as any)?.fullName ?? appUser?.name ?? 'Anna Kowalska'}
                </span>
                <span className="text-[10px] text-muted leading-tight">
                  {(appUser as any)?.company ?? companyName ?? 'Moja Agencja'}
                </span>
              </div>
            </button>
            {avatarOpen && <AvatarDropdown onClose={() => setAvatarOpen(false)} companyName={companyName} />}
          </div>
        </div>
      </header>
    </>
  )
}
