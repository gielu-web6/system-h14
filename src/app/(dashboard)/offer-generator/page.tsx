'use client'

import { useState, useEffect } from 'react'
import {
  FileText, ChevronRight, ChevronLeft, Loader2, Sparkles,
  Check, Building2, DollarSign, Calendar, Download,
  CheckSquare, Square, User, Briefcase,
} from 'lucide-react'
import { useServices, UNIT_LABELS } from '@/hooks/useServices'
import { isDemoMode } from '@/lib/userStore'
import { DEMO_DEALS } from '@/lib/demo-data'

// ─── Modules config ───────────────────────────────────────────────────────────

const MODULES = [
  { id: 'crm',        label: 'Pipeline CRM',          price: 4800,  desc: 'Kanban board, zarządzanie dealami, historia rozmów' },
  { id: 'ai-scoring', label: 'AI Scoring leadów',      price: 3200,  desc: 'Automatyczna ocena i priorytetyzacja leadów 0-100' },
  { id: 'outreach',   label: 'Automatyzacja Outreach', price: 3600,  desc: 'Sekwencje follow-upów, personalizowane wiadomości AI' },
  { id: 'content',    label: 'Generator Treści AI',    price: 2800,  desc: 'Karuzele IG, posty LI, repurposing 1→5' },
  { id: 'calendar',   label: 'Kalendarz Contentu',     price: 1600,  desc: 'Planowanie i zarządzanie postami na 5 kanałach' },
  { id: 'finance',    label: 'Tracker Finansowy',      price: 2400,  desc: 'P&L, faktury, wydatki, prognoza przychodów' },
  { id: 'portal',     label: 'Portal Klienta',         price: 2000,  desc: 'Micro-strony ofert z trackerem otwarć' },
  { id: 'analytics',  label: 'Analityka Sprzedażowa',  price: 2400,  desc: 'Raporty segmentów, pipeline velocity, forecast' },
  { id: 'training',   label: 'Szkolenie zespołu',      price: 1800,  desc: 'Onboarding 3h dla całego teamu + materiały' },
]

// ─── Lead loader (from localStorage) ─────────────────────────────────────────

interface StoredLead { id: string; firstName: string; lastName: string; company: string }

function loadLeadClients(): StoredLead[] {
  try {
    const raw = localStorage.getItem('agencyos_leads')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
            s < step  ? 'bg-green-500 text-white' :
            s === step ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/30' :
            'bg-white/[0.07] text-white/30'
          }`}>
            {s < step ? <Check size={13} /> : s}
          </div>
          <span className={`text-[12px] font-medium ${s === step ? 'text-white' : 'text-white/35'}`}>
            {s === 1 ? 'Klient' : s === 2 ? 'Zakres' : 'Preview'}
          </span>
          {s < 3 && <ChevronRight size={13} className="text-white/20 mx-1" />}
        </div>
      ))}
    </div>
  )
}

// ─── Generated offer preview ──────────────────────────────────────────────────

interface SelectedService { id: string; name: string; desc: string; price: number; unit: string }

function GeneratedOfferPreview({
  client, contactPerson, preparedBy, modules, services, price, days,
}: {
  client: string
  contactPerson: string
  preparedBy: string
  modules: string[]
  services: SelectedService[]
  price: number
  days: number
}) {
  const selectedModules = MODULES.filter(m => modules.includes(m.id))
  const deposit = Math.round(price * 0.2)
  const remaining = price - deposit
  const today = new Date()
  const validUntil = new Date(today.getTime() + 14 * 86400000)
  const initials = preparedBy.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'

  return (
    <div className="bg-white rounded-[14px] overflow-hidden shadow-xl text-gray-900 max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-6 py-6 text-white">
        {preparedBy && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-[8px] bg-white/20 flex items-center justify-center font-bold text-[13px]">{initials}</div>
            <span className="text-[13px] font-semibold opacity-80">{preparedBy}</span>
          </div>
        )}
        <h1 className="text-[19px] font-bold mb-1">Propozycja współpracy</h1>
        {client && <p className="text-[12px] opacity-75">Przygotowane dla: <strong>{client}</strong></p>}
        {contactPerson && <p className="text-[11px] opacity-60 mt-0.5">Osoba kontaktowa: {contactPerson}</p>}
        <div className="mt-3 px-3 py-1.5 bg-white/15 rounded-full inline-flex items-center gap-1.5 text-[11px]">
          <Calendar size={11} />
          Ważna do: {validUntil.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Scope */}
        {(selectedModules.length > 0 || services.length > 0) && (
          <div>
            <h2 className="text-[14px] font-bold text-gray-800 mb-2">Zakres wdrożenia</h2>
            <div className="space-y-1.5">
              {selectedModules.map(m => (
                <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-[8px] bg-gray-50">
                  <Check size={13} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-[12px] font-semibold text-gray-800">{m.label}</span>
                    <span className="text-[11px] text-gray-500 ml-2">{m.desc}</span>
                  </div>
                </div>
              ))}
              {services.map(s => (
                <div key={s.id} className="flex items-start gap-2 p-2.5 rounded-[8px] bg-indigo-50">
                  <Check size={13} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-[12px] font-semibold text-gray-800">{s.name}</span>
                    {s.desc && <span className="text-[11px] text-gray-500 ml-2">{s.desc}</span>}
                  </div>
                  <span className="text-[11px] text-[#6366f1] font-semibold flex-shrink-0">{s.price.toLocaleString('pl-PL')} PLN {UNIT_LABELS[s.unit] ?? s.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {days > 0 && (
          <div>
            <h2 className="text-[14px] font-bold text-gray-800 mb-2">Harmonogram</h2>
            <div className="space-y-1.5">
              {[
                { label: 'Etap 1: Setup i konfiguracja', dur: `${Math.ceil(days * 0.35)} dni` },
                { label: 'Etap 2: Wdrożenie i testy',    dur: `${Math.ceil(days * 0.4)} dni` },
                { label: 'Etap 3: Szkolenie i odbiór',   dur: `${Math.ceil(days * 0.25)} dni` },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-[8px] border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                    <span className="text-[12px] font-medium text-gray-700">{t.label}</span>
                  </div>
                  <span className="text-[11px] text-[#6366f1] font-semibold">{t.dur}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment */}
        {price > 0 && (
          <div className="p-4 rounded-[12px] bg-[#6366f1]/5 border border-[#6366f1]/15">
            <h2 className="text-[14px] font-bold text-gray-800 mb-3">Inwestycja</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-gray-500">Wartość projektu:</span>
              <span className="text-[22px] font-bold text-[#6366f1]">{price.toLocaleString('pl-PL')} PLN</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Zaliczka (20%):</span>
                <span className="font-semibold text-gray-700">{deposit.toLocaleString('pl-PL')} PLN</span>
              </div>
              <div className="flex justify-between">
                <span>Płatność końcowa:</span>
                <span className="font-semibold text-gray-700">{remaining.toLocaleString('pl-PL')} PLN</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-gray-400">Cena netto + VAT 23%</p>
          </div>
        )}

        {/* CTA */}
        <button className="w-full py-3 rounded-[12px] bg-[#6366f1] text-white text-[13px] font-bold hover:bg-[#5254cc] transition-all">
          Akceptuję ofertę — zaczynam!
        </button>

        {preparedBy && (
          <p className="text-center text-[10px] text-gray-400">Oferta przygotowana przez {preparedBy}</p>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferGeneratorPage() {
  const [step, setStep] = useState(1)
  const { services: dbServices, loading: servicesLoading } = useServices()

  // Step 1
  const [crmLeads, setCrmLeads] = useState<StoredLead[]>([])
  const [useCustom, setUseCustom] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [customClient, setCustomClient] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [preparedBy, setPreparedBy] = useState('')

  // Step 2
  const [selectedModules, setMods] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customPrice, setCustomPrice] = useState('')
  const [days, setDays] = useState(14)

  // Step 3
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (isDemoMode()) {
      const demoClients: StoredLead[] = DEMO_DEALS
        .filter(d => !['przegrana', 'nie_teraz'].includes(d.stage))
        .map(d => ({
          id: d.id,
          firstName: d.contact_name?.split(' ')[0] ?? '',
          lastName: d.contact_name?.split(' ').slice(1).join(' ') ?? '',
          company: d.title,
        }))
      setCrmLeads(demoClients)
      setUseCustom(false)
      setPreparedBy('AM Automations')
      return
    }
    const leads = loadLeadClients()
    setCrmLeads(leads)
    if (leads.length > 0) setUseCustom(false)
  }, [])

  const selectedLead = crmLeads.find(l => l.id === selectedLeadId)
  const finalClient = useCustom ? customClient : (selectedLead?.company ?? '')
  const finalContact = useCustom ? contactPerson : (selectedLead ? `${selectedLead.firstName} ${selectedLead.lastName}` : contactPerson)

  const calcPrice = selectedModules.reduce((s, id) => {
    const m = MODULES.find(m => m.id === id)
    return s + (m?.price ?? 0)
  }, 0) + selectedServices.reduce((s, id) => {
    const svc = dbServices.find(s => s.id === id)
    return s + (svc?.price_min ?? 0)
  }, 0)
  const finalPrice = customPrice ? parseInt(customPrice) || calcPrice : calcPrice

  const toggleModule = (id: string) =>
    setMods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])

  const toggleService = (id: string) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const chosenServices: SelectedService[] = dbServices
    .filter(s => selectedServices.includes(s.id))
    .map(s => ({ id: s.id, name: s.name, desc: s.description, price: s.price_min, unit: s.unit }))

  const handleGenerate = async () => {
    setLoading(true)
    setGenerated(false)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setGenerated(true)
  }

  const labelClass = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5'
  const inputClass = 'w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#6366f1]/60 transition-all'

  return (
    <div className="max-w-[1200px] space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <FileText size={19} className="text-[#6366f1]" />
          Generator Ofert AI
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">Stwórz profesjonalną ofertę w 3 krokach</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6">
        {/* Wizard */}
        <div className="bg-[#16213E] border border-white/[0.07] rounded-[16px] p-6">
          <StepIndicator step={step} />

          {/* ── Step 1: Client ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-white">Klient i dane oferty</h2>

              {/* Source toggle */}
              <div className="flex items-center gap-3">
                {crmLeads.length > 0 && (
                  <button onClick={() => setUseCustom(false)}
                    className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-all ${!useCustom ? 'bg-[#6366f1]/15 border-[#6366f1]/40 text-[#a5b4fc]' : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                    Z bazy leadów ({crmLeads.length})
                  </button>
                )}
                <button onClick={() => setUseCustom(true)}
                  className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-all ${useCustom ? 'bg-[#6366f1]/15 border-[#6366f1]/40 text-[#a5b4fc]' : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                  Wpisz ręcznie
                </button>
              </div>

              {/* Lead picker */}
              {!useCustom && crmLeads.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {crmLeads.map(l => (
                    <button key={l.id} onClick={() => setSelectedLeadId(l.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left text-[12px] font-medium transition-all ${
                        selectedLeadId === l.id
                          ? 'bg-[#6366f1]/15 border-[#6366f1]/40 text-white'
                          : 'bg-white/[0.03] border-white/[0.07] text-white/60 hover:border-white/15 hover:text-white'
                      }`}>
                      <Building2 size={12} className="flex-shrink-0 text-white/30" />
                      <div className="min-w-0">
                        <p className="truncate">{l.company}</p>
                        <p className="text-[10px] text-white/35 truncate">{l.firstName} {l.lastName}</p>
                      </div>
                      {selectedLeadId === l.id && <Check size={11} className="ml-auto flex-shrink-0 text-[#6366f1]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Manual input */}
              {useCustom && (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Nazwa firmy klienta *</label>
                    <input value={customClient} onChange={e => setCustomClient(e.target.value)}
                      placeholder="np. ABC sp. z o.o." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Osoba kontaktowa</label>
                    <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                      placeholder="Jan Kowalski" className={inputClass} />
                  </div>
                </div>
              )}

              {/* Your company */}
              <div>
                <label className={labelClass}>Twoja firma (pojawi się w nagłówku oferty)</label>
                <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)}
                  placeholder="Twoja Agencja" className={inputClass} />
              </div>

              <button onClick={() => setStep(2)} disabled={!finalClient}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-[13px] font-semibold transition-all">
                Dalej <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ── Step 2: Scope ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-white">Wybierz moduły i usługi</h2>
                <span className="text-[12px] text-white/40">{selectedModules.length + selectedServices.length} zaznaczone</span>
              </div>

              {/* Hardcoded modules */}
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2">Moduły platformy</p>
                <div className="space-y-2">
                  {MODULES.map(m => {
                    const selected = selectedModules.includes(m.id)
                    return (
                      <button key={m.id} onClick={() => toggleModule(m.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left transition-all ${
                          selected ? 'bg-[#6366f1]/10 border-[#6366f1]/35' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/15'
                        }`}>
                        <div className={`flex-shrink-0 transition-colors ${selected ? 'text-[#6366f1]' : 'text-white/20'}`}>
                          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold ${selected ? 'text-white' : 'text-white/60'}`}>{m.label}</p>
                          <p className="text-[11px] text-white/35 truncate">{m.desc}</p>
                        </div>
                        <span className={`text-[11px] font-semibold flex-shrink-0 ${selected ? 'text-[#6366f1]' : 'text-white/30'}`}>
                          {m.price.toLocaleString('pl-PL')} PLN
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Your services from DB */}
              {dbServices.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Briefcase size={10} /> Twoje usługi
                  </p>
                  <div className="space-y-2">
                    {servicesLoading ? (
                      <div className="flex items-center gap-2 text-white/30 text-[12px] py-2">
                        <Loader2 size={13} className="animate-spin" /> Ładowanie usług...
                      </div>
                    ) : (
                      dbServices.map(s => {
                        const selected = selectedServices.includes(s.id)
                        const priceLabel = s.price_min === s.price_max
                          ? `${s.price_min.toLocaleString('pl-PL')} PLN`
                          : `${s.price_min.toLocaleString('pl-PL')}–${s.price_max.toLocaleString('pl-PL')} PLN`
                        return (
                          <button key={s.id} onClick={() => toggleService(s.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left transition-all ${
                              selected ? 'bg-violet-500/10 border-violet-500/35' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/15'
                            }`}>
                            <div className={`flex-shrink-0 transition-colors ${selected ? 'text-violet-400' : 'text-white/20'}`}>
                              {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-semibold ${selected ? 'text-white' : 'text-white/60'}`}>{s.name}</p>
                              {s.description && <p className="text-[11px] text-white/35 truncate">{s.description}</p>}
                            </div>
                            <span className={`text-[11px] font-semibold flex-shrink-0 ${selected ? 'text-violet-400' : 'text-white/30'}`}>
                              {priceLabel}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Cena PLN netto <span className="text-white/25 normal-case">(opcjonalne)</span></label>
                  <input value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                    placeholder={calcPrice ? calcPrice.toLocaleString('pl-PL') : '0'} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Czas wdrożenia (dni roboczych)</label>
                  <input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 14)} min={3}
                    className={inputClass} />
                </div>
              </div>

              {finalPrice > 0 && (
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#6366f1]/10 border border-[#6366f1]/25">
                  <span className="text-[12px] text-white/60">Szacowana wartość oferty:</span>
                  <span className="text-[18px] font-bold text-[#a5b4fc]">{finalPrice.toLocaleString('pl-PL')} PLN</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[13px] font-medium hover:text-white transition-all">
                  <ChevronLeft size={14} /> Wstecz
                </button>
                <button onClick={() => setStep(3)} disabled={selectedModules.length === 0 && selectedServices.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-[13px] font-semibold transition-all">
                  Dalej <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Generate ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-white">Podsumowanie</h2>
              <div className="p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07] space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-white/30" />
                  <span className="text-[12px] text-white/50">Klient:</span>
                  <span className="text-[13px] font-semibold text-white">{finalClient}</span>
                </div>
                {finalContact && (
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-white/30" />
                    <span className="text-[12px] text-white/50">Kontakt:</span>
                    <span className="text-[13px] font-semibold text-white">{finalContact}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckSquare size={13} className="text-white/30" />
                  <span className="text-[12px] text-white/50">Moduły:</span>
                  <span className="text-[13px] font-semibold text-white">{selectedModules.length} zaznaczone</span>
                </div>
                {finalPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={13} className="text-white/30" />
                    <span className="text-[12px] text-white/50">Wartość:</span>
                    <span className="text-[13px] font-bold text-[#a5b4fc]">{finalPrice.toLocaleString('pl-PL')} PLN</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-white/30" />
                  <span className="text-[12px] text-white/50">Czas wdrożenia:</span>
                  <span className="text-[13px] font-semibold text-white">{days} dni roboczych</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[13px] font-medium hover:text-white transition-all">
                  <ChevronLeft size={14} /> Wstecz
                </button>
                <button onClick={handleGenerate} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5254cc] hover:to-[#7c3aed] disabled:opacity-60 text-white text-[13px] font-bold transition-all shadow-lg shadow-indigo-500/20">
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Generowanie oferty...</>
                  ) : (
                    <><Sparkles size={15} /> Generuj ofertę AI</>
                  )}
                </button>
              </div>

              {generated && (
                <div className="flex items-center gap-3">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[12px] font-medium hover:text-white transition-all">
                    <Download size={13} /> Pobierz PDF
                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/25 font-bold">PRO</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all">
                    Wyślij link klientowi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={13} className="text-white/40" />
            <span className="text-[12px] text-white/40">Podgląd oferty</span>
            {generated && <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">Wygenerowana</span>}
          </div>
          {(step >= 2 || generated) ? (
            <GeneratedOfferPreview
              client={finalClient || 'Klient'}
              contactPerson={finalContact}
              preparedBy={preparedBy}
              modules={selectedModules}
              services={chosenServices}
              price={finalPrice}
              days={days}
            />
          ) : (
            <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] h-[400px] flex items-center justify-center">
              <div className="text-center">
                <FileText size={36} className="text-white/15 mx-auto mb-3" />
                <p className="text-[13px] text-white/30">Podgląd oferty pojawi się<br />po wypełnieniu formularza</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
