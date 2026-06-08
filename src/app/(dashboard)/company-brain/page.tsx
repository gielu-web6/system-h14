'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain, FileText, Edit3, TestTube, CheckCircle2, Clock,
  XCircle, AlertTriangle, TrendingUp, Layers, Loader2,
  ArrowRight, Sparkles, Users, MessageSquare, BarChart3, Zap,
  RefreshCw, Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface FileSummary {
  id: string
  original_name: string
  category: string
  processing_status: 'pending' | 'processing' | 'done' | 'failed'
  chunks_count: number
  priority: number
  is_active: boolean
  created_at: string
}

interface DNA {
  completeness_score?: number
  dna_score?: number
  company_name: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  strategia_firmy:      'Strategia firmy',
  opis_uslug:           'Opis usług',
  strategia_sprzedazy:  'Strategia sprzedaży',
  strategia_marketingu: 'Strategia marketingu',
  case_studies:         'Case studies',
  cennik:               'Cennik',
  konkurencja:          'Konkurencja',
  icp_profil:           'Profil ICP',
  szablony:             'Szablony',
  finanse:              'Finanse',
  inne:                 'Inne',
}

const FEATURE_CONTEXT: Array<{
  label: string
  feature: string
  icon: React.ElementType
  categories: string[]
}> = [
  { label: 'AI Scoring leadów',   feature: 'lead_scoring',       icon: Brain,        categories: ['icp_profil', 'strategia_sprzedazy'] },
  { label: 'Generator treści',    feature: 'content_generator',  icon: Sparkles,     categories: ['strategia_marketingu', 'case_studies'] },
  { label: 'Generator ofert',     feature: 'offer_generator',    icon: FileText,     categories: ['opis_uslug', 'cennik', 'szablony'] },
  { label: 'Outreach AI',         feature: 'outreach_generator', icon: MessageSquare,categories: ['strategia_sprzedazy', 'icp_profil', 'szablony'] },
  { label: 'Tygodniowy brief',    feature: 'weekly_brief',       icon: BarChart3,    categories: ['strategia_sprzedazy', 'finanse'] },
  { label: 'Asystent HANA',       feature: 'hana',               icon: Users,        categories: ['opis_uslug', 'icp_profil', 'cennik'] },
]

function StatusIcon({ status }: { status: FileSummary['processing_status'] }) {
  if (status === 'done')       return <CheckCircle2 size={13} className="text-green-400" />
  if (status === 'processing') return <Loader2 size={13} className="text-blue-400 animate-spin" />
  if (status === 'failed')     return <XCircle size={13} className="text-red-400" />
  return <Clock size={13} className="text-white/30" />
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    strategia_firmy:      'bg-purple-500/15 text-purple-400',
    opis_uslug:           'bg-blue-500/15 text-blue-400',
    strategia_sprzedazy:  'bg-orange-500/15 text-orange-400',
    strategia_marketingu: 'bg-pink-500/15 text-pink-400',
    case_studies:         'bg-green-500/15 text-green-400',
    cennik:               'bg-yellow-500/15 text-yellow-400',
    konkurencja:          'bg-red-500/15 text-red-400',
    icp_profil:           'bg-indigo-500/15 text-indigo-400',
    szablony:             'bg-teal-500/15 text-teal-400',
    finanse:              'bg-emerald-500/15 text-emerald-400',
    inne:                 'bg-white/10 text-white/50',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[category] ?? 'bg-white/10 text-white/50'}`}>
      {CATEGORY_LABELS[category] ?? category}
    </span>
  )
}

export default function CompanyBrainPage() {
  const [dna, setDna]     = useState<DNA | null>(null)
  const [files, setFiles] = useState<FileSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)
  const [missingCount, setMissingCount] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dnaRes, filesRes, interviewRes] = await Promise.all([
        fetch('/api/company-brain/dna'),
        fetch('/api/company-brain/files'),
        fetch('/api/company-brain/interview'),
      ])
      const { dna: d } = await dnaRes.json()
      const { files: f } = await filesRes.json()
      const { total_empty } = await interviewRes.json()
      setDna(d)
      setFiles(f ?? [])
      setMissingCount(typeof total_empty === 'number' ? total_empty : null)
    } catch {
      toast.error('Błąd ładowania Company Brain')
    } finally {
      setLoading(false)
    }
  }, [])

  const syncFromFiles = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/company-brain/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Zsynchronizowano ${data.synced} plików → DNA zaktualizowane ✓`)
      await load()
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Błąd synchronizacji')
    } finally {
      setSyncing(false)
    }
  }, [load])

  useEffect(() => { void load() }, [load])

  const completeness = dna?.dna_score ?? dna?.completeness_score ?? 0
  const doneFiles    = files.filter(f => f.processing_status === 'done')
  const totalChunks  = doneFiles.reduce((s, f) => s + f.chunks_count, 0)

  function getFeatureChunks(categories: string[]) {
    return doneFiles
      .filter(f => categories.includes(f.category) && f.is_active)
      .reduce((s, f) => s + f.chunks_count, 0)
  }

  return (
    <div className="max-w-[1100px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Brain size={20} className="text-accent" />
            Company Brain
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            Baza wiedzy firmowej zasilająca każdy AI call w systemie H14
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void syncFromFiles()}
            disabled={syncing}
            title="Zaciągnij wszystkie dane z przetworzonych plików do DNA"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] font-medium hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncing ? 'Synchronizuję…' : 'Sync z plików'}
          </button>
          <Link href="/company-brain/test"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] font-medium hover:text-white hover:bg-white/[0.08] transition-all">
            <TestTube size={13} /> Testuj kontekst
          </Link>
          <Link href="/company-brain/files"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] font-medium hover:text-white hover:bg-white/[0.08] transition-all">
            <Layers size={13} /> Pliki
          </Link>
          <Link href="/company-brain/dna"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent hover:opacity-90 text-white text-[12px] font-bold transition-all shadow-lg shadow-indigo-500/20">
            <Edit3 size={13} /> Edytuj DNA
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-white/[0.03] border border-white/[0.07]">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-[13px] text-white/40">Ładowanie Company Brain…</p>
        </div>
      )}

      {/* Sync CTA — shown when there are processed files but DNA is incomplete */}
      {!loading && files.filter(f => f.processing_status === 'done').length > 0 && completeness < 80 && (
        <div className="flex items-center gap-4 p-4 rounded-[12px] bg-amber-500/[0.07] border border-amber-500/25">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              Masz {files.filter(f => f.processing_status === 'done').length} przetworzonych plików — DNA nie jest jeszcze zsynchronizowane
            </p>
            <p className="text-[11px] text-white/50 mt-0.5">
              Kliknij "Sync z plików" aby AI automatycznie zaciągnęło wszystkie informacje z Twojej bazy wiedzy do DNA
            </p>
          </div>
          <button
            onClick={() => void syncFromFiles()}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[12px] font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncing ? 'Synchronizuję…' : 'Sync z plików teraz'}
          </button>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* Completeness */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[14px] font-bold text-white">
                    Company DNA — {dna?.company_name ?? 'Nie skonfigurowane'}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Kompletność: {completeness}%
                  </p>
                </div>
                <Link href="/company-brain/dna"
                  className="flex items-center gap-1 text-[11px] text-accent hover:text-white transition-colors">
                  Edytuj <ArrowRight size={11} />
                </Link>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${completeness}%`,
                    background: completeness >= 80
                      ? '#22c55e'
                      : completeness >= 50
                      ? '#f59e0b'
                      : '#ef4444',
                  }}
                />
              </div>

              {completeness < 60 && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-[8px] bg-amber-500/[0.07] border border-amber-500/20">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-amber-300">
                    DNA poniżej 60% — system AI działa w trybie generycznym. Uzupełnij DNA aby uzyskać spersonalizowane wyniki.
                  </p>
                </div>
              )}
            </div>

            {/* Where Company Brain works */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-accent" />
                <p className="text-[14px] font-semibold text-white">Gdzie działa Company Brain</p>
              </div>
              <p className="text-[11px] text-white/40 mb-4">
                Wszystkie moduły poniżej korzystają z Twojego DNA i bazy wiedzy przy każdym AI call.
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: MessageSquare, label: 'Outreach Generator',
                    href: '/outreach',
                    desc: 'Wiadomości cold DM dopasowane do Twojego ICP, tonu i strategii sprzedaży',
                    ready: completeness > 0,
                  },
                  {
                    icon: Send, label: 'Reply Generator',
                    href: '/reply-generator',
                    desc: 'Odpowiedzi na obiekcje i follow-upy zgodne z Twoim stylem zamykania',
                    ready: completeness > 0,
                  },
                  {
                    icon: BarChart3, label: 'AI Scoring leadów',
                    href: '/ai-scoring',
                    desc: 'Ocena leadów na tle Twojego ICP — kto jest hot, kto cold i dlaczego',
                    ready: completeness > 30,
                  },
                  {
                    icon: FileText, label: 'Generator treści',
                    href: '/content-generator',
                    desc: 'Posty i karuzele pisane Twoim głosem, z Twoich tematów i case studies',
                    ready: completeness > 30,
                  },
                  {
                    icon: Users, label: 'Generator ofert',
                    href: '/portal',
                    desc: 'Oferty z Twoimi usługami, cenami i przewagami — bez ręcznego przepisywania',
                    ready: completeness > 50,
                  },
                ].map(({ icon: Icon, label, href, desc, ready }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-start gap-3 p-3 rounded-[10px] border transition-all group hover:bg-white/[0.04] ${
                      ready
                        ? 'border-accent/20 bg-accent/[0.03]'
                        : 'border-white/[0.05] bg-white/[0.02] opacity-60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 mt-0.5 ${ready ? 'bg-accent/15' : 'bg-white/[0.05]'}`}>
                      <Icon size={13} className={ready ? 'text-accent' : 'text-white/30'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-white">{label}</p>
                        {ready
                          ? <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">AKTYWNY</span>
                          : <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">NIEKOMPLETNY</span>
                        }
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{desc}</p>
                    </div>
                    <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors mt-1 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Files list */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-white">Baza wiedzy — pliki kontekstowe</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {doneFiles.length} z {files.length} przetworzonych · {totalChunks} fragmentów w Vector Store
                  </p>
                </div>
                <Link href="/company-brain/files"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent hover:opacity-90 text-white text-[12px] font-semibold transition-all">
                  <Zap size={12} /> Dodaj plik
                </Link>
              </div>

              {files.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Layers size={28} className="text-white/15 mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-white/40">Brak plików kontekstowych</p>
                  <p className="text-[11px] text-white/25 mt-1 mb-4">
                    Wgraj strategie firmy, opisy usług, case studies i inne dokumenty
                  </p>
                  <Link href="/company-brain/files"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent/15 border border-accent/30 text-accent text-[12px] font-semibold hover:bg-accent/25 transition-all">
                    <FileText size={13} /> Dodaj pierwszy plik
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <StatusIcon status={file.processing_status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{file.original_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CategoryBadge category={file.category} />
                          {file.processing_status === 'done' && (
                            <span className="text-[10px] text-white/30">{file.chunks_count} fragmentów</span>
                          )}
                          {file.processing_status === 'failed' && (
                            <span className="text-[10px] text-red-400">Błąd przetwarzania</span>
                          )}
                          {!file.is_active && (
                            <span className="text-[10px] text-white/25 italic">nieaktywny</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                        P{file.priority}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* Feature status */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-white mb-1">Status kontekstu per featura</p>
              <p className="text-[11px] text-white/40 mb-4">Wiedza z plików kontekstowych zasilająca każdy AI call</p>
              <div className="space-y-2">
                {FEATURE_CONTEXT.map(({ label, icon: Icon, categories }) => {
                  const count = getFeatureChunks(categories)
                  const hasDNA = completeness > 0
                  const fileCategories = doneFiles.filter(f => categories.includes(f.category) && f.is_active)
                  const ready = hasDNA && count > 0
                  const partial = hasDNA && count === 0
                  return (
                    <div key={label} className={`flex items-center gap-3 p-2.5 rounded-[8px] border transition-colors ${
                      ready ? 'bg-green-500/[0.04] border-green-500/15' :
                      partial ? 'bg-amber-500/[0.04] border-amber-500/15' :
                      'bg-white/[0.03] border-white/[0.05]'
                    }`}>
                      <Icon size={13} className={`flex-shrink-0 ${ready ? 'text-green-400' : partial ? 'text-amber-400' : 'text-white/30'}`} />
                      <span className="flex-1 text-[12px] text-white/70 truncate">{label}</span>
                      <div className="flex items-center gap-2">
                        {hasDNA && (
                          <span className="text-[10px] text-green-400 font-semibold">DNA ✓</span>
                        )}
                        {count > 0 ? (
                          <span className="text-[10px] text-accent font-semibold">{count} frag.</span>
                        ) : fileCategories.length > 0 ? (
                          <span className="text-[10px] text-amber-400/70">tylko DNA</span>
                        ) : (
                          <span className="text-[10px] text-white/25">brak plików</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Interview CTA */}
            {missingCount !== null && missingCount > 0 && (
              <div className="bg-card border border-accent/20 rounded-[14px] p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white">
                      {missingCount} brakujących informacji
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 mb-3">
                      AI chce zadać Ci pytania aby uzupełnić DNA z bazy wiedzy
                    </p>
                    <Link href="/company-brain/dna"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent/20 border border-accent/30 text-accent text-[12px] font-semibold hover:bg-[#6366f1]/30 transition-all">
                      <MessageSquare size={12} /> Odpowiedz na pytania AI
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-white mb-4">Statystyki bazy wiedzy</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pliki',         value: files.length,      icon: FileText, color: 'text-blue-400' },
                  { label: 'Przetworzone',  value: doneFiles.length,  icon: CheckCircle2, color: 'text-green-400' },
                  { label: 'Fragmenty',     value: totalChunks,       icon: Layers,   color: 'text-purple-400' },
                  { label: 'DNA Score',     value: `${completeness}%`, icon: TrendingUp, color: 'text-indigo-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05] text-center">
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className="text-[16px] font-bold text-white">{value}</p>
                    <p className="text-[9px] text-white/35 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-card border border-white/[0.07] rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-white mb-3">Szybkie akcje</p>
              <div className="space-y-2">
                {[
                  { href: '/company-brain/dna',  label: 'Edytuj Company DNA',   icon: Edit3,     desc: 'Uzupełnij profil firmy' },
                  { href: '/company-brain/files', label: 'Zarządzaj plikami',   icon: Layers,    desc: 'Dodaj lub zaktualizuj pliki' },
                  { href: '/company-brain/test',  label: 'Testuj kontekst AI',   icon: TestTube,  desc: 'Sprawdź co widzi AI' },
                ].map(({ href, label, icon: Icon, desc }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/[0.1] transition-all group">
                    <Icon size={14} className="text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-white/40">{desc}</p>
                    </div>
                    <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
