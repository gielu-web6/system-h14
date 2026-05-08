'use client'

import { useState } from 'react'
import {
  Globe, Copy, Check, Download, Eye, Clock,
  CheckCircle2, FileText, AlertCircle, Plus, Trash2, Briefcase,
} from 'lucide-react'
import { useServices } from '@/hooks/useServices'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SolutionItem { item: string; desc: string }
interface TimelineItem { stage: string; duration: string; date: string }

interface OfferData {
  client: string
  contact: string
  preparedBy: string
  problem: string
  solution: SolutionItem[]
  timeline: TimelineItem[]
  price: number
  deposit: number
  validUntil: string
}

function defaultPortalOffer(): OfferData {
  return {
    client: 'Klinika Optima',
    contact: 'Marta Nowak',
    preparedBy: 'AM Automations',
    problem: 'Klinika traci 8h tygodniowo na ręczne przepisywanie danych między systemami. Recepcja nie odbiera ok. 30% połączeń — pacjenci trafiają na pocztę głosową i rezygnują z wizyty.',
    solution: [
      { item: 'AI Recepcjonistka 24/7', desc: 'Obsługa połączeń głosowych z integracją kalendarza i SMS-ami przypominającymi o wizytach' },
      { item: 'Automatyzacja przepływu danych', desc: 'Dane z rejestracji trafiają automatycznie do systemu fakturowania — zero ręcznego przepisywania' },
      { item: 'Panel administracyjny', desc: 'Dashboard dla managera — harmonogram, raporty, statystyki w jednym miejscu' },
    ],
    timeline: [
      { stage: 'Etap 1: Analiza i projektowanie', duration: '2 tygodnie', date: 'Tydzień 1–2' },
      { stage: 'Etap 2: Wdrożenie AI Recepcjonistki', duration: '2 tygodnie', date: 'Tydzień 3–4' },
      { stage: 'Etap 3: Automatyzacja i panel', duration: '2 tygodnie', date: 'Tydzień 5–6' },
      { stage: 'Etap 4: Szkolenie i odbiór', duration: '1 tydzień', date: 'Tydzień 7' },
    ],
    price: 18500,
    deposit: 20,
    validUntil: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
  }
}

// ─── Copy btn ─────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[11px] font-medium hover:bg-white/[0.09] hover:text-white transition-all">
      {copied ? <><Check size={12} className="text-green-400" /> Skopiowano</> : <><Copy size={12} /> Kopiuj link</>}
    </button>
  )
}

// ─── Offer preview ────────────────────────────────────────────────────────────

function OfferPreview({ offer }: { offer: OfferData }) {
  const deposit = Math.round(offer.price * offer.deposit / 100)
  const remaining = offer.price - deposit
  const hasContent = offer.client || offer.preparedBy || offer.problem || offer.price > 0

  if (!hasContent) {
    return (
      <div className="rounded-[16px] border-2 border-dashed border-white/[0.1] flex flex-col items-center justify-center py-20 gap-3">
        <FileText size={28} className="text-white/20" />
        <p className="text-[14px] text-white/30 font-medium">Podgląd oferty</p>
        <p className="text-[12px] text-white/20">Uzupełnij dane po lewej aby zobaczyć podgląd micro-strony</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[16px] overflow-hidden shadow-2xl text-gray-900 max-h-[calc(100vh-180px)] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#6366f1] px-8 py-8 text-white">
        {offer.preparedBy && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-white/20 flex items-center justify-center font-bold text-lg">
              {offer.preparedBy.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-[13px] font-semibold opacity-80">Oferta przygotowana przez</p>
              <p className="text-[16px] font-bold">{offer.preparedBy}</p>
            </div>
          </div>
        )}
        <h1 className="text-[22px] font-bold mb-1">Oferta współpracy</h1>
        {offer.client && <p className="text-[14px] opacity-80">Przygotowana dla: <strong>{offer.client}</strong></p>}
        {offer.contact && <p className="text-[12px] opacity-60 mt-1">Osoba kontaktowa: {offer.contact}</p>}
      </div>

      {/* Validity */}
      {offer.validUntil && (
        <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-[12px] text-amber-700 font-medium">
              Oferta ważna do: <strong>{new Date(offer.validUntil).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </span>
          </div>
          <AlertCircle size={14} className="text-amber-500" />
        </div>
      )}

      <div className="px-8 py-6 space-y-7">
        {/* Problem */}
        {offer.problem && (
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[11px] font-bold">!</span>
              Problem
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">{offer.problem}</p>
          </div>
        )}

        {/* Solution */}
        {offer.solution.some(s => s.item) && (
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#6366f1]/15 text-[#6366f1] flex items-center justify-center text-[11px] font-bold">✓</span>
              Zakres rozwiązania
            </h2>
            <div className="space-y-2">
              {offer.solution.filter(s => s.item).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-gray-50">
                  <CheckCircle2 size={15} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{s.item}</p>
                    {s.desc && <p className="text-[11px] text-gray-500 mt-0.5">{s.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {offer.timeline.some(t => t.stage) && (
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 mb-3">Harmonogram</h2>
            <div className="space-y-2">
              {offer.timeline.filter(t => t.stage).map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-[10px] border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-800">{t.stage}</p>
                    {t.date && <p className="text-[11px] text-gray-500">{t.date}</p>}
                  </div>
                  {t.duration && <span className="text-[11px] text-[#6366f1] font-semibold">{t.duration}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment */}
        {offer.price > 0 && (
          <div className="p-5 rounded-[14px] bg-[#6366f1]/5 border border-[#6366f1]/20">
            <h2 className="text-[15px] font-bold text-gray-800 mb-3">Inwestycja</h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-600">Wartość projektu:</span>
              <span className="text-[24px] font-bold text-[#6366f1]">{offer.price.toLocaleString('pl-PL')} PLN</span>
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Zaliczka przy podpisaniu ({offer.deposit}%):</span>
                <span className="font-semibold text-gray-700">{deposit.toLocaleString('pl-PL')} PLN</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Pozostałe po wdrożeniu ({100 - offer.deposit}%):</span>
                <span className="font-semibold text-gray-700">{remaining.toLocaleString('pl-PL')} PLN</span>
              </div>
            </div>
            <div className="p-3 rounded-[10px] bg-gray-50 text-[11px] text-gray-500">
              Cena jest netto. Do wartości zostanie doliczony podatek VAT 23%.
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center space-y-3">
          <h2 className="text-[15px] font-bold text-gray-800">Następny krok</h2>
          <p className="text-[13px] text-gray-500">Kliknij przycisk poniżej lub napisz do nas — przeprowadzimy Cię przez cały proces.</p>
          <button className="w-full py-3 rounded-[12px] bg-[#6366f1] text-white text-[14px] font-bold hover:bg-[#5254cc] transition-all shadow-lg shadow-indigo-500/25">
            Akceptuję ofertę — zaczynam!
          </button>
        </div>

        {offer.preparedBy && (
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-[10px] text-gray-400">Oferta przygotowana przez {offer.preparedBy}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalPage() {
  const [offer, setOffer] = useState<OfferData>(defaultPortalOffer)
  const { services: dbServices } = useServices()

  const setField = (k: keyof OfferData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setOffer(prev => ({ ...prev, [k]: k === 'price' || k === 'deposit' ? Number(e.target.value) || 0 : e.target.value }))

  const setSolution = (i: number, field: keyof SolutionItem, value: string) =>
    setOffer(prev => ({ ...prev, solution: prev.solution.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }))

  const setTimeline = (i: number, field: keyof TimelineItem, value: string) =>
    setOffer(prev => ({ ...prev, timeline: prev.timeline.map((t, idx) => idx === i ? { ...t, [field]: value } : t) }))

  const addSolution = () =>
    setOffer(prev => ({ ...prev, solution: [...prev.solution, { item: '', desc: '' }] }))

  const removeSolution = (i: number) =>
    setOffer(prev => ({ ...prev, solution: prev.solution.filter((_, idx) => idx !== i) }))

  const labelClass = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5'
  const inputClass = 'w-full px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-white/20'

  return (
    <div className="max-w-[1300px]">
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <Globe size={19} className="text-[#6366f1]" />
          Portal Klienta
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">Twórz micro-strony ofert z trackerem otwarć</p>
      </div>

      {/* Live tracker demo banner */}
      <div className="mb-5 flex items-center gap-4 px-5 py-4 rounded-[14px] bg-[#E8A838]/10 border border-[#E8A838]/25">
        <div className="w-2 h-2 rounded-full bg-[#E8A838] animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white">Klinika Optima — oferta otwarta 3 razy</p>
          <p className="text-[11px] text-white/50 mt-0.5">Ostatnio wczoraj o 14:23 · 3 min 7 sek na cenniku</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[12px] font-bold text-[#E8A838]">Najlepszy moment żeby zadzwonić!</p>
          <p className="text-[10px] text-white/30 mt-0.5">Klient spędził czas na przeglądaniu cen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        {/* Editor panel */}
        <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">

          {/* Basic info */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
            <p className="text-[13px] font-semibold text-white">Dane oferty</p>
            <div>
              <label className={labelClass}>Klient *</label>
              <input value={offer.client} onChange={setField('client')} placeholder="Nazwa firmy klienta" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Osoba kontaktowa</label>
              <input value={offer.contact} onChange={setField('contact')} placeholder="Jan Kowalski" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Przygotowane przez (Twoja firma)</label>
              <input value={offer.preparedBy} onChange={setField('preparedBy')} placeholder="Twoja Agencja" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ważna do</label>
              <input type="date" value={offer.validUntil} onChange={setField('validUntil')} className={inputClass} />
            </div>
          </div>

          {/* Problem */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
            <p className="text-[13px] font-semibold text-white">Problem klienta</p>
            <textarea value={offer.problem} onChange={setField('problem')} rows={3}
              placeholder="Opisz problem biznesowy klienta który rozwiązujesz..."
              className={`${inputClass} resize-none`} />
          </div>

          {/* Services quick-add from catalog */}
          {dbServices.length > 0 && (
            <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-4 space-y-2">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase size={10} /> Dodaj z katalogu usług
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dbServices.map(s => (
                  <button key={s.id}
                    onClick={() => setOffer(prev => ({
                      ...prev,
                      solution: [...prev.solution, { item: s.name, desc: s.description }],
                    }))}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-all">
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Solution */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-white">Zakres rozwiązania</p>
              <button onClick={addSolution}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#6366f1]/15 text-[#a5b4fc] text-[11px] font-medium hover:bg-[#6366f1]/25 transition-all">
                <Plus size={11} /> Dodaj
              </button>
            </div>
            {offer.solution.map((s, i) => (
              <div key={i} className="space-y-1.5 p-3 rounded-[10px] bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <input value={s.item} onChange={e => setSolution(i, 'item', e.target.value)}
                    placeholder={`Pozycja ${i + 1}...`} className={`${inputClass} flex-1 text-[12px]`} />
                  {offer.solution.length > 1 && (
                    <button onClick={() => removeSolution(i)} className="p-1.5 rounded-[6px] text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <input value={s.desc} onChange={e => setSolution(i, 'desc', e.target.value)}
                  placeholder="Opis..." className={`${inputClass} text-[11px]`} />
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
            <p className="text-[13px] font-semibold text-white">Harmonogram</p>
            {offer.timeline.map((t, i) => (
              <div key={i} className="space-y-1.5 p-3 rounded-[10px] bg-white/[0.02] border border-white/[0.05]">
                <input value={t.stage} onChange={e => setTimeline(i, 'stage', e.target.value)}
                  placeholder={`Etap ${i + 1}...`} className={`${inputClass} text-[12px]`} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={t.duration} onChange={e => setTimeline(i, 'duration', e.target.value)}
                    placeholder="Czas trwania" className={`${inputClass} text-[11px]`} />
                  <input value={t.date} onChange={e => setTimeline(i, 'date', e.target.value)}
                    placeholder="Data" className={`${inputClass} text-[11px]`} />
                </div>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
            <p className="text-[13px] font-semibold text-white">Inwestycja</p>
            <div>
              <label className={labelClass}>Cena (PLN netto)</label>
              <input type="number" value={offer.price || ''} onChange={setField('price')}
                placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Zaliczka (%)</label>
              <input type="number" value={offer.deposit} onChange={setField('deposit')}
                min="0" max="100" className={inputClass} />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-4 space-y-2">
            <p className="text-[12px] font-semibold text-white mb-2">Udostępnij ofertę</p>
            <CopyBtn text={`${typeof window !== 'undefined' ? window.location.origin : ''}/oferta/${offer.client ? offer.client.toLowerCase().replace(/\s+/g, '-') : 'klient'}`} />
            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/55 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all">
              <Download size={13} /> Pobierz PDF
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-bold">PRO</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={13} className="text-white/40" />
            <span className="text-[12px] text-white/40">Podgląd micro-strony oferty</span>
            {offer.client && <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">Live</span>}
          </div>
          <OfferPreview offer={offer} />
        </div>
      </div>
    </div>
  )
}
