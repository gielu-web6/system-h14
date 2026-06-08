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
  X,
  Zap,
  BrainCircuit,
  Brain,
  CheckSquare,
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
      { href: '/outreach',          label: 'Outreach Gen.',    icon: Send },
      { href: '/ai-scoring',        label: 'AI Scoring',       icon: BrainCircuit },
    ],
  },
  {
    id: 'content',
    section: 'Content',
    items: [
      { href: '/content-generator', label: 'Generator Treści', icon: Sparkles },
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
  {
    id: 'client',
    section: 'Klient',
    items: [
      { href: '/offer-generator',   label: 'Generator Ofert',  icon: FileText },
    ],
  },
  {
    id: 'brain',
    section: 'AI System',
    items: [
      { href: '/company-brain',     label: 'Company Brain',    icon: Brain },
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/demo') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

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
        className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-[7px] text-[12.5px]
          text-subtle cursor-not-allowed select-none
          ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon size={15} className="flex-shrink-0 opacity-30" />
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
      className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-[7px] text-[12.5px] font-medium
        transition-colors duration-100 group select-none
        ${active
          ? 'nav-active'
          : 'text-muted hover:text-fg hover:bg-[rgba(255,255,255,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]'
        }
        ${collapsed ? 'justify-center px-2' : ''}`}
      style={active
        ? { '--nav-accent': accent, color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` } as React.CSSProperties
        : undefined}
    >
      <Icon
        size={15}
        className={`flex-shrink-0 transition-colors ${active ? '' : 'text-subtle group-hover:text-muted'}`}
        style={active ? { color: accent } : undefined}
      />
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
  const { isSales } = useAppUser()
  const navSections = isSales ? SALES_NAV_SECTIONS : ADMIN_NAV_SECTIONS

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className={`flex items-center border-b border-border flex-shrink-0
        ${collapsed ? 'justify-center px-3 py-[14px]' : 'gap-2.5 px-4 py-[14px]'}`}>
        <div className="w-7 h-7 rounded-[8px] flex-shrink-0 flex items-center justify-center bg-accent/10 border border-accent/20">
          <Zap size={13} className="text-accent" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-fg tracking-tight leading-none">System H14</p>
            <p className="section-label mt-0.5">AM Automations</p>
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
        {/* justify-between distributes free vertical space between section groups.
            gap-4 is the minimum gap so sections never touch on short screens.
            min-h-full ensures the flex container fills the nav viewport height
            so justify-between has space to distribute on tall screens. */}
        <div className="flex flex-col gap-9">
          {navSections.map((section) => (
            <div key={section.id}>
              {!collapsed && section.section && (
                <p className="px-3 mb-1 section-label select-none">{section.section}</p>
              )}
              {collapsed && section.section && (
                <div className="mx-auto w-5 h-px bg-border mb-2" />
              )}
              <div className="space-y-px">
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
      <div className="flex-shrink-0 border-t border-border p-2 space-y-px">
        {!isSales && (
          <NavItem
            href="/settings"
            label="Ustawienia"
            icon={Settings}
            collapsed={collapsed}
            onClick={onNavClick}
            soon
          />
        )}
        {!collapsed && (
          <div className="px-3 pt-2 pb-0.5">
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
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-40
          bg-sidebar border-r border-border sidebar-transition
          ${collapsed ? 'w-[56px]' : 'w-[220px]'}`}
      >
        <SidebarContent collapsed={collapsed} />

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
          bg-sidebar border-r border-border
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
