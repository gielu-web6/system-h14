'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Pencil, Copy, ExternalLink, Loader2,
  X, Check, AlertCircle, ShoppingBag, Calculator, ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ALLEGRO_COMMISSION, CATEGORY_OPTIONS, TRANSACTION_FEE_PCT, CategorySelect } from '@/lib/allegro/categories'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = 'pomysl' | 'do_wystawienia' | 'aktywny' | 'wstrzymany' | 'wyprzedany' | 'wycofany'

interface Product {
  id: string
  name: string
  thumbnail_url: string | null
  category: string | null
  sku: string | null
  ean: string | null
  supplier: string | null
  supplier_url: string | null
  purchase_price: number | null
  supplier_shipping: number | null
  purchase_is_net: boolean
  vat_pct: number | null
  target_price: number | null
  commission_pct: number | null
  shipping_cost: number | null
  units_sold: number | null
  status: ProductStatus
  offer_title: string | null
  offer_description: string | null
  allegro_url: string | null
  notes: string | null
  created_at: string
}

type ProductDraft = Omit<Product, 'id' | 'created_at'>

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  pomysl:         'Pomysł',
  do_wystawienia: 'Do wystawienia',
  aktywny:        'Aktywny',
  wstrzymany:     'Wstrzymany',
  wyprzedany:     'Wyprzedany',
  wycofany:       'Wycofany',
}
const STATUS_COLOR: Record<ProductStatus, string> = {
  pomysl:         'bg-fg/[0.08] text-muted',
  do_wystawienia: 'bg-info/15 text-info',
  aktywny:        'bg-success/15 text-success',
  wstrzymany:     'bg-amber/15 text-amber',
  wyprzedany:     'bg-fg/[0.06] text-subtle',
  wycofany:       'bg-danger/15 text-danger',
}
const STATUS_OPTIONS: ProductStatus[] = ['pomysl','do_wystawienia','aktywny','wstrzymany','wyprzedany','wycofany']

// ─── Single margin engine ─────────────────────────────────────────────────────

interface MarginInput {
  target_price:      number | null
  purchase_price:    number | null
  supplier_shipping: number | null
  shipping_cost:     number | null
  commission_pct:    number | null
  units_sold?:       number | null
  pitPct?:           number
  healthPct?:        number
  purchase_is_net?:  boolean
  vat_pct?:          number | null
}

interface MarginResult {
  przychod:     number
  kosztTowaru:  number
  prowizja:     number
  oplataTrans:  number
  wysylka:      number
  zysk:         number
  pit:          number
  zdrowotne:    number
  naReke:       number
  marginPct:    number
  naRekePct:    number
  revenue:      number
  profit:       number
}

function calcMargin(input: MarginInput): MarginResult {
  const tp  = input.target_price      ?? 0
  const pp  = input.purchase_price    ?? 0
  const ss  = input.supplier_shipping ?? 0
  const sc  = input.shipping_cost     ?? 0
  const cpc = input.commission_pct    ?? 0
  const us  = input.units_sold        ?? 0
  const pit_pct    = input.pitPct    ?? 0
  const health_pct = input.healthPct ?? 0

  const isNet       = input.purchase_is_net ?? false
  const vat         = input.vat_pct ?? 23
  const grossFactor = isNet ? (1 + vat / 100) : 1

  const prowizja    = tp * cpc / 100
  const oplataTrans = tp * TRANSACTION_FEE_PCT / 100
  const kosztTowaru = (pp + ss) * grossFactor
  const zysk        = tp - kosztTowaru - prowizja - oplataTrans - sc
  const marginPct   = tp ? (zysk / tp) * 100 : 0
  const pit         = Math.max(0, zysk) * pit_pct / 100
  const zdrowotne   = Math.max(0, zysk) * health_pct / 100
  const naReke      = zysk - pit - zdrowotne
  const naRekePct   = tp ? (naReke / tp) * 100 : 0
  const revenue     = tp * us
  const profit      = zysk * us

  return { przychod: tp, kosztTowaru, prowizja, oplataTrans, wysylka: sc,
           zysk, pit, zdrowotne, naReke, marginPct, naRekePct, revenue, profit }
}

function marginColor(pct: number) {
  if (pct <= 0)  return 'text-danger'
  if (pct < 15)  return 'text-amber'
  return 'text-success'
}

function fmtPLN(n: number) {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN'
}
function fmtNum(n: number) { return n.toLocaleString('pl-PL') }

// ─── Single margin breakdown component ───────────────────────────────────────

function MarginBreakdown({ data, cpc, withTax }: {
  data: MarginResult
  cpc: number
  withTax: boolean
}) {
  const row = (label: string, val: number, sign: '+' | '-', cls = 'text-muted') => (
    <div key={label} className="flex items-center justify-between">
      <span className="text-[12px] text-subtle">{label}</span>
      <span className={`text-[12px] font-medium num ${cls}`}>
        {sign}{Math.abs(val).toFixed(2)} PLN
      </span>
    </div>
  )
  return (
    <div className="space-y-1.5">
      {row('Cena sprzedaży', data.przychod, '+', 'text-fg')}
      {row('Koszt towaru + dostawa dostawcy', data.kosztTowaru, '-')}
      {row(`Prowizja Allegro ${cpc.toFixed(1)}%`, data.prowizja, '-')}
      {row(`Opłata transakcyjna ${TRANSACTION_FEE_PCT}%`, data.oplataTrans, '-')}
      {data.wysylka > 0 && row('Koszt wysyłki do kupującego', data.wysylka, '-')}
      <div className="border-t border-border my-1" />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-fg">Zysk / szt.</span>
        <span className={`text-[13px] font-bold num ${marginColor(data.marginPct)}`}>
          {data.zysk.toFixed(2)} PLN
          <span className="ml-1.5 text-[11px] font-normal opacity-70">({data.marginPct.toFixed(1)}%)</span>
        </span>
      </div>
      {withTax && (data.pit + data.zdrowotne) > 0 && (
        <>
          {data.pit > 0       && row('PIT', data.pit, '-')}
          {data.zdrowotne > 0 && row('Składka zdrowotna', data.zdrowotne, '-')}
          <div className="border-t border-border my-1" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-fg">Na rękę / szt.</span>
            <span className={`text-[13px] font-bold num ${marginColor(data.naRekePct)}`}>
              {data.naReke.toFixed(2)} PLN
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultDraft(): ProductDraft {
  return {
    name: '', thumbnail_url: null, category: null, sku: null, ean: null,
    supplier: null, supplier_url: null,
    purchase_price: null, supplier_shipping: null,
    purchase_is_net: false, vat_pct: 23,
    target_price: null, commission_pct: null, shipping_cost: null,
    units_sold: 0, status: 'pomysl',
    offer_title: null, offer_description: null, allegro_url: null, notes: null,
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProductModal({ initial, editingId, onClose, onSaved }: {
  initial: ProductDraft
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft]               = useState<ProductDraft>(initial)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showMore, setShowMore]           = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiSource, setAiSource]         = useState('')
  const [aiVariants, setAiVariants]     = useState<string[]>([])
  const [aiWarnings, setAiWarnings]     = useState<string[]>([])

  const patch  = (p: Partial<ProductDraft>) => setDraft(prev => ({ ...prev, ...p }))
  const num    = (v: string) => v === '' ? null : parseFloat(v) || null
  const int    = (v: string) => v === '' ? null : parseInt(v)   || null
  const isEdit = !!editingId

  const marginData = calcMargin(draft)
  const hasPrice   = (draft.target_price ?? 0) > 0

  async function handleSave() {
    if (!draft.name.trim()) { toast.error('Podaj nazwę produktu'); return }
    setSaving(true)
    const supabase = createClient()
    let error
    if (isEdit) {
      ;({ error } = await supabase.from('allegro_products')
          .update({ ...draft, updated_at: new Date().toISOString() }).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('allegro_products').insert({ ...draft }))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(isEdit ? 'Zapisano zmiany' : 'Produkt dodany')
    onSaved()
  }

  async function handleDelete() {
    if (!editingId) return
    setDeleting(true)
    const { error } = await createClient().from('allegro_products').delete().eq('id', editingId)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Produkt usunięty')
    onSaved()
  }

  async function handleAiGenerate() {
    if (!draft.name.trim()) { toast.error('Podaj nazwę produktu'); return }
    setAiGenerating(true); setAiVariants([]); setAiWarnings([])
    try {
      const res = await fetch('/api/allegro/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: draft.name,
          baseDescription: aiSource,
          category: draft.category ?? '',
          params: [draft.ean ? `EAN: ${draft.ean}` : '', draft.sku ? `SKU: ${draft.sku}` : ''].filter(Boolean).join(', '),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error ?? 'Błąd generowania oferty'); return }
      patch({
        offer_title:       data.title ?? draft.offer_title,
        offer_description: data.description ?? draft.offer_description,
      })
      setAiVariants(data.title_variants ?? [])
      setAiWarnings(data.warnings ?? [])
      toast.success('Oferta wygenerowana')
    } catch {
      toast.error('Błąd sieci — spróbuj ponownie')
    } finally {
      setAiGenerating(false)
    }
  }

  const lbl = 'block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5'
  const inp = 'w-full px-3.5 py-2.5 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[680px] my-6 card-elevated rounded-[18px] shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <p className="text-[14px] font-bold text-fg">{isEdit ? 'Edytuj produkt' : 'Dodaj produkt'}</p>
          <button onClick={onClose} className="p-1.5 rounded-[7px] text-subtle hover:text-fg hover:bg-fg/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Podstawy */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Podstawy</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Nazwa produktu *</label>
                <input value={draft.name} onChange={e => patch({ name: e.target.value })}
                  placeholder="np. Słuchawki Sony WH-1000XM5" className={inp} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Kategoria Allegro</label>
                  <CategorySelect
                    value={draft.category ?? ''}
                    onChange={(cat, cpc) => patch({ category: cat, commission_pct: cpc })}
                    className={inp + ' cursor-pointer'}
                  />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select value={draft.status} onChange={e => patch({ status: e.target.value as ProductStatus })}
                    className={inp + ' cursor-pointer'}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            className="text-[12px] font-semibold text-muted hover:text-fg transition-colors flex items-center gap-1"
          >
            {showMore ? '− Mniej opcji' : '+ Więcej opcji (identyfikatory, sourcing, oferta, notatki)'}
          </button>

          {showMore && (
            <>

          {/* Identyfikatory */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Identyfikatory</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>SKU</label>
                <input value={draft.sku ?? ''} onChange={e => patch({ sku: e.target.value || null })}
                  placeholder="np. SON-WH1000XM5-BLK" className={inp} />
              </div>
              <div>
                <label className={lbl}>EAN</label>
                <input value={draft.ean ?? ''} onChange={e => patch({ ean: e.target.value || null })}
                  placeholder="4548736132528" className={inp} />
              </div>
            </div>
          </div>

          {/* Sourcing */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Sourcing</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Hurtownia / dostawca</label>
                  <input value={draft.supplier ?? ''} onChange={e => patch({ supplier: e.target.value || null })}
                    placeholder="np. Hurt24.pl" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Link do hurtowni</label>
                  <input value={draft.supplier_url ?? ''} onChange={e => patch({ supplier_url: e.target.value || null })}
                    placeholder="https://..." className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Cena zakupu (PLN)</label>
                  <input type="number" min="0" step="0.01"
                    value={draft.purchase_price ?? ''} onChange={e => patch({ purchase_price: num(e.target.value) })}
                    placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Dostawa od dostawcy (PLN)</label>
                  <input type="number" min="0" step="0.01"
                    value={draft.supplier_shipping ?? ''} onChange={e => patch({ supplier_shipping: num(e.target.value) })}
                    placeholder="0.00" className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Ceny od dostawcy</label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-[9px] border border-fg/[0.08] overflow-hidden">
                    {([[false,'Brutto (z VAT)'],[true,'Netto — dolicz VAT']] as [boolean,string][]).map(([val,label]) => (
                      <button key={String(val)} type="button" onClick={() => patch({ purchase_is_net: val })}
                        className={`px-3 py-2 text-[12px] font-medium transition-all ${draft.purchase_is_net === val ? '' : 'text-muted hover:text-fg'}`}
                        style={draft.purchase_is_net === val ? { background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' } : undefined}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {draft.purchase_is_net && (
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="0" step="0.1" value={draft.vat_pct ?? 23}
                        onChange={e => patch({ vat_pct: num(e.target.value) })}
                        className={inp + ' w-20'} />
                      <span className="text-[12px] text-subtle">% VAT</span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-subtle leading-relaxed">
                  Nie jesteś VATowcem — przy cenie netto od hurtowni doliczamy VAT do kosztu (płacisz brutto). Dotyczy ceny zakupu i dostawy od dostawcy.
                </p>
              </div>
            </div>
          </div>

          {/* Cennik */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Cennik i sprzedaż</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Cena sprzedaży (PLN)</label>
                  <input type="number" min="0" step="0.01"
                    value={draft.target_price ?? ''} onChange={e => patch({ target_price: num(e.target.value) })}
                    placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Prowizja Allegro (%)</label>
                  <input type="number" min="0" max="100" step="0.1"
                    value={draft.commission_pct ?? ''} onChange={e => patch({ commission_pct: num(e.target.value) })}
                    placeholder="auto z kategorii" className={inp} />
                  <p className="mt-1 text-[10px] text-subtle">auto z kategorii — możesz nadpisać</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Koszt wysyłki do kupującego (PLN)</label>
                  <input type="number" min="0" step="0.01"
                    value={draft.shipping_cost ?? ''} onChange={e => patch({ shipping_cost: num(e.target.value) })}
                    placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Sprzedane szt.</label>
                  <input type="number" min="0" step="1"
                    value={draft.units_sold ?? ''} onChange={e => patch({ units_sold: int(e.target.value) })}
                    placeholder="0" className={inp} />
                </div>
              </div>
            </div>

            {/* Live margin preview */}
            {hasPrice && (
              <div className="mt-4 p-4 rounded-[12px] bg-fg/[0.04] border border-border">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">Podgląd marży</p>
                <MarginBreakdown
                  data={marginData}
                  cpc={draft.commission_pct ?? 0}
                  withTax={false}
                />
                <p className="text-[10px] text-subtle mt-3 leading-relaxed">
                  Prowizje orientacyjne wg kategorii — Allegro zmienia je kilka razy w roku i stosuje progi cenowe.
                  Dokładność co do grosza: integracja z API Allegro (wkrótce).
                </p>
              </div>
            )}
          </div>

          {/* Oferta */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Oferta Allegro</p>
            <div className="space-y-3">

              {/* Wejścia dla AI */}
              <div>
                <label className={lbl}>Tytuł podstawowy / nazwa <span className="normal-case font-normal text-subtle">(baza dla AI)</span></label>
                <input value={draft.name} onChange={e => patch({ name: e.target.value })}
                  placeholder="np. Klocki LEGO Classic 11030 Sterta klocków" className={inp} />
              </div>
              <div>
                <label className={lbl}>Opis bazowy <span className="normal-case font-normal text-subtle">(materiał dla AI)</span></label>
                <textarea value={aiSource} rows={4} onChange={e => setAiSource(e.target.value)}
                  placeholder="Wklej opis producenta lub własne notatki o produkcie…"
                  className={inp + ' resize-none'} />
                <p className="mt-1 text-[10px] text-subtle leading-relaxed">
                  AI użyje też kategorii i EAN/SKU z pól powyżej.
                </p>
              </div>

              {/* Generuj */}
              <button type="button" onClick={handleAiGenerate} disabled={aiGenerating || !draft.name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}>
                {aiGenerating ? <><Loader2 size={14} className="animate-spin" /> Generuję…</> : <><ShoppingBag size={14} /> Generuj ofertę (AI)</>}
              </button>

              {/* Wynik: tytuł oferty */}
              <div>
                <label className={lbl}>Tytuł oferty <span className="normal-case font-normal text-subtle">(wynik)</span></label>
                <input value={draft.offer_title ?? ''} onChange={e => patch({ offer_title: e.target.value || null })}
                  placeholder="Tu pojawi się wygenerowany tytuł (max 75 znaków)" className={inp} />
                {draft.offer_title && (
                  <p className={`mt-1 text-[11px] ${draft.offer_title.length > 75 ? 'text-danger' : 'text-subtle'}`}>
                    {draft.offer_title.length} / 75
                  </p>
                )}
              </div>

              {aiVariants.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-subtle uppercase tracking-wide">Warianty tytułu — kliknij aby wybrać</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiVariants.map((v, i) => (
                      <button key={i} type="button" onClick={() => patch({ offer_title: v })}
                        className="px-2.5 py-1 rounded-[8px] text-[11px] border border-fg/[0.1] bg-raised text-fg hover:border-fg/30 transition-all text-left">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiWarnings.length > 0 && (
                <div className="space-y-0.5">
                  {aiWarnings.map((w, i) => <p key={i} className="text-[11px] text-amber">{w}</p>)}
                </div>
              )}

              {/* Wynik: opis oferty */}
              <div>
                <label className={lbl}>Opis oferty <span className="normal-case font-normal text-subtle">(wynik)</span></label>
                <textarea value={draft.offer_description ?? ''} rows={5}
                  onChange={e => patch({ offer_description: e.target.value || null })}
                  placeholder="Tu pojawi się wygenerowany opis…"
                  className={inp + ' resize-none'} />
              </div>

              {/* Link do aukcji */}
              <div>
                <label className={lbl}>Link do aukcji Allegro</label>
                <input value={draft.allegro_url ?? ''} onChange={e => patch({ allegro_url: e.target.value || null })}
                  placeholder="https://allegro.pl/oferta/..." className={inp} />
              </div>
            </div>
          </div>

          {/* Notatki */}
          <div>
            <p className="section-label mb-3" style={{ color: 'var(--group-allegro)' }}>Notatki</p>
            <textarea value={draft.notes ?? ''} rows={3}
              onChange={e => patch({ notes: e.target.value || null })}
              placeholder="Dodatkowe uwagi, linki, obserwacje…"
              className={inp + ' resize-none'} />
          </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            {isEdit && (confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-danger">Na pewno usunąć?</span>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-1.5 rounded-[8px] bg-danger/15 text-danger text-[12px] font-semibold hover:bg-danger/25 transition-all disabled:opacity-50">
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Usuń'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-[8px] bg-fg/[0.05] text-muted text-[12px] hover:text-fg transition-all">
                  Anuluj
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded-[8px] bg-fg/[0.04] text-subtle text-[12px] hover:text-danger hover:bg-danger/10 transition-all">
                Usuń produkt
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-[10px] bg-fg/[0.05] text-muted text-[13px] hover:text-fg transition-all">
              Anuluj
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-50"
              style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Zapisuję…' : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quick calculator ─────────────────────────────────────────────────────────

function QuickCalculator({ onAddAsProduct }: {
  onAddAsProduct: (prefill: Partial<ProductDraft>) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [category,  setCategory]  = useState<string>('')
  const [price,     setPrice]     = useState('')
  const [purchase,  setPurchase]  = useState('')
  const [suppShip,  setSuppShip]  = useState('')
  const [shipping,  setShipping]  = useState('')
  const [pitPct,    setPitPct]    = useState('12')
  const [healthPct, setHealthPct] = useState('9')
  const [isNet, setIsNet] = useState(false)
  const [vat,   setVat]   = useState('23')

  const cpc      = category ? (ALLEGRO_COMMISSION[category] ?? 0) : 0
  const tp       = parseFloat(price) || 0
  const hasResult = tp > 0

  const data = calcMargin({
    target_price:      tp,
    purchase_price:    parseFloat(purchase) || 0,
    supplier_shipping: parseFloat(suppShip) || 0,
    shipping_cost:     parseFloat(shipping) || 0,
    commission_pct:    cpc,
    purchase_is_net:   isNet,
    vat_pct:           parseFloat(vat) || 23,
    pitPct:            parseFloat(pitPct)    || 0,
    healthPct:         parseFloat(healthPct) || 0,
  })

  const inp = 'w-full px-3 py-2 rounded-[10px] bg-raised border border-fg/[0.08] text-fg placeholder:text-subtle text-[13px] focus:outline-none transition-all'
  const lbl = 'block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1'

  function handleAddAsProduct() {
    onAddAsProduct({
      category:          category || null,
      commission_pct:    cpc || null,
      target_price:      tp || null,
      purchase_price:    parseFloat(purchase) || null,
      supplier_shipping: parseFloat(suppShip) || null,
      shipping_cost:     parseFloat(shipping) || null,
      purchase_is_net:   isNet,
      vat_pct:           parseFloat(vat) || 23,
    })
  }

  return (
    <div className="card-elevated rounded-[14px] overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-fg/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <Calculator size={15} style={{ color: 'var(--group-allegro)' }} />
          <p className="text-[13px] font-bold text-fg">Szybki kalkulator marży</p>
        </div>
        <ChevronDown
          size={15}
          className={`text-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className={lbl}>Kategoria Allegro</label>
                <CategorySelect
                  value={category}
                  onChange={(cat, cpc2) => { setCategory(cat ?? ''); void cpc2 }}
                  className={inp + ' cursor-pointer'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Cena sprzedaży (PLN)</label>
                  <input type="number" min="0" step="0.01" value={price}
                    onChange={e => setPrice(e.target.value)} placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Cena zakupu (PLN)</label>
                  <input type="number" min="0" step="0.01" value={purchase}
                    onChange={e => setPurchase(e.target.value)} placeholder="0.00" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Dostawa od dostawcy</label>
                  <input type="number" min="0" step="0.01" value={suppShip}
                    onChange={e => setSuppShip(e.target.value)} placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Koszt wysyłki do klienta</label>
                  <input type="number" min="0" step="0.01" value={shipping}
                    onChange={e => setShipping(e.target.value)} placeholder="0.00" className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Ceny od dostawcy</label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-[9px] border border-fg/[0.08] overflow-hidden">
                    {([[false,'Brutto'],[true,'Netto — dolicz VAT']] as [boolean,string][]).map(([val,label]) => (
                      <button key={String(val)} type="button" onClick={() => setIsNet(val)}
                        className={`px-3 py-2 text-[12px] font-medium transition-all ${isNet === val ? '' : 'text-muted hover:text-fg'}`}
                        style={isNet === val ? { background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' } : undefined}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {isNet && (
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="0" step="0.1" value={vat}
                        onChange={e => setVat(e.target.value)} className={inp + ' w-20'} />
                      <span className="text-[12px] text-subtle">% VAT</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>PIT (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={pitPct}
                    onChange={e => setPitPct(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Składka zdrowotna (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={healthPct}
                    onChange={e => setHealthPct(e.target.value)} className={inp} />
                </div>
              </div>

              <button
                onClick={handleAddAsProduct}
                disabled={!hasResult}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold w-full justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}
              >
                <Plus size={14} /> Dodaj jako produkt
              </button>
            </div>

            {/* Result */}
            <div className="p-4 rounded-[12px] bg-fg/[0.04] border border-border">
              {!hasResult ? (
                <p className="text-[12px] text-subtle text-center mt-8">
                  Wpisz cenę sprzedaży aby zobaczyć rozpisę
                </p>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">Rozpiska kosztów</p>
                  <MarginBreakdown data={data} cpc={cpc} withTax />
                  <p className="text-[10px] text-subtle mt-3 leading-relaxed">
                    Prowizje orientacyjne wg kategorii — Allegro zmienia je kilka razy w roku
                    i stosuje progi cenowe. Dokładność co do grosza: integracja z API Allegro (wkrótce).
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Segment tabs ─────────────────────────────────────────────────────────────

type Segment = 'all' | 'niesprzedane' | 'aktywny' | 'wstrzymany' | 'wyprzedany' | 'wycofany'

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'all',          label: 'Wszystkie' },
  { id: 'niesprzedane', label: 'Niesprzedane' },
  { id: 'aktywny',      label: 'Aktywne' },
  { id: 'wstrzymany',   label: 'Wstrzymane' },
  { id: 'wyprzedany',   label: 'Wyprzedane' },
  { id: 'wycofany',     label: 'Wycofane' },
]

function filterBySegment(products: Product[], seg: Segment): Product[] {
  if (seg === 'all')          return products
  if (seg === 'niesprzedane') return products.filter(p => (p.units_sold ?? 0) === 0)
  return products.filter(p => p.status === seg)
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumb({ url, name }: { url: string | null; name: string }) {
  if (url) return (
    <img src={url} alt={name}
      className="w-10 h-10 rounded-[8px] object-cover flex-shrink-0 border border-border" />
  )
  return (
    <div className="w-10 h-10 rounded-[8px] flex-shrink-0 flex items-center justify-center bg-fg/[0.06] border border-border">
      <ShoppingBag size={16} className="text-subtle" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllegroProduktPage() {
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [segment, setSegment]     = useState<Segment>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<Product | null>(null)
  const [modalInit, setModalInit] = useState<ProductDraft>(defaultDraft)
  const [copied, setCopied]       = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await createClient()
      .from('allegro_products').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) { setError(error.message); return }
    setProducts((data ?? []) as Product[])
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openAdd() {
    setEditing(null)
    setModalInit(defaultDraft())
    setModalOpen(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setModalInit({ ...p })
    setModalOpen(true)
  }
  function openFromCalc(prefill: Partial<ProductDraft>) {
    setEditing(null)
    setModalInit({ ...defaultDraft(), ...prefill })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null) }
  function onSaved()    { closeModal(); fetchProducts() }

  async function copyTitle(title: string, id: string) {
    await navigator.clipboard.writeText(title)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
    toast.success('Skopiowano tytuł')
  }

  // KPIs
  const totalProducts = products.length
  const activeCount   = products.filter(p => p.status === 'aktywny').length
  const totalUnits    = products.reduce((s, p) => s + (p.units_sold ?? 0), 0)
  const totalRevenue  = products.reduce((s, p) => s + calcMargin(p).revenue, 0)
  const totalProfit   = products.reduce((s, p) => s + calcMargin(p).profit,  0)
  const withPrice     = products.filter(p => (p.target_price ?? 0) > 0)
  const avgMarginPct  = withPrice.length
    ? withPrice.reduce((s, p) => s + calcMargin(p).marginPct, 0) / withPrice.length
    : 0

  const bySegment = filterBySegment(products, segment)
  const filtered  = categoryFilter === 'all'
    ? bySegment
    : bySegment.filter(p => (p.category ?? '') === categoryFilter)
  const categoriesInUse = Array.from(
    new Set(products.map(p => p.category).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, 'pl'))
  const now      = Date.now()

  return (
    <div className="max-w-[1200px] space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--group-allegro)', boxShadow: '0 0 18px color-mix(in srgb, var(--group-allegro) 40%, transparent)' }}>
            <Package size={18} style={{ color: 'var(--nav-pill-text)' }} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-fg">Produkty</h1>
            <p className="text-[12px] text-muted">
              Twoje produkty dropshippingowe — sourcing, marża i sprzedaż w jednym miejscu.
            </p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--group-allegro)', color: 'var(--nav-pill-text)' }}>
          <Plus size={14} /> Dodaj produkt
        </button>
      </div>

      {/* KPI — pieniądze (główne) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Przychód',  value: totalProducts > 0 ? fmtPLN(totalRevenue) : '—', cls: 'text-fg' },
          { label: 'Zysk',      value: totalProducts > 0 ? fmtPLN(totalProfit)  : '—', cls: 'text-fg' },
          { label: 'Śr. marża', value: withPrice.length  ? avgMarginPct.toFixed(1) + '%' : '—',
            cls: withPrice.length ? marginColor(avgMarginPct) : 'text-fg' },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card p-4"
            style={{ '--card-accent': 'var(--group-allegro)' } as React.CSSProperties}>
            <p className="section-label mb-1">{kpi.label}</p>
            <p className={`num text-[22px] font-bold ${kpi.cls}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* KPI — liczniki (drugorzędne) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1">
        <span className="text-[12px] text-muted">Produkty <b className="text-fg font-semibold num">{totalProducts > 0 ? fmtNum(totalProducts) : '—'}</b></span>
        <span className="text-[12px] text-muted">Aktywne <b className="text-fg font-semibold num">{totalProducts > 0 ? fmtNum(activeCount) : '—'}</b></span>
        <span className="text-[12px] text-muted">Sprzedane <b className="text-fg font-semibold num">{totalProducts > 0 ? fmtNum(totalUnits) + ' szt.' : '—'}</b></span>
      </div>

      {/* Collapsible calculator */}
      <QuickCalculator onAddAsProduct={openFromCalc} />

      {/* Segment tabs */}
      <div className="flex flex-wrap gap-1.5">
        {SEGMENTS.map(seg => {
          const count  = seg.id === 'all' ? products.length : filterBySegment(products, seg.id).length
          const active = segment === seg.id
          return (
            <button key={seg.id} onClick={() => setSegment(seg.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
                active ? 'border' : 'bg-fg/[0.04] text-muted border border-transparent hover:text-fg'
              }`}
              style={active ? {
                background:  'color-mix(in srgb, var(--group-allegro) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--group-allegro) 35%, transparent)',
                color:       'var(--group-allegro)',
              } : undefined}>
              {seg.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-fg/[0.08]' : 'bg-fg/[0.06] text-subtle'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Category tabs */}
      {categoriesInUse.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide mr-1">Kategoria</span>
          {[{ id: 'all', label: 'Wszystkie' }, ...categoriesInUse.map(c => ({ id: c, label: c }))].map(cat => {
            const count = cat.id === 'all'
              ? bySegment.length
              : bySegment.filter(p => (p.category ?? '') === cat.id).length
            const active = categoryFilter === cat.id
            return (
              <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                  active ? 'border' : 'bg-fg/[0.04] text-muted border border-transparent hover:text-fg'
                }`}
                style={active ? {
                  background:  'color-mix(in srgb, var(--group-allegro) 12%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--group-allegro) 30%, transparent)',
                  color:       'var(--group-allegro)',
                } : undefined}>
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-fg/[0.08]' : 'bg-fg/[0.06] text-subtle'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : error ? (
        <div className="card-elevated rounded-[14px] p-6 flex items-center gap-3">
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated rounded-[14px] flex flex-col items-center justify-center h-52 text-center gap-3">
          <Package size={36} className="text-subtle" />
          <div>
            <p className="text-[14px] font-semibold text-fg">
              {segment === 'all'
                ? 'Brak produktów'
                : `Brak produktów w segmencie "${SEGMENTS.find(s => s.id === segment)?.label}"`}
            </p>
            {segment === 'all' && (
              <p className="text-[12px] text-muted mt-1">Kliknij „+ Dodaj produkt" aby zacząć.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const m     = calcMargin(p)
            const isOld = now - new Date(p.created_at).getTime() > 30 * 86400_000
            const stale = (p.units_sold ?? 0) === 0 && isOld
            return (
              <div key={p.id} className="list-row flex items-center gap-4 px-4 py-3">
                <Thumb url={p.thumbnail_url} name={p.name} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-fg truncate">{p.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    {stale && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber/10 text-amber border border-amber/25">
                        rozważ wycofanie
                      </span>
                    )}
                  </div>
                  {p.category && <p className="text-[11px] text-muted mt-0.5 truncate">{p.category}</p>}
                </div>

                <div className="text-right hidden sm:block w-[130px]">
                  <p className={`text-[15px] font-bold num ${(p.target_price ?? 0) > 0 ? marginColor(m.marginPct) : 'text-subtle'}`}>
                    {(p.target_price ?? 0) > 0 ? m.marginPct.toFixed(1) + '%' : '—'}
                    <span className="text-[10px] font-normal text-subtle ml-1">marża</span>
                  </p>
                  <p className="text-[11px] text-subtle num mt-0.5">
                    {p.target_price != null ? p.target_price.toFixed(2) + ' PLN' : '—'} · {fmtNum(p.units_sold ?? 0)} szt.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-fg/[0.04] border border-border text-muted hover:text-fg text-[11px] font-medium transition-all">
                    <Pencil size={11} /> Edytuj
                  </button>
                  <button onClick={() => p.offer_title && copyTitle(p.offer_title, p.id)}
                    disabled={!p.offer_title} title="Kopiuj tytuł oferty"
                    className="p-2 rounded-[8px] bg-fg/[0.04] border border-border text-muted hover:text-fg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {copied === p.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                  {p.allegro_url && (
                    <a href={p.allegro_url} target="_blank" rel="noopener noreferrer"
                      title="Otwórz aukcję Allegro"
                      className="p-2 rounded-[8px] bg-fg/[0.04] border border-border text-muted hover:text-fg transition-all">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProductModal
          initial={modalInit}
          editingId={editing?.id ?? null}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
