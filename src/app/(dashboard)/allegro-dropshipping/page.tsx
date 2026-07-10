'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CategorySelect } from '@/lib/allegro/categories'

interface GenerateResult {
  title: string
  title_variants: string[]
  description: string
  keywords: string[]
  params: { marka: string; model: string; ean: string; kolor: string; rozmiar: string }
  warnings: string[]
}

export default function AllegroDropshippingPage() {
  const router = useRouter()
  const [productName, setProductName]         = useState('')
  const [baseDescription, setBaseDescription] = useState('')
  const [category, setCategory]               = useState('')
  const [params, setParams]                   = useState('')
  const [offerTitle, setOfferTitle]           = useState('')
  const [offerDescription, setOfferDescription] = useState('')
  const [saving, setSaving]                   = useState(false)
  const [saveError, setSaveError]             = useState<string | null>(null)
  const [generating, setGenerating]           = useState(false)
  const [genError, setGenError]               = useState<string | null>(null)
  const [titleVariants, setTitleVariants]     = useState<string[]>([])
  const [warnings, setWarnings]               = useState<string[]>([])
  const [suggestedParams, setSuggestedParams] = useState<GenerateResult['params'] | null>(null)
  const [commissionPct, setCommissionPct]     = useState<number | null>(null)
  const [genParams, setGenParams]             = useState<GenerateResult['params'] | null>(null)

  const accent = 'var(--group-allegro)'

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--group-allegro) 50%, transparent)'
  }
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = ''
  }

  async function handleGenerate() {
    if (!productName.trim()) return
    setGenerating(true)
    setGenError(null)
    setTitleVariants([])
    setWarnings([])
    setSuggestedParams(null)
    setGenParams(null)
    try {
      const res = await fetch('/api/allegro/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, baseDescription, category, params }),
      })
      const data = await res.json() as GenerateResult & { error?: string }
      if (!res.ok || data.error) {
        setGenError(data.error ?? 'Błąd generowania oferty.')
        return
      }
      setOfferTitle(data.title ?? '')
      setOfferDescription(data.description ?? '')
      setTitleVariants(data.title_variants ?? [])
      setWarnings(data.warnings ?? [])
      setGenParams(data.params ?? null)
      // Suggest params only if user field is empty and API returned something
      const p = data.params
      const hasSuggested = p && Object.values(p).some(v => v?.trim())
      if (!params.trim() && hasSuggested) setSuggestedParams(p)
    } catch {
      setGenError('Błąd sieci — spróbuj ponownie.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleAddToProducts() {
    if (!productName.trim()) return
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from('allegro_products').insert({
      name:              productName.trim(),
      offer_title:       offerTitle.trim() || null,
      offer_description: offerDescription.trim() || null,
      category:          category.trim() || null,
      commission_pct:    commissionPct,
      ean:               genParams?.ean?.trim() || null,
      params:            genParams ?? {},
      status:            'do_wystawienia',
    })
    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }
    router.push('/allegro-produkty')
  }

  const canSave = productName.trim().length > 0

  return (
    <div className="max-w-[1100px] space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[20px] font-bold text-fg flex items-center gap-2">
          <ShoppingBag size={18} style={{ color: accent }} />
          Generator ofert Allegro
        </h1>
        <p className="text-[12px] text-muted mt-0.5">
          Automatycznie twórz zoptymalizowane tytuły i opisy dla Allegro Dropshipping.
        </p>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: form ── */}
        <div className="card-elevated rounded-[14px] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: accent }}>
            Dane produktu
          </p>

          {/* Nazwa produktu */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              Nazwa produktu <span className="normal-case font-normal text-subtle">(wymagana)</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="np. Słuchawki bezprzewodowe Sony WH-1000XM5"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Opis bazowy */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              Opis bazowy
            </label>
            <textarea
              value={baseDescription}
              onChange={(e) => setBaseDescription(e.target.value)}
              placeholder="Wklej opis producenta lub własne notatki o produkcie…"
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all resize-none"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Kategoria */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              Kategoria{' '}
              <span className="normal-case font-normal text-subtle">(opcjonalnie)</span>
            </label>
            <CategorySelect
              value={category}
              onChange={(cat, cpc) => { setCategory(cat ?? ''); setCommissionPct(cpc) }}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg text-[13px] focus:outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Parametry */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              Parametry: marka, model, EAN, kolor, rozmiar{' '}
              <span className="normal-case font-normal text-subtle">(opcjonalnie)</span>
            </label>
            <input
              type="text"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              placeholder="np. Sony, WH-1000XM5, 4548736132528, czarny"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Przycisk generowania */}
          {genError && (
            <div className="flex items-start gap-2 text-[12px] text-red-500">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {genError}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={!productName.trim() || generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accent, color: 'var(--nav-pill-text)' }}
          >
            {generating ? (
              <><Loader2 size={14} className="animate-spin" /> Generuję…</>
            ) : (
              <><Sparkles size={14} /> Generuj ofertę</>
            )}
          </button>
        </div>

        {/* ── Right: output ── */}
        <div className="space-y-4">

          {/* Tytuł oferty */}
          <div className="card-elevated rounded-[14px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: accent }}>
                Tytuł oferty
              </p>
              <span className="text-[10px] text-subtle">max 75 znaków</span>
            </div>
            <textarea
              rows={2}
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              maxLength={75}
              placeholder="Tutaj pojawi się wygenerowany tytuł oferty…"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] leading-snug focus:outline-none transition-all resize-none"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            <div className="flex justify-end">
              <span className={`text-[11px] ${offerTitle.length > 70 ? 'text-amber-500' : 'text-subtle'}`}>
                {offerTitle.length} / 75
              </span>
            </div>

            {/* Warianty tytułu */}
            {titleVariants.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-subtle uppercase tracking-wide">Warianty — kliknij aby wybrać</p>
                <div className="flex flex-wrap gap-1.5">
                  {titleVariants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setOfferTitle(v)}
                      className="px-2.5 py-1 rounded-[8px] text-[11px] border border-fg/[0.1] bg-raised text-fg hover:border-fg/30 transition-all text-left"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ostrzeżenia */}
            {warnings.length > 0 && (
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-500/80">{w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Opis oferty */}
          <div className="card-elevated rounded-[14px] p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: accent }}>
              Opis oferty
            </p>
            <textarea
              rows={8}
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              placeholder="Tutaj pojawi się wygenerowany opis oferty Allegro…"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] leading-relaxed focus:outline-none transition-all resize-none"
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Sugerowane parametry */}
          {suggestedParams && (
            <div className="card-elevated rounded-[14px] p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                Sugerowane parametry
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {(Object.entries(suggestedParams) as [string, string][])
                  .filter(([, v]) => v?.trim())
                  .map(([k, v]) => (
                    <div key={k} className="text-[12px]">
                      <span className="text-subtle capitalize">{k}: </span>
                      <span className="text-fg">{v}</span>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => {
                  const parts = (Object.entries(suggestedParams) as [string, string][])
                    .filter(([, v]) => v?.trim())
                    .map(([k, v]) => `${k}: ${v}`)
                  setParams(parts.join(', '))
                  setSuggestedParams(null)
                }}
                className="text-[11px] text-subtle hover:text-fg transition-colors underline underline-offset-2"
              >
                Wstaw do pola parametrów
              </button>
            </div>
          )}

          {/* ── Most do produktów ── */}
          <div className="card-elevated rounded-[14px] p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: accent }}>
              Dodaj do bazy produktów
            </p>
            <p className="text-[12px] text-muted">
              Zapisz ten produkt (wraz z tytułem i opisem) w zakładce Produkty Allegro.
              Wymagana jest tylko nazwa produktu.
            </p>

            {saveError && (
              <div className="flex items-center gap-2 text-[12px] text-red-500">
                <AlertCircle size={13} />
                {saveError}
              </div>
            )}

            <button
              onClick={handleAddToProducts}
              disabled={!canSave || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: accent, color: 'var(--nav-pill-text)' }}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Zapisywanie…</>
              ) : (
                <><ArrowRight size={14} /> Dodaj do produktów</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
