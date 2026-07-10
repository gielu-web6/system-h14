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
  '/allegro-produkty':      { label: 'Produkty',           parent: 'Allegro Dropshipping' },
  '/allegro-hurtownie':     { label: 'Hurtownie',          parent: 'Allegro Dropshipping' },
  '/allegro-dropshipping':  { label: 'Generator',          parent: 'Allegro Dropshipping' },
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

  if (entry.parent) {
    const parentHref = Object.entries(BREADCRUMB_MAP).find(([, v]) => v.label === entry.parent)?.[0] ?? '#'
    crumbs.push({ label: entry.parent, href: parentHref })
  }
  crumbs.push({ label: entry.label, href: pathname })
  return crumbs
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function DarkLightToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-[38px] h-[38px]" />

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-[38px] h-[38px] flex items-center justify-center rounded-[9px] text-muted hover:text-fg hover:bg-raised transition-colors"
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

  const accentColor = appUser?.color ?? '#00c8be'

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header
        className="h-14 sticky z-30 flex items-center justify-between px-4 sm:px-5
          bg-bg/85 backdrop-blur-md transition-colors duration-200 relative shell-topbar
          top-0 border-b border-border
          md:top-3.5 md:rounded-[18px] md:border md:mb-3.5"
      >
        {/* Hairline highlight at top edge */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px z-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)' }}
        />

        {/* Signature glow from left */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-72 z-0"
          style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--accent) 6%, transparent), transparent)' }}
        />

        {/* ── Left: hamburger + breadcrumbs + status pill ── */}
        <div className="relative z-10 flex items-center gap-3 min-w-0">
          <button
            onClick={openMobile}
            className="md:hidden w-[38px] h-[38px] flex items-center justify-center rounded-[9px] text-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <Menu size={17} />
          </button>

          <nav className="flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={crumb.href + i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight size={11} className="text-subtle flex-shrink-0" />}
                  {isLast ? (
                    <span
                      className="text-[14px] font-semibold text-fg truncate"
                      style={{ fontFamily: 'var(--font-syne, var(--font-sans))' }}
                    >
                      {crumb.label}
                    </span>
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

          {/* Status pill — desktop only */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[10.5px] font-medium ml-1 flex-shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--c-green) 9%, transparent)',
              border: '1px solid color-mix(in srgb, var(--c-green) 24%, transparent)',
              color: 'var(--c-green)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: 'var(--c-green)', boxShadow: '0 0 5px var(--c-green)' }}
            />
            System aktywny
          </div>
        </div>

        {/* ── Right ── */}
        <div className="relative z-10 flex items-center gap-0.5 flex-shrink-0">

          {/* Search pill — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-[9px]
              text-muted border border-border
              hover:text-fg hover:border-accent/35 hover:bg-accent/[0.05] hover:shadow-[var(--glow-teal)]
              transition-all text-[12px]"
            style={{ background: 'color-mix(in srgb, var(--bg-raised) 80%, transparent)' }}
          >
            <Search size={12} className="flex-shrink-0" />
            <span className="whitespace-nowrap">Szukaj wszędzie…</span>
            <kbd
              className="ml-2 px-1.5 py-0.5 rounded-[5px] text-[10px] font-mono text-subtle leading-none flex-shrink-0"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.28)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Thin separator between search and icon cluster */}
          <div
            className="hidden md:block w-px h-5 mx-2 flex-shrink-0"
            style={{ background: 'var(--border)' }}
          />

          {/* Dark/light toggle */}
          <DarkLightToggle />

          {/* Brand switcher */}
          <BrandThemeSwitcher />

          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-[38px] h-[38px] flex items-center justify-center rounded-[9px] text-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <Search size={16} />
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false) }}
              className={`relative w-[38px] h-[38px] flex items-center justify-center rounded-[9px] transition-colors
                ${notifOpen ? 'bg-accent/10 text-accent' : 'text-muted hover:text-fg hover:bg-raised'}`}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--nav-pill-text)',
                    boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 55%, transparent)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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

          {/* Avatar chip */}
          <div ref={avatarRef} className="relative ml-1">
            <button
              onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false) }}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-[10px] border transition-all
                ${avatarOpen
                  ? 'border-accent/30 bg-raised shadow-[var(--glow-teal)]'
                  : 'border-transparent hover:border-border hover:bg-raised'}`}
            >
              {/* Avatar tile */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: accentColor + '1a',
                    border: `1.5px solid ${accentColor}55`,
                    color: accentColor,
                    boxShadow: `0 0 0 2.5px ${accentColor}14, 0 0 10px ${accentColor}20`,
                  }}
                >
                  {appUser?.initials ?? 'AM'}
                </div>
                {/* Online indicator */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-[1.5px] animate-pulse"
                  style={{
                    background: 'var(--c-green)',
                    borderColor: 'var(--bg)',
                    boxShadow: '0 0 4px var(--c-green)',
                  }}
                />
              </div>

              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[12px] text-fg font-medium leading-tight truncate max-w-[110px]">
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
