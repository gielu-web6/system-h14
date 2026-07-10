'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Send,
  Sparkles,
  CalendarDays,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  BrainCircuit,
  Brain,
  CheckSquare,
  ShoppingBag,
  Package,
  Warehouse,
} from 'lucide-react'
import { useLayout } from './LayoutContext'
import { useAppUser } from '@/contexts/UserContext'

// ─── Nav definitions ──────────────────────────────────────────────────────────

const ADMIN_NAV_SECTIONS = [
  {
    id: 'main',
    section: '',
    items: [
      { href: '/dashboard',              label: 'Dashboard',        icon: LayoutDashboard },
      { href: '/tasks',                  label: 'Zadania',          icon: CheckSquare },
    ],
  },
  {
    id: 'sales',
    section: 'Sprzedaż',
    items: [
      { href: '/pipeline',          label: 'Pipeline (CRM)',   icon: KanbanSquare },
      { href: '/leads',             label: 'Leady',            icon: Users },
      // { href: '/outreach',       label: 'Outreach Gen.',    icon: Send },          // hidden
      // { href: '/ai-scoring',     label: 'AI Scoring',       icon: BrainCircuit },  // hidden
    ],
  },
  {
    id: 'content',
    section: 'Content',
    items: [
      // { href: '/content-generator', label: 'Generator Treści', icon: Sparkles }, // hidden
      { href: '/content-calendar',  label: 'Kalendarz',        icon: CalendarDays },
    ],
  },
  {
    id: 'finance',
    section: 'Finanse & Raporty',
    items: [
      { href: '/finance',           label: 'Finanse',          icon: BarChart3 },
      { href: '/analytics',         label: 'Analityka',        icon: TrendingUp },
    ],
  },
  // { // hidden — sekcja KLIENT z Generator Ofert
  //   id: 'client',
  //   section: 'Klient',
  //   items: [
  //     { href: '/offer-generator', label: 'Generator Ofert', icon: FileText },
  //   ],
  // },
  {
    id: 'allegro',
    section: 'Allegro Dropshipping',
    items: [
      { href: '/allegro-produkty',     label: 'Produkty',   icon: Package },
      { href: '/allegro-hurtownie',    label: 'Hurtownie',  icon: Warehouse },
    ],
  },
  // { // hidden — sekcja AI SYSTEM z Company Brain
  //   id: 'brain',
  //   section: 'AI System',
  //   items: [
  //     { href: '/company-brain', label: 'Company Brain', icon: Brain },
  //   ],
  // },
]

const ALLEGRO_NAV_SECTIONS = [
  {
    id: 'main',
    section: '',
    items: [
      { href: '/tasks',            label: 'Zadania',   icon: CheckSquare },
    ],
  },
  {
    id: 'content',
    section: 'Content',
    items: [
      { href: '/content-calendar', label: 'Kalendarz', icon: CalendarDays },
    ],
  },
  {
    id: 'allegro',
    section: 'Allegro Dropshipping',
    items: [
      { href: '/allegro-produkty',     label: 'Produkty',   icon: Package },
      { href: '/allegro-hurtownie',    label: 'Hurtownie',  icon: Warehouse },
    ],
  },
]

const SALES_NAV_SECTIONS = [
  {
    id: 'main',
    section: '',
    items: [
      { href: '/dashboard',              label: 'Mój Dashboard',    icon: LayoutDashboard },
      { href: '/tasks',                  label: 'Zadania',          icon: CheckSquare },
    ],
  },
  {
    id: 'sales',
    section: 'Sprzedaż',
    items: [
      { href: '/pipeline',          label: 'Mój Pipeline',     icon: KanbanSquare },
      { href: '/leads',             label: 'Moje Leady',       icon: Users },
      { href: '/outreach',          label: 'Outreach Gen.',    icon: Send },
      { href: '/offer-generator',   label: 'Moje Oferty',      icon: FileText },
    ],
  },
  {
    id: 'tools',
    section: 'Narzędzia',
    items: [
      { href: '/content-generator', label: 'Content AI',       icon: Sparkles },
      { href: '/knowledge-base',    label: 'Bank Obiekcji',    icon: Brain },
    ],
  },
  {
    id: 'stats',
    section: 'Wyniki',
    items: [
      { href: '/my-stats',          label: 'Moje Wyniki',      icon: BarChart3 },
    ],
  },
]

// ─── Group accent colours ─────────────────────────────────────────────────────

const GROUP_ACCENT: Record<string, string> = {
  main:    'var(--accent)',
  sales:   'var(--group-sprzedaz)',
  content: 'var(--group-content)',
  finance: 'var(--group-finanse)',
  client:  'var(--group-klient)',
  brain:   'var(--group-ai)',
  tools:   'var(--group-content)',
  stats:   'var(--group-finanse)',
  allegro: 'var(--group-allegro)',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/demo') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

// ─── DNA progress placeholder ─────────────────────────────────────────────────
// TODO: podłączyć do Company Brain DNA (fetch % uzupełnienia z Supabase)
const DNA_PCT = 36
const DNA_CIRCUMFERENCE = 2 * Math.PI * 14

// ─── NavItem ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string
  label: string
  icon: React.ElementType
  collapsed: boolean
  onClick?: () => void
  soon?: boolean
  accent?: string
}

function NavItem({ href, label, icon: Icon, collapsed, onClick, soon, accent = 'var(--accent)' }: NavItemProps) {
  const pathname = usePathname()
  const active = isItemActive(pathname, href)

  if (soon) {
    return (
      <div
        title={collapsed ? label : undefined}
        className={`relative flex items-center gap-2.5 px-2 py-1.5 rounded-[9px] text-[12.5px]
          text-subtle cursor-not-allowed select-none
          ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 bg-white/[0.03]">
          <Icon size={14} className="opacity-25" />
        </div>
        {!collapsed && (
          <>
            <span className="truncate">{label}</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-raised border border-border text-subtle font-semibold tracking-wide">
              SOON
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-2.5 px-2 py-1.5 rounded-[9px] text-[12.5px] font-medium
        transition-all duration-150 group select-none
        ${active ? '' : 'text-muted hover:text-fg'}
        ${collapsed ? 'justify-center' : ''}`}
      style={active
        ? {
            background: accent,
            boxShadow: `0 0 18px color-mix(in srgb, ${accent} 38%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)`,
            color: 'var(--nav-pill-text)',
          } as React.CSSProperties
        : undefined}
    >
      {/* Icon tile */}
      <div className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0
        transition-all duration-150
        ${active
          ? 'bg-black/[0.18]'
          : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
        }`}
      >
        <Icon
          size={14}
          className={active ? '' : 'text-subtle group-hover:text-fg'}
        />
      </div>

      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 z-50
          px-2.5 py-1.5 rounded-[7px] text-xs font-medium
          bg-raised border border-border text-fg whitespace-nowrap
          opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0
          transition-all duration-150 shadow-xl">
          {label}
        </div>
      )}
    </Link>
  )
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

interface SidebarContentProps {
  collapsed: boolean
  onNavClick?: () => void
  showCloseButton?: boolean
  onClose?: () => void
}

function SidebarContent({ collapsed, onNavClick, showCloseButton, onClose }: SidebarContentProps) {
  const { isSales, isAllegro, user: appUser } = useAppUser()
  const navSections = isAllegro ? ALLEGRO_NAV_SECTIONS : isSales ? SALES_NAV_SECTIONS : ADMIN_NAV_SECTIONS

  return (
    <div className="flex flex-col h-full relative">
      {/* dark-only: signature radial bloom behind logo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 z-0"
        style={{ background: 'radial-gradient(70% 50% at 50% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 80%)' }} />

      {/* ── Logo / Brand ── */}
      <div className={`relative z-10 flex items-center border-b border-border flex-shrink-0
        ${collapsed ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3'}`}>

        {/* Brand mark — 40px gradient tile */}
        <div className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--gradient-signature)', boxShadow: 'var(--glow-teal)' }}>
          <Zap size={17} strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.95)' }} />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-fg tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-syne, var(--font-sans))' }}>
              System H14
            </p>
            {/* pill badge */}
            <span className="inline-flex items-center mt-1.5 px-1.5 py-[2px] rounded-full
              text-[9px] font-semibold tracking-wide
              bg-accent/10 border border-accent/25 text-accent">
              AM Automations
            </span>
          </div>
        )}

        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="flex flex-col gap-6">
          {navSections.map((section) => (
            <div key={section.id}>
              {!collapsed && section.section && (
                <div className="flex items-center gap-1.5 px-3 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-80"
                    style={{ background: GROUP_ACCENT[section.id] ?? 'var(--accent)' }}
                  />
                  <p className="section-label select-none">{section.section}</p>
                </div>
              )}
              {collapsed && section.section && (
                <div className="mx-auto w-5 h-px bg-border mb-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    collapsed={collapsed}
                    onClick={onNavClick}
                    accent={GROUP_ACCENT[section.id] ?? 'var(--accent)'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Bottom ── */}
      <div className="flex-shrink-0 border-t border-border pt-2 px-2 pb-2 space-y-1.5">

        {/* ── DNA widget — only when expanded, not for allegro role ── */}
        {!collapsed && !isAllegro && (
          <div className="rounded-[10px] bg-raised border border-border p-3">
            {/* TODO: podłączyć do Company Brain DNA — fetch % uzupełnienia */}
            <div className="flex items-center gap-3">
              {/* SVG progress ring */}
              <div className="relative flex-shrink-0 w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                    stroke="rgba(255,255,255,0.06)" />
                  <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                    stroke="var(--accent)"
                    strokeDasharray={`${(DNA_PCT / 100) * DNA_CIRCUMFERENCE} ${DNA_CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(0,200,190,0.45))' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center
                  text-[8.5px] font-bold text-accent num">
                  {DNA_PCT}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-semibold text-fg leading-tight">DNA firmy</p>
                <p className="text-[10px] text-muted mt-0.5 leading-snug">12 pytań do uzupełnienia</p>
              </div>
            </div>
            <Link
              href="/company-brain"
              onClick={onNavClick}
              className="mt-2.5 flex items-center justify-center gap-1 w-full py-1.5 rounded-[7px]
                bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium
                hover:bg-accent/15 hover:border-accent/35 transition-colors"
            >
              Uzupełnij Brain →
            </Link>
          </div>
        )}

        {/* ── User card — only when expanded ── */}
        {/* TODO: podłączyć klik do dropdown profilu / wylogowania */}
        {!collapsed && (
          <button
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[9px]
              hover:bg-fg/[0.04] transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0
                text-[11px] font-bold"
              style={{
                background: (appUser?.color ?? '#00c8be') + '18',
                border: `1.5px solid ${appUser?.color ?? '#00c8be'}55`,
                color: appUser?.color ?? '#00c8be',
                boxShadow: `0 0 10px ${appUser?.color ?? '#00c8be'}30`,
              }}
            >
              {appUser?.initials ?? 'AM'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11.5px] font-medium text-fg leading-tight truncate">
                {(appUser as any)?.fullName ?? appUser?.name ?? 'Anna Kowalska'}
              </p>
              {/* TODO: podłączyć do planu subskrypcji usera */}
              <p className="text-[10px] text-muted leading-tight">System Pracy</p>
            </div>
            <ChevronRight size={12} className="text-subtle group-hover:text-muted transition-colors flex-shrink-0" />
          </button>
        )}

        {/* Footer link — only when expanded */}
        {!collapsed && (
          <div className="px-1 pt-0.5">
            <p className="section-label leading-relaxed">
              H14 ·{' '}
              <a
                href="https://amautomations.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/60 hover:text-accent transition-colors"
              >
                amautomations.pl
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar (exported) ───────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useLayout()
  const pathname = usePathname()

  useEffect(() => { closeMobile() }, [pathname, closeMobile])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col fixed top-3.5 left-3.5 bottom-3.5 z-40
          sidebar-depth border border-border sidebar-transition shell-sidebar
          rounded-[22px]
          ${collapsed ? 'w-[56px]' : 'w-[220px]'}`}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle — sits outside the aside rounded clip zone */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[68px] z-10 w-6 h-6 rounded-full
            bg-card border border-border flex items-center justify-center
            text-muted hover:text-fg hover:border-accent/30
            transition-all duration-200 shadow-sm"
          title={collapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
        >
          <ChevronLeft
            size={11}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>

      {/* ── Mobile: Overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile: Drawer ── */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen z-50 w-[260px]
          sidebar-depth border-r border-border
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent
          collapsed={false}
          onNavClick={closeMobile}
          showCloseButton
          onClose={closeMobile}
        />
      </aside>
    </>
  )
}
