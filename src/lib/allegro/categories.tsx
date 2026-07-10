'use client'

import { useState } from 'react'

// ─── Source of truth for Allegro categories, commissions, fees ────────────────

export const ALLEGRO_COMMISSION: Record<string, number> = {
  'Elektronika':        5,
  'Sport i turystyka':  6,
  'Motoryzacja':        7,
  'Dom i ogród':        9,
  'Dziecko':            8,
  'Supermarket':        8,
  'Uroda i zdrowie':    9,
  'Moda i obuwie':      11.5,
  'Kolekcje i sztuka':  10,
  'Firma i usługi':     8,
  'Pozostałe':          14,
}

export const CATEGORY_OPTIONS = Object.keys(ALLEGRO_COMMISSION)

export const TRANSACTION_FEE_PCT = 1.2

// ─── CategorySelect ───────────────────────────────────────────────────────────
// Supports known categories (with auto-commission) and a free-text "custom" mode.
//
// value semantics:
//   ""                       → nothing selected
//   string in CATEGORY_OPTIONS → known category selected
//   non-empty string NOT in   → custom category; shows text input below the select

const CUSTOM_SENTINEL = '__custom__'

export function CategorySelect({ value, onChange, className }: {
  value: string
  onChange: (cat: string | null, cpc: number | null) => void
  className: string
}) {
  const valueIsCustom = value.length > 0 && !CATEGORY_OPTIONS.includes(value)
  const [customMode, setCustomMode] = useState(valueIsCustom)
  const isCustom = customMode || valueIsCustom
  const selectValue = isCustom ? CUSTOM_SENTINEL : value

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    if (v === '') {
      setCustomMode(false)
      onChange(null, null)
    } else if (v === CUSTOM_SENTINEL) {
      setCustomMode(true)
      onChange(valueIsCustom ? value : '', null)
    } else {
      setCustomMode(false)
      onChange(v, ALLEGRO_COMMISSION[v] ?? null)
    }
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value
    onChange(text || null, null)
  }

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className={className}
      >
        <option value="">— wybierz kategorię —</option>
        {CATEGORY_OPTIONS.map(c => (
          <option key={c} value={c}>{c} ({ALLEGRO_COMMISSION[c]}%)</option>
        ))}
        <option value={CUSTOM_SENTINEL}>Inna (wpisz własną)…</option>
      </select>

      {isCustom && (
        <input
          type="text"
          value={value}
          onChange={handleCustomInput}
          placeholder="Wpisz nazwę kategorii…"
          className={className}
        />
      )}
    </div>
  )
}
