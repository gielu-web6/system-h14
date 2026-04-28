'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Save, Loader2, Plus, X, ChevronRight, CheckCircle2,
  Building2, Target, TrendingUp, Megaphone, Star, BarChart3, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  name: string; description: string; price_range: string; delivery_time: string; usp: string
}
interface Objection {
  objection: string; best_response: string; frequency: string
}
interface CaseStudy {
  client_industry: string; problem: string; solution: string; result: string; timeframe: string; can_mention: boolean
}
interface Competitor {
  name: string; weakness: string; how_we_win: string
}
interface SalesStep {
  step: number; name: string; description: string; avg_days: number
}

interface DNA {
  id?: string
  company_name: string
  company_tagline: string
  company_description: string
  founded_year: string
  team_size: string
  location: string
  services: Service[]
  core_usp: string
  secondary_usps: string[]
  price_range_min: string
  price_range_max: string
  avg_ticket: string
  deal_below_which_skip: string
  icp_description: string
  icp_company_size: string
  icp_revenue_min: string
  icp_industry: string[]
  icp_decision_maker: string
  icp_pain_points: string[]
  icp_goals: string[]
  icp_buying_triggers: string[]
  icp_red_flags: string[]
  sales_process: SalesStep[]
  avg_sales_cycle_days: string
  close_rate_percent: string
  avg_followups_to_close: string
  top_objections: Objection[]
  competitive_advantages: string[]
  main_competitors: Competitor[]
  content_archetype: string
  content_tone: string
  content_vocabulary: string[]
  content_avoid: string[]
  content_pillars: string[]
  posting_channels: string[]
  posting_frequency: string
  case_studies: CaseStudy[]
  testimonials: Array<{text: string; author: string; company: string; verified: boolean}>
  founder_voice: string
  brand_words: string[]
  brand_avoid_words: string[]
  monthly_revenue_target: string
  monthly_revenue_current: string
  quarterly_deals_target: string
  current_clients_count: string
  target_clients_count: string
}

const EMPTY_DNA: DNA = {
  company_name: '', company_tagline: '', company_description: '', founded_year: '', team_size: '', location: '',
  services: [], core_usp: '', secondary_usps: [], price_range_min: '', price_range_max: '',
  avg_ticket: '', deal_below_which_skip: '',
  icp_description: '', icp_company_size: '', icp_revenue_min: '', icp_industry: [],
  icp_decision_maker: '', icp_pain_points: [], icp_goals: [], icp_buying_triggers: [], icp_red_flags: [],
  sales_process: [], avg_sales_cycle_days: '', close_rate_percent: '', avg_followups_to_close: '',
  top_objections: [], competitive_advantages: [], main_competitors: [],
  content_archetype: '', content_tone: '', content_vocabulary: [], content_avoid: [],
  content_pillars: [], posting_channels: [], posting_frequency: '',
  case_studies: [], testimonials: [], founder_voice: '',
  brand_words: [], brand_avoid_words: [],
  monthly_revenue_target: '', monthly_revenue_current: '', quarterly_deals_target: '',
  current_clients_count: '', target_clients_count: '',
}

function dbToDNA(d: Record<string, unknown>): DNA {
  const str = (v: unknown) => (v != null ? String(v) : '')
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    id: str(d.id),
    company_name: str(d.company_name), company_tagline: str(d.company_tagline),
    company_description: str(d.company_description), founded_year: str(d.founded_year),
    team_size: str(d.team_size), location: str(d.location),
    services: arr(d.services) as Service[],
    core_usp: str(d.core_usp), secondary_usps: arr(d.secondary_usps) as string[],
    price_range_min: str(d.price_range_min), price_range_max: str(d.price_range_max),
    avg_ticket: str(d.avg_ticket), deal_below_which_skip: str(d.deal_below_which_skip),
    icp_description: str(d.icp_description), icp_company_size: str(d.icp_company_size),
    icp_revenue_min: str(d.icp_revenue_min), icp_industry: arr(d.icp_industry) as string[],
    icp_decision_maker: str(d.icp_decision_maker), icp_pain_points: arr(d.icp_pain_points) as string[],
    icp_goals: arr(d.icp_goals) as string[], icp_buying_triggers: arr(d.icp_buying_triggers) as string[],
    icp_red_flags: arr(d.icp_red_flags) as string[],
    sales_process: arr(d.sales_process) as SalesStep[],
    avg_sales_cycle_days: str(d.avg_sales_cycle_days), close_rate_percent: str(d.close_rate_percent),
    avg_followups_to_close: str(d.avg_followups_to_close),
    top_objections: arr(d.top_objections) as Objection[],
    competitive_advantages: arr(d.competitive_advantages) as string[],
    main_competitors: arr(d.main_competitors) as Competitor[],
    content_archetype: str(d.content_archetype), content_tone: str(d.content_tone),
    content_vocabulary: arr(d.content_vocabulary) as string[],
    content_avoid: arr(d.content_avoid) as string[],
    content_pillars: arr(d.content_pillars) as string[],
    posting_channels: arr(d.posting_channels) as string[],
    posting_frequency: str(d.posting_frequency),
    case_studies: arr(d.case_studies) as CaseStudy[],
    testimonials: arr(d.testimonials) as Array<{text: string; author: string; company: string; verified: boolean}>,
    founder_voice: str(d.founder_voice),
    brand_words: arr(d.brand_words) as string[], brand_avoid_words: arr(d.brand_avoid_words) as string[],
    monthly_revenue_target: str(d.monthly_revenue_target), monthly_revenue_current: str(d.monthly_revenue_current),
    quarterly_deals_target: str(d.quarterly_deals_target), current_clients_count: str(d.current_clients_count),
    target_clients_count: str(d.target_clients_count),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#6366f1]/50 transition-colors"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none"
    />
  )
}

function TagList({ items, onChange, placeholder }: {
  items: string[]; onChange: (items: string[]) => void; placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Wpisz i naciśnij Enter…'}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#6366f1]/50 transition-colors"
        />
        <button onClick={add} className="p-2 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white transition-colors">
          <Plus size={14} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/25 text-[11px] text-[#a5b4fc]">
              {item}
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'basics',   label: 'Podstawy',   icon: Building2  },
  { id: 'services', label: 'Usługi',     icon: Star       },
  { id: 'icp',      label: 'Klient ICP', icon: Target     },
  { id: 'sales',    label: 'Sprzedaż',   icon: TrendingUp },
  { id: 'content',  label: 'Content',    icon: Megaphone  },
  { id: 'proof',    label: 'Dowody',     icon: Star       },
  { id: 'metrics',  label: 'Metryki',    icon: BarChart3  },
  { id: 'preview',  label: 'Przegląd',   icon: Eye        },
] as const

type TabId = typeof TABS[number]['id']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DNAEditorPage() {
  const [dna, setDna]       = useState<DNA>(EMPTY_DNA)
  const [tab, setTab]       = useState<TabId>('basics')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/company-brain/dna')
      const { dna: d } = await res.json()
      if (d) setDna(dbToDNA(d as Record<string, unknown>))
    } catch {
      toast.error('Błąd ładowania DNA')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const set = <K extends keyof DNA>(key: K) => (val: DNA[K]) =>
    setDna(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...dna,
        founded_year: dna.founded_year ? parseInt(dna.founded_year) : null,
        price_range_min: dna.price_range_min ? parseInt(dna.price_range_min) : null,
        price_range_max: dna.price_range_max ? parseInt(dna.price_range_max) : null,
        avg_ticket: dna.avg_ticket ? parseInt(dna.avg_ticket) : null,
        deal_below_which_skip: dna.deal_below_which_skip ? parseInt(dna.deal_below_which_skip) : null,
        icp_revenue_min: dna.icp_revenue_min ? parseInt(dna.icp_revenue_min) : null,
        avg_sales_cycle_days: dna.avg_sales_cycle_days ? parseInt(dna.avg_sales_cycle_days) : null,
        close_rate_percent: dna.close_rate_percent ? parseInt(dna.close_rate_percent) : null,
        avg_followups_to_close: dna.avg_followups_to_close ? parseInt(dna.avg_followups_to_close) : null,
        monthly_revenue_target: dna.monthly_revenue_target ? parseInt(dna.monthly_revenue_target) : null,
        monthly_revenue_current: dna.monthly_revenue_current ? parseInt(dna.monthly_revenue_current) : null,
        quarterly_deals_target: dna.quarterly_deals_target ? parseInt(dna.quarterly_deals_target) : null,
        current_clients_count: dna.current_clients_count ? parseInt(dna.current_clients_count) : null,
        target_clients_count: dna.target_clients_count ? parseInt(dna.target_clients_count) : null,
      }
      const res = await fetch('/api/company-brain/dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      const { dna: saved } = await res.json()
      if (saved) setDna(dbToDNA(saved as Record<string, unknown>))
      toast.success('DNA zaktualizowane — kontekst AI odświeżony ✓')
    } catch {
      toast.error('Błąd zapisu DNA')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center gap-3 p-4">
      <Loader2 size={16} className="animate-spin text-white/40" />
      <span className="text-[13px] text-white/40">Ładowanie DNA…</span>
    </div>
  )

  return (
    <div className="max-w-[900px] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Brain size={20} className="text-[#6366f1]" /> Company DNA Editor
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">Profil firmy wstrzykiwany do każdego AI call w systemie</p>
        </div>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-[13px] font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Zapisuję…' : 'Zapisz DNA'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-white/[0.03] border border-white/[0.07] rounded-[12px] p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
              tab === t.id
                ? 'bg-[#6366f1] text-white shadow'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-6">

        {/* ── BASICS ── */}
        {tab === 'basics' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Podstawy firmy</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nazwa firmy"><Input value={dna.company_name} onChange={set('company_name')} placeholder="AM Automations" /></Field>
              <Field label="Tagline"><Input value={dna.company_tagline} onChange={set('company_tagline')} placeholder="Automatyzujemy sprzedaż B2B" /></Field>
            </div>
            <Field label="Opis firmy (2-3 zdania)">
              <Textarea value={dna.company_description} onChange={set('company_description')}
                placeholder="Tworzymy systemy automatyzacji sprzedaży dla agencji B2B..." rows={3} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Rok założenia"><Input value={dna.founded_year} onChange={set('founded_year')} type="number" placeholder="2022" /></Field>
              <Field label="Rozmiar zespołu"><Input value={dna.team_size} onChange={set('team_size')} placeholder="2-5 osób" /></Field>
              <Field label="Lokalizacja"><Input value={dna.location} onChange={set('location')} placeholder="Warszawa / Zdalnie" /></Field>
            </div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === 'services' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Usługi i oferta</p>
              <button
                onClick={() => set('services')([...dna.services, { name: '', description: '', price_range: '', delivery_time: '', usp: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] hover:text-white transition-all"
              >
                <Plus size={12} /> Dodaj usługę
              </button>
            </div>

            <Field label="Główny USP (1 zdanie)">
              <Textarea value={dna.core_usp} onChange={set('core_usp')} placeholder="Budujemy prototyp systemu CRM w 3 dni z gwarancją zwrotu pieniędzy." rows={2} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. wartość deala (PLN)"><Input value={dna.price_range_min} onChange={set('price_range_min')} type="number" placeholder="8000" /></Field>
              <Field label="Poniżej tej kwoty nie rozmawiamy (PLN)"><Input value={dna.deal_below_which_skip} onChange={set('deal_below_which_skip')} type="number" placeholder="5000" /></Field>
            </div>

            <Field label="Dodatkowe USP"><TagList items={dna.secondary_usps} onChange={set('secondary_usps')} placeholder="np. płatność po odbiorze" /></Field>

            {dna.services.map((s, i) => (
              <div key={i} className="p-4 rounded-[10px] bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-white">Usługa {i + 1}</p>
                  <button onClick={() => set('services')(dna.services.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nazwa"><Input value={s.name} onChange={v => set('services')(dna.services.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="System CRM" /></Field>
                  <Field label="Przedział cenowy"><Input value={s.price_range} onChange={v => set('services')(dna.services.map((x, j) => j === i ? { ...x, price_range: v } : x))} placeholder="15-25k PLN" /></Field>
                </div>
                <Field label="Opis">
                  <Textarea value={s.description} onChange={v => set('services')(dna.services.map((x, j) => j === i ? { ...x, description: v } : x))} placeholder="Co dokładnie wchodzi w zakres..." rows={2} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Czas wdrożenia"><Input value={s.delivery_time} onChange={v => set('services')(dna.services.map((x, j) => j === i ? { ...x, delivery_time: v } : x))} placeholder="14 dni" /></Field>
                  <Field label="USP tej usługi"><Input value={s.usp} onChange={v => set('services')(dna.services.map((x, j) => j === i ? { ...x, usp: v } : x))} placeholder="Prototyp w 3 dni" /></Field>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ICP ── */}
        {tab === 'icp' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Idealny klient (ICP)</p>
            <Field label="Opis ICP (pełny)">
              <Textarea value={dna.icp_description} onChange={set('icp_description')}
                placeholder="CEO lub Founder agencji marketingowej B2B, 10-50 pracowników, 2M+ PLN przychodu..." rows={4} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Wielkość firmy klienta"><Input value={dna.icp_company_size} onChange={set('icp_company_size')} placeholder="10-50 pracowników" /></Field>
              <Field label="Min. przychód klienta (PLN/rok)"><Input value={dna.icp_revenue_min} onChange={set('icp_revenue_min')} type="number" placeholder="2000000" /></Field>
            </div>
            <Field label="Decydent"><Input value={dna.icp_decision_maker} onChange={set('icp_decision_maker')} placeholder="CEO / Founder / Owner" /></Field>
            <Field label="Branże ICP"><TagList items={dna.icp_industry} onChange={set('icp_industry')} placeholder="np. agencje marketingowe" /></Field>
            <Field label="Główne bóle klienta"><TagList items={dna.icp_pain_points} onChange={set('icp_pain_points')} placeholder="np. brak systemu do zarządzania leadami" /></Field>
            <Field label="Główne cele klienta"><TagList items={dna.icp_goals} onChange={set('icp_goals')} placeholder="np. skalowanie sprzedaży bez powiększania zespołu" /></Field>
            <Field label="Sygnały zakupowe (triggery)"><TagList items={dna.icp_buying_triggers} onChange={set('icp_buying_triggers')} placeholder="np. nowy wspólnik w firmie" /></Field>
            <div className="p-3 rounded-[10px] bg-red-500/[0.07] border border-red-500/20">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-2">Red flags — kogo NIE chcemy</p>
              <TagList items={dna.icp_red_flags} onChange={set('icp_red_flags')} placeholder="np. firmy poniżej 1M PLN przychodu" />
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Sprzedaż i lejek</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Avg. cykl sprzedaży (dni)"><Input value={dna.avg_sales_cycle_days} onChange={set('avg_sales_cycle_days')} type="number" placeholder="21" /></Field>
              <Field label="Wskaźnik zamknięć (%)"><Input value={dna.close_rate_percent} onChange={set('close_rate_percent')} type="number" placeholder="25" /></Field>
              <Field label="Avg. follow-upów do zamknięcia"><Input value={dna.avg_followups_to_close} onChange={set('avg_followups_to_close')} type="number" placeholder="5" /></Field>
            </div>

            <Field label="Przewagi konkurencyjne"><TagList items={dna.competitive_advantages} onChange={set('competitive_advantages')} placeholder="np. prototyp w 3 dni" /></Field>

            {/* Objections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">Bank objekcji</p>
                <button
                  onClick={() => set('top_objections')([...dna.top_objections, { objection: '', best_response: '', frequency: 'medium' }])}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-white/50 text-[11px] hover:text-white transition-all"
                >
                  <Plus size={11} /> Dodaj objekcję
                </button>
              </div>
              {dna.top_objections.map((obj, i) => (
                <div key={i} className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/40">Objekcja {i + 1}</p>
                    <button onClick={() => set('top_objections')(dna.top_objections.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                  <Input value={obj.objection} onChange={v => set('top_objections')(dna.top_objections.map((x, j) => j === i ? { ...x, objection: v } : x))} placeholder='np. "Za drogo"' />
                  <Textarea value={obj.best_response} onChange={v => set('top_objections')(dna.top_objections.map((x, j) => j === i ? { ...x, best_response: v } : x))} placeholder="Najlepsza odpowiedź na tę objekcję..." rows={2} />
                </div>
              ))}
            </div>

            {/* Competitors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">Konkurenci</p>
                <button
                  onClick={() => set('main_competitors')([...dna.main_competitors, { name: '', weakness: '', how_we_win: '' }])}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-white/50 text-[11px] hover:text-white transition-all"
                >
                  <Plus size={11} /> Dodaj konkurenta
                </button>
              </div>
              {dna.main_competitors.map((c, i) => (
                <div key={i} className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/40">Konkurent {i + 1}</p>
                    <button onClick={() => set('main_competitors')(dna.main_competitors.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                  <Input value={c.name} onChange={v => set('main_competitors')(dna.main_competitors.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Nazwa konkurenta" />
                  <div className="grid grid-cols-2 gap-2">
                    <Textarea value={c.weakness} onChange={v => set('main_competitors')(dna.main_competitors.map((x, j) => j === i ? { ...x, weakness: v } : x))} placeholder="Ich słabość..." rows={2} />
                    <Textarea value={c.how_we_win} onChange={v => set('main_competitors')(dna.main_competitors.map((x, j) => j === i ? { ...x, how_we_win: v } : x))} placeholder="Jak wygrywamy..." rows={2} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {tab === 'content' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Strategia contentu</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Archetyp komunikacji">
                <select
                  value={dna.content_archetype}
                  onChange={e => set('content_archetype')(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#6366f1]/50"
                >
                  <option value="" className="bg-[#1A1A2E]">Wybierz archetyp…</option>
                  {['Ekspert', 'Budowniczy', 'Prowokator', 'Opiekun', 'Innowator', 'Lider', 'Edukator'].map(a => (
                    <option key={a} value={a} className="bg-[#1A1A2E]">{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Częstotliwość postowania"><Input value={dna.posting_frequency} onChange={set('posting_frequency')} placeholder="3x tydzień LinkedIn" /></Field>
            </div>
            <Field label="Ton komunikacji">
              <Textarea value={dna.content_tone} onChange={set('content_tone')} placeholder="Merytoryczny, bezpośredni, bez bullshitu. Konkretne liczby i fakty..." rows={2} />
            </Field>
            <Field label="Głos foundera (jak brzmi Adrian w contencie)">
              <Textarea value={dna.founder_voice} onChange={set('founder_voice')} placeholder="Pisze z perspektywy praktyka, który sam to przerobił..." rows={3} />
            </Field>
            <Field label="Filary contentu"><TagList items={dna.content_pillars} onChange={set('content_pillars')} placeholder="np. automatyzacja sprzedaży" /></Field>
            <Field label="Kanały"><TagList items={dna.posting_channels} onChange={set('posting_channels')} placeholder="np. LinkedIn personal" /></Field>
            <Field label="Słownictwo które używamy"><TagList items={dna.content_vocabulary} onChange={set('content_vocabulary')} placeholder="np. system, automatyzacja, skalowalność" /></Field>
            <Field label="Słowa których unikamy"><TagList items={dna.content_avoid} onChange={set('content_avoid')} placeholder="np. synergiczne rozwiązania" /></Field>
          </div>
        )}

        {/* ── PROOF ── */}
        {tab === 'proof' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Dowody i case studies</p>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-white/40">Case studies zasilają generator treści, ofert i outreach AI</p>
              <button
                onClick={() => set('case_studies')([...dna.case_studies, { client_industry: '', problem: '', solution: '', result: '', timeframe: '', can_mention: true }])}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-white/50 text-[11px] hover:text-white transition-all"
              >
                <Plus size={11} /> Dodaj case study
              </button>
            </div>
            {dna.case_studies.map((cs, i) => (
              <div key={i} className="p-4 rounded-[10px] bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-white">Case study {i + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40 cursor-pointer">
                      <input type="checkbox" checked={cs.can_mention}
                        onChange={e => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, can_mention: e.target.checked } : x))}
                        className="w-3 h-3 rounded"
                      />
                      Można wspominać
                    </label>
                    <button onClick={() => set('case_studies')(dna.case_studies.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors"><X size={13} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Branża klienta"><Input value={cs.client_industry} onChange={v => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, client_industry: v } : x))} placeholder="beauty / e-commerce" /></Field>
                  <Field label="Timeframe"><Input value={cs.timeframe} onChange={v => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, timeframe: v } : x))} placeholder="2 miesiące" /></Field>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Field label="Problem"><Textarea value={cs.problem} onChange={v => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, problem: v } : x))} placeholder="Brak systemu do..." rows={2} /></Field>
                  <Field label="Rozwiązanie"><Textarea value={cs.solution} onChange={v => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, solution: v } : x))} placeholder="Wdrożyliśmy..." rows={2} /></Field>
                  <Field label="Wynik (z liczbami!)"><Input value={cs.result} onChange={v => set('case_studies')(dna.case_studies.map((x, j) => j === i ? { ...x, result: v } : x))} placeholder="Wzrost konwersji o 340% w 2 miesiące" /></Field>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── METRICS ── */}
        {tab === 'metrics' && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Metryki i cele</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cel miesięczny (PLN)"><Input value={dna.monthly_revenue_target} onChange={set('monthly_revenue_target')} type="number" placeholder="50000" /></Field>
              <Field label="Bieżący przychód (PLN)"><Input value={dna.monthly_revenue_current} onChange={set('monthly_revenue_current')} type="number" placeholder="30000" /></Field>
              <Field label="Cel dealów w kwartale"><Input value={dna.quarterly_deals_target} onChange={set('quarterly_deals_target')} type="number" placeholder="5" /></Field>
              <Field label="Liczba aktualnych klientów"><Input value={dna.current_clients_count} onChange={set('current_clients_count')} type="number" placeholder="8" /></Field>
              <Field label="Docelowa liczba klientów"><Input value={dna.target_clients_count} onChange={set('target_clients_count')} type="number" placeholder="20" /></Field>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {tab === 'preview' && (
          <div className="space-y-4">
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide">Przegląd kompletności</p>
            {[
              { label: 'Nazwa i opis firmy',    done: !!(dna.company_name && dna.company_description) },
              { label: 'Przynajmniej 1 usługa', done: dna.services.length > 0 },
              { label: 'Główny USP',            done: !!dna.core_usp },
              { label: 'Opis ICP',              done: !!dna.icp_description },
              { label: 'Bóle klienta (min 3)',  done: dna.icp_pain_points.length >= 3 },
              { label: 'Red flags',             done: dna.icp_red_flags.length > 0 },
              { label: 'Objekcje (min 2)',       done: dna.top_objections.length >= 2 },
              { label: 'Case studies (min 1)',  done: dna.case_studies.length >= 1 },
              { label: 'Archetyp contentu',     done: !!dna.content_archetype },
              { label: 'Filary contentu',       done: dna.content_pillars.length > 0 },
              { label: 'Proces sprzedaży',      done: dna.sales_process.length > 0 },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
                {done
                  ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                  : <ChevronRight size={14} className="text-white/25 flex-shrink-0" />
                }
                <span className={`text-[12px] ${done ? 'text-white/70' : 'text-white/35'}`}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-[13px] font-bold transition-all"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Zapisuję…' : 'Zapisz DNA'}
        </button>
      </div>
    </div>
  )
}
