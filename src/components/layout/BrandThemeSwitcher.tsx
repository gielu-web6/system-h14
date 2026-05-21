'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useBrandTheme } from '@/contexts/BrandThemeContext'

const THEMES = [
  {
    id: 'default' as const,
    name: 'AgencyOS',
    label: 'Domyślna kolorystyka',
    from: '#6366f1',
    to: '#8b5cf6',
  },
  {
    id: 'mediovee' as const,
    name: 'Mediovee',
    label: 'Styl marki Mediovee',
    from: '#FC0FC0',
    to: '#e879f9',
  },
]

export function BrandThemeSwitcher() {
  const { brandTheme, setBrandTheme } = useBrandTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = THEMES.find(t => t.id === brandTheme) ?? THEMES[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Zmień kolorystykę marki"
        className={`
          flex items-center gap-1.5 p-2 rounded-[8px] transition-all
          ${open ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'}
        `}
      >
        {/* Two-dot preview of active theme */}
        <span className="flex items-center gap-[3px]">
          <span
            className="w-[11px] h-[11px] rounded-full flex-shrink-0"
            style={{ background: current.from }}
          />
          <span
            className="w-[11px] h-[11px] rounded-full flex-shrink-0"
            style={{ background: current.to }}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[210px] bg-[#0F0F1A] border border-white/10 rounded-[14px] shadow-2xl shadow-black/60 overflow-hidden z-50 p-2">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] px-2 pt-1 pb-2">
            Kolorystyka
          </p>
          <div className="space-y-1">
            {THEMES.map(theme => {
              const active = brandTheme === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => { setBrandTheme(theme.id); setOpen(false) }}
                  className={`
                    w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-left transition-all
                    ${active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}
                  `}
                >
                  {/* Color swatch */}
                  <div
                    className="w-9 h-9 rounded-[9px] flex-shrink-0 flex items-center justify-center shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
                      boxShadow: active ? `0 4px 12px ${theme.from}50` : undefined,
                    }}
                  >
                    {active && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-tight">{theme.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{theme.label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
