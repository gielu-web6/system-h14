'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Building2, Globe, ExternalLink,
  Target, Lightbulb, Package, MessageSquare, Save,
  CheckCircle2, Loader2, ChevronDown, ChevronUp, Plus, Trash2,
  Link as LinkIcon, AtSign, Pencil, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useServices, UNIT_LABELS } from '@/hooks/useServices'
import type { Service as SvcType } from '@/hooks/useServices'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  name: string
  description: string
  price_min: string
  price_max: string
}

interface CompanyProfile {
  company_name: string
  tagline: string
  description: string
  problems_solved: string
  usp: string
  target_client: string
  icp_industry: string
  icp_company_size: string
  icp_role: string
  services: Service[]
  website_url: string
  linkedin_company_url: string
  linkedin_personal_url: string
  instagram_url: string
  facebook_url: string
  other_links: string
  tone_of_voice: string
  case_studies: string
  objections: string
}

const EMPTY_PROFILE: CompanyProfile = {
  company_name: '',
  tagline: '',
  description: '',
  problems_solved: '',
  usp: '',
  target_client: '',
  icp_industry: '',
  icp_company_size: '',
  icp_role: '',
  services: [{ name: '', description: '', price_min: '', price_max: '' }],
  website_url: '',
  linkedin_company_url: '',
  linkedin_personal_url: '',
  instagram_url: '',
  facebook_url: '',
  other_links: '',
  tone_of_voice: '',
  case_studies: '',
  objections: '',
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#6366f1]/15 flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-[#6366f1]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">{title}</p>
            {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp size={15} className="text-white/30" /> : <ChevronDown size={15} className="text-white/30" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[12px] font-medium text-white/60">
        {label}
        {required && <span className="text-[#6366f1]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/30 leading-relaxed">{hint}</p>}
    </div>
  )
}

const inputCls = `
  w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
  text-white placeholder:text-white/25 text-[13px]
  focus:outline-none focus:border-[#6366f1]/60 focus:bg-[#6366f1]/[0.03]
  transition-all resize-none
`

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Service editor modal ─────────────────────────────────────────────────────

const EMPTY_SVC: Omit<SvcType, 'id' | 'created_at'> = {
  name: '', description: '', price_min: 0, price_max: 0,
  unit: 'projekt', deliverables: '', duration: '', is_active: true, sort_order: 0,
}

function ServiceModal({
  initial, onSave, onClose,
}: {
  initial?: SvcType | null
  onSave: (data: Omit<SvcType, 'id' | 'created_at'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Omit<SvcType, 'id' | 'created_at'>>(
    initial ? { ...initial } : { ...EMPTY_SVC }
  )
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }))
  const iCls = `w-full px-3 py-2.5 rounded-[10px] bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#6366f1]/60 transition-all resize-none`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#16213E] border border-white/[0.1] rounded-[16px] w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-white">{initial ? 'Edytuj usługę' : 'Nowa usługa'}</p>
          <button onClick={onClose} className="p-1.5 rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Nazwa usługi *</label>
            <input className={iCls} placeholder="np. Strona www + CMS" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Rozliczenie</label>
              <select className={iCls} value={form.unit} onChange={e => set('unit', e.target.value)}>
                {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Cena min (PLN)</label>
              <input className={iCls} type="number" placeholder="3000" value={form.price_min || ''} onChange={e => set('price_min', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Cena max (PLN)</label>
              <input className={iCls} type="number" placeholder="8000" value={form.price_max || ''} onChange={e => set('price_max', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Opis (co zawiera, dla kogo)</label>
            <textarea className={iCls} rows={3} placeholder="Responsywna strona www na Next.js z CMS. Projekt UI, treści, SEO on-page..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Czas realizacji</label>
              <input className={iCls} placeholder="np. 4-6 tygodni" value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Kolejność</label>
              <input className={iCls} type="number" placeholder="0" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Co dostajesz (deliverables)</label>
            <textarea className={iCls} rows={2} placeholder="Projekt Figma, kod źródłowy, hosting 1 rok, szkolenie 2h..." value={form.deliverables} onChange={e => set('deliverables', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">Anuluj</button>
          <button
            onClick={() => { if (form.name.trim()) { onSave(form); onClose() } }}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all disabled:opacity-50"
          >
            {initial ? 'Zapisz zmiany' : 'Dodaj usługę'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const { services, create: createSvc, update: updateSvc, remove: removeSvc } = useServices()
  const [svcModal, setSvcModal] = useState<{ open: boolean; editing: SvcType | null }>({ open: false, editing: null })

  const supabase = createClient()

  // Load existing profile on mount
  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('company_profile')
          .select('*')
          .limit(1)
          .single()

        if (data) {
          setProfile({
            ...EMPTY_PROFILE,
            ...data,
            services: Array.isArray(data.services) && data.services.length > 0
              ? data.services
              : EMPTY_PROFILE.services,
          })
        }
      } catch {
        // No profile yet — start fresh
      } finally {
        setLoadingInit(false)
      }
    }
    load()
  }, [])

  const set = useCallback(<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setProfile(p => ({ ...p, [key]: value }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    if (!profile.company_name.trim()) {
      toast.error('Wpisz nazwę firmy.')
      return
    }
    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('company_profile')
        .select('id')
        .limit(1)
        .single()

      const payload = { ...profile }

      if (existing?.id) {
        await supabase.from('company_profile').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('company_profile').insert(payload)
      }

      setSaved(true)
      toast.success('Baza wiedzy zapisana! AI scoring, outreach i generator treści już używają nowych danych.')
    } catch (err) {
      toast.error('Błąd zapisu. Spróbuj ponownie.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── Services helpers ───────────────────────────────────────────────────────

  const addService = () => {
    set('services', [...profile.services, { name: '', description: '', price_min: '', price_max: '' }])
  }

  const removeService = (i: number) => {
    set('services', profile.services.filter((_, idx) => idx !== i))
  }

  const updateService = (i: number, key: keyof Service, value: string) => {
    const updated = profile.services.map((s, idx) => idx === i ? { ...s, [key]: value } : s)
    set('services', updated)
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="text-[#6366f1] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[860px] space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-[#6366f1]" />
            Baza Wiedzy o Firmie
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            AI używa tych danych do scoringu leadów, generowania wiadomości outreach i treści.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Zapisuję...</>
          ) : saved ? (
            <><CheckCircle2 size={14} className="text-green-300" /> Zapisano</>
          ) : (
            <><Save size={14} /> Zapisz bazę wiedzy</>
          )}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#6366f1]/[0.07] border border-[#6366f1]/20">
        <Lightbulb size={15} className="text-[#a5b4fc] flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-white/55 leading-relaxed">
          Im więcej informacji wypełnisz, tym lepiej AI dopasuje scoring leadów, generuje wiadomości outreach
          i tworzy treści marketingowe. Zacznij od <strong className="text-white/70">nazwy firmy i opisu</strong> —
          resztę możesz uzupełniać stopniowo. <strong className="text-[#a5b4fc]">Po każdym zapisie</strong> wszystkie narzędzia AI (scoring, DM, generator treści) automatycznie korzystają z aktualnych danych.
        </p>
      </div>

      {/* ─── SEKCJA 1: Podstawy ─────────────────────────────────────────────── */}
      <Section icon={Building2} title="Podstawowe informacje" subtitle="Nazwa, opis i pozycjonowanie firmy" defaultOpen>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nazwa firmy" required>
              <input
                className={inputCls}
                placeholder="np. AM Automations"
                value={profile.company_name}
                onChange={e => set('company_name', e.target.value)}
              />
            </Field>
            <Field label="Tagline / slogan" hint="Jedno zdanie czym jesteś">
              <input
                className={inputCls}
                placeholder="np. Automatyzujemy agencje marketingowe"
                value={profile.tagline}
                onChange={e => set('tagline', e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Opis firmy"
            hint="Co robisz, dla kogo i dlaczego? (3–5 zdań — to baza do promptów AI)"
          >
            <textarea
              className={inputCls}
              rows={4}
              placeholder="Jesteśmy agencją specjalizującą się w budowie systemów automatyzacji i stron www dla firm usługowych. Pomagamy właścicielom małych i średnich firm zaoszczędzić czas na ręcznych procesach i pozyskać więcej klientów online..."
              value={profile.description}
              onChange={e => set('description', e.target.value)}
            />
          </Field>

          <Field
            label="Jakie problemy rozwiązujesz?"
            hint="Wymień konkretne bóle klientów które adresujesz (każdy w nowej linii)"
          >
            <textarea
              className={inputCls}
              rows={3}
              placeholder="- Brak czasu na ręczne procesy (ofertowanie, follow-upy, raporty)&#10;- Strona www która nie generuje leadów&#10;- Brak systemu do zarządzania klientami"
              value={profile.problems_solved}
              onChange={e => set('problems_solved', e.target.value)}
            />
          </Field>

          <Field
            label="Unikalna Propozycja Wartości (USP)"
            hint="Co wyróżnia Cię od konkurencji? Dlaczego klienci wybierają właśnie Ciebie?"
          >
            <textarea
              className={inputCls}
              rows={2}
              placeholder="np. Pokazujemy prototyp ZANIM klient zapłaci. Czas dostarczenia pierwszego MVP: 72h."
              value={profile.usp}
              onChange={e => set('usp', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* ─── SEKCJA 2: ICP ──────────────────────────────────────────────────── */}
      <Section icon={Target} title="Idealny Profil Klienta (ICP)" subtitle="Kto jest Twoim wymarzonym klientem?">
        <div className="space-y-4">
          <Field
            label="Opis idealnego klienta"
            hint="Kim jest? Czego szuka? Jak wygląda jego dzień?"
          >
            <textarea
              className={inputCls}
              rows={3}
              placeholder="np. Właściciel agencji marketingowej 2–10 osób, który sam prowadzi sprzedaż i czuje że traci leady przez brak systemu. Aktywny na LinkedIn, szuka narzędzi do automatyzacji."
              value={profile.target_client}
              onChange={e => set('target_client', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Branża ICP" hint="np. Marketing, IT, Budownictwo">
              <input
                className={inputCls}
                placeholder="Agencje marketingowe, IT"
                value={profile.icp_industry}
                onChange={e => set('icp_industry', e.target.value)}
              />
            </Field>
            <Field label="Wielkość firmy ICP" hint="np. 1–10 osób, MŚP">
              <input
                className={inputCls}
                placeholder="2–20 pracowników"
                value={profile.icp_company_size}
                onChange={e => set('icp_company_size', e.target.value)}
              />
            </Field>
            <Field label="Stanowisko decydenta" hint="np. CEO, Właściciel, CMO">
              <input
                className={inputCls}
                placeholder="CEO / Właściciel / Founder"
                value={profile.icp_role}
                onChange={e => set('icp_role', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ─── SEKCJA 3: Usługi (services table) ─────────────────────────────── */}
      <Section icon={Package} title="Katalog usług" subtitle="Twoje usługi — używane w generatorze ofert, leadach i pipeline">
        <div className="space-y-3">
          {services.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 rounded-[10px] border border-dashed border-white/10 bg-white/[0.02]">
              <Package size={24} className="text-white/20 mb-2" />
              <p className="text-[12px] text-white/30">Brak usług — dodaj pierwszą poniżej</p>
            </div>
          )}
          {services.map(svc => (
            <div key={svc.id} className="flex items-start gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-semibold text-white truncate">{svc.name}</p>
                  <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] text-[10px] font-semibold whitespace-nowrap">
                    {svc.price_min > 0 && svc.price_max > 0
                      ? `${svc.price_min.toLocaleString('pl-PL')} – ${svc.price_max.toLocaleString('pl-PL')} PLN`
                      : svc.price_min > 0 ? `od ${svc.price_min.toLocaleString('pl-PL')} PLN`
                      : 'cena do ustalenia'
                    } {UNIT_LABELS[svc.unit] ?? svc.unit}
                  </span>
                  {svc.duration && <span className="text-[10px] text-white/30">{svc.duration}</span>}
                </div>
                {svc.description && <p className="text-[12px] text-white/50 line-clamp-2">{svc.description}</p>}
                {svc.deliverables && <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">✓ {svc.deliverables}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setSvcModal({ open: true, editing: svc })}
                  className="p-1.5 rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
                ><Pencil size={13} /></button>
                <button
                  onClick={() => removeSvc(svc.id)}
                  className="p-1.5 rounded-[6px] text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                ><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSvcModal({ open: true, editing: null })}
            className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-dashed border-[#6366f1]/30 text-[#a5b4fc] hover:bg-[#6366f1]/10 hover:border-[#6366f1]/50 text-[12px] font-medium transition-all w-full justify-center"
          >
            <Plus size={14} /> Dodaj usługę
          </button>
        </div>
      </Section>

      {svcModal.open && (
        <ServiceModal
          initial={svcModal.editing}
          onClose={() => setSvcModal({ open: false, editing: null })}
          onSave={data => {
            if (svcModal.editing) {
              updateSvc(svcModal.editing.id, data)
            } else {
              createSvc(data)
            }
          }}
        />
      )}

      {/* ─── SEKCJA 4: Linki ────────────────────────────────────────────────── */}
      <Section icon={LinkIcon} title="Linki do profili i strony" subtitle="AI może analizować Twój profil LinkedIn i stronę">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Strona internetowa" hint="np. https://amautomations.pl">
              <div className="relative">
                <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls + ' pl-9'}
                  placeholder="https://twojafirma.pl"
                  value={profile.website_url}
                  onChange={e => set('website_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="LinkedIn – profil firmy">
              <div className="relative">
                <AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls + ' pl-9'}
                  placeholder="https://linkedin.com/company/twoja-firma"
                  value={profile.linkedin_company_url}
                  onChange={e => set('linkedin_company_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="LinkedIn – profil osobisty">
              <div className="relative">
                <AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls + ' pl-9'}
                  placeholder="https://linkedin.com/in/twoje-imie"
                  value={profile.linkedin_personal_url}
                  onChange={e => set('linkedin_personal_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Instagram">
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls + ' pl-9'}
                  placeholder="https://instagram.com/twoja_firma"
                  value={profile.instagram_url}
                  onChange={e => set('instagram_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Facebook">
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls + ' pl-9'}
                  placeholder="https://facebook.com/twojastrona"
                  value={profile.facebook_url}
                  onChange={e => set('facebook_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Inne linki" hint="TikTok, YouTube, portfolio, case studies itp.">
              <input
                className={inputCls}
                placeholder="https://..."
                value={profile.other_links}
                onChange={e => set('other_links', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ─── SEKCJA 5: Komunikacja ──────────────────────────────────────────── */}
      <Section icon={MessageSquare} title="Styl komunikacji i sprzedaży" subtitle="Jak mówisz do klientów? Jak sprzedajesz?">
        <div className="space-y-4">
          <Field
            label="Ton of Voice"
            hint="Jak piszesz? Formalnie, casualowo, bezpośrednio? Podaj przykłady słów/fraz których używasz."
          >
            <textarea
              className={inputCls}
              rows={3}
              placeholder="np. Bezpośredni, konkretny, bez lania wody. Używam słów: 'system', 'efekt', 'konkret', 'wynik'. Unikam korporacyjnego żargonu. Piszę jak do znajomego z branży."
              value={profile.tone_of_voice}
              onChange={e => set('tone_of_voice', e.target.value)}
            />
          </Field>

          <Field
            label="Case studies / przykłady realizacji"
            hint="Opisz 1–3 projekty: branża klienta, problem, rozwiązanie, efekt. AI używa tego do outreach."
          >
            <textarea
              className={inputCls}
              rows={4}
              placeholder="np. Klient: salon beauty w Warszawie. Problem: brak rezerwacji online, wszystko przez telefon. Rozwiązanie: system rezerwacji + chatbot na stronie. Efekt: +40% rezerwacji online w 30 dni."
              value={profile.case_studies}
              onChange={e => set('case_studies', e.target.value)}
            />
          </Field>

          <Field
            label="Najczęstsze obiekcje i Twoje odpowiedzi"
            hint="AI użyje tego w skryptach sprzedażowych i follow-upach"
          >
            <textarea
              className={inputCls}
              rows={3}
              placeholder="np. 'Za drogie' → 'Rozumiem. Dlatego zaczynamy od prototypu – płacisz dopiero gdy widzisz efekt.'&#10;'Nie teraz' → 'Rozumiem. Kiedy wrócimy do tematu?'"
              value={profile.objections}
              onChange={e => set('objections', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Zapisuję...</>
          ) : saved ? (
            <><CheckCircle2 size={15} className="text-green-300" /> Zapisano!</>
          ) : (
            <><Save size={15} /> Zapisz bazę wiedzy</>
          )}
        </button>
      </div>

    </div>
  )
}
