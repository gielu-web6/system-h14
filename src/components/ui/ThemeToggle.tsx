'use client'

import { useUITheme } from '@/contexts/UIThemeContext'
import { THEME_META } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useUITheme()
  const isArctic = theme === 'arctic-executive'
  const next = THEME_META[isArctic ? 'dark-operator' : 'arctic-executive']

  return (
    <button
      onClick={toggleTheme}
      title={`Przełącz na: ${next.label}`}
      aria-label={`Aktywny motyw: ${THEME_META[theme].label}. Kliknij aby przełączyć.`}
      className={`
        relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px]
        border transition-all duration-200 select-none
        ${isArctic
          ? 'bg-white border-[rgba(0,0,0,0.11)] text-[#1A2744] hover:bg-[#F0F2F5] hover:border-[rgba(0,0,0,0.18)]'
          : 'bg-white/[0.05] border-white/[0.09] text-white/60 hover:bg-white/[0.09] hover:text-white'
        }
      `}
    >
      {/* Track */}
      <span
        className={`
          relative inline-flex w-8 h-[18px] rounded-full transition-colors duration-300 flex-shrink-0
          ${isArctic ? 'bg-[#1A2744]' : 'bg-white/20'}
        `}
      >
        {/* Thumb */}
        <span
          className={`
            absolute top-[2px] w-[14px] h-[14px] rounded-full
            transition-all duration-300 shadow-sm flex items-center justify-center
            ${isArctic
              ? 'left-[18px] bg-white'
              : 'left-[2px] bg-white'
            }
          `}
        >
          {/* Moon / Sun icon on thumb */}
          <span className="text-[7px] leading-none select-none">
            {isArctic ? '☀' : '●'}
          </span>
        </span>
      </span>

      {/* Label — hidden on mobile */}
      <span className="hidden sm:block text-[11px] font-medium leading-none whitespace-nowrap">
        {isArctic ? 'Arctic' : 'Dark'}
      </span>
    </button>
  )
}
