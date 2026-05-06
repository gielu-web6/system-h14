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
} from 'lucide-react'
import { useLayout } from './LayoutContext'
import { useBrandTheme } from '@/contexts/BrandThemeContext'

// ─── Nav definition ──────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    id: 'main',
    section: '',
    items: [
      { href: '/demo',                 label: 'Dashboard',         icon: LayoutDashboard },
    ],
  },
  {
    id: 'sales',
    section: 'Sprzedaż',
    items: [
      { href: '/pipeline',            label: 'Pipeline (CRM)',    icon: KanbanSquare },
      { href: '/leads',               label: 'Leady',             icon: Users },
      { href: '/outreach',            label: 'Outreach',          icon: Send },
      { href: '/ai-scoring',          label: 'AI Scoring',        icon: BrainCircuit },
    ],
  },
  {
    id: 'content',
    section: 'Content',
    items: [
      { href: '/content-generator',   label: 'Generator Treści',  icon: Sparkles },
      { href: '/content-calendar',    label: 'Kalendarz',         icon: CalendarDays },
    ],
  },
  {
    id: 'finance',
    section: 'Finanse & Raporty',
    items: [
      { href: '/finance',             label: 'Finanse',           icon: BarChart3 },
      { href: '/analytics',           label: 'Analityka',         icon: TrendingUp },
    ],
  },
  {
    id: 'client',
    section: 'Klient',
    items: [
      { href: '/offer-generator',     label: 'Generator Ofert',   icon: FileText },
    ],
  },
  {
    id: 'brain',
    section: 'AI System',
    items: [
      { href: '/company-brain',       label: 'Company Brain',     icon: Brain },
    ],
  },
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/demo') return pathname === '/demo'
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
}

function NavItem({ href, label, icon: Icon, collapsed, onClick, soon }: NavItemProps) {
  const pathname = usePathname()
  const active = isItemActive(pathname, href)

  if (soon) {
    return (
      <div
        title={collapsed ? label : undefined}
        className={`
          relative flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium
          text-white/25 cursor-not-allowed select-none
          ${collapsed ? 'justify-center px-2' : ''}
        `}
      >
        <Icon size={16} className="flex-shrink-0 text-white/20" />
        {!collapsed && (
          <>
            <span className="truncate">{label}</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-semibold tracking-wide">
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
      className={`
        relative flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium
        transition-all duration-150 group select-none
        ${active
          ? 'nav-active bg-primary/12 text-primary'
          : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
        }
        ${collapsed ? 'justify-center px-2' : ''}
      `}
    >
      <Icon
        size={16}
        className={`flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-white/40 group-hover:text-white/70'}`}
      />
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="
          pointer-events-none absolute left-full ml-3 z-50
          px-2.5 py-1.5 rounded-[8px] text-xs font-medium
          bg-[#1E2A45] border border-white/10 text-white whitespace-nowrap
          opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0
          transition-all duration-150 shadow-xl
        ">
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
  const { brandTheme } = useBrandTheme()
  const isMediovee = brandTheme === 'mediovee'

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className={`
        flex items-center border-b border-white/[0.06] flex-shrink-0
        ${collapsed ? 'justify-center px-3 py-4' : 'gap-3 px-4 py-4'}
      `}>
        <div
          className="w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center shadow-lg"
          style={isMediovee
            ? { background: 'linear-gradient(135deg, #FC0FC0 0%, #e879f9 100%)', boxShadow: '0 4px 14px rgba(252,15,192,0.35)' }
            : { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }
          }
        >
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white tracking-tight leading-none">
              {isMediovee ? 'Mediovee' : 'System H14'}
            </p>
            <p className="text-[10px] text-white/35 mt-0.5 tracking-wide uppercase">
              {isMediovee ? 'Platform' : 'AM Automations'}
            </p>
          </div>
        )}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {/* Section label */}
            {!collapsed && section.section && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-white/25 select-none">
                {section.section}
              </p>
            )}
            {collapsed && section.section && (
              <div className="mx-auto w-4 h-px bg-white/10 mb-2" />
            )}
            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom: Settings ── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] p-2 space-y-0.5">
        <NavItem
          href="/settings"
          label="Ustawienia"
          icon={Settings}
          collapsed={collapsed}
          onClick={onNavClick}
          soon
        />
        {/* Footer watermark */}
        {!collapsed && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-[9px] text-white/20 leading-relaxed">
              System H14 ·{' '}
              <span className="text-white/35">AM Automations</span>
              {' · '}
              <a
                href="https://amautomations.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white/60"
                style={{ color: isMediovee ? 'rgba(252,15,192,0.55)' : 'rgba(99,102,241,0.6)' }}
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

  // Close mobile sidebar on route change
  useEffect(() => { closeMobile() }, [pathname, closeMobile])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          hidden md:flex flex-col fixed left-0 top-0 h-screen z-40
          bg-[#0F0F1A] border-r border-white/[0.06] sidebar-transition
          ${collapsed ? 'w-[64px]' : 'w-[240px]'}
        `}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapsed}
          className={`
            absolute -right-3 top-[72px] z-10
            w-6 h-6 rounded-full
            bg-[#0F0F1A] border border-white/10
            flex items-center justify-center
            text-white/40 hover:text-white hover:border-primary/50
            transition-all duration-200 shadow-md
          `}
          title={collapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
        >
          <ChevronLeft
            size={12}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>

      {/* ── Mobile: Overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile: Drawer ── */}
      <aside
        className={`
          md:hidden fixed left-0 top-0 h-screen z-50 w-[280px]
          bg-[#0F0F1A] border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
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
