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
]

function StatusIcon({ status }: { status: FileSummary['processing_status'] }) {
  if (status === 'done')       return <CheckCircle2 size={13} className="text-success" />
  if (status === 'processing') return <Loader2 size={13} className="text-info animate-spin" />
  if (status === 'failed')     return <XCircle size={13} className="text-danger" />
  return <Clock size={13} className="text-subtle" />
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    strategia_firmy:      'bg-violet/15 text-violet',
    opis_uslug:           'bg-info/15 text-info',
    strategia_sprzedazy:  'bg-amber/15 text-amber',
    strategia_marketingu: 'bg-pink/15 text-pink',
    case_studies:         'bg-success/15 text-success',
    cennik:               'bg-amber/10 text-amber',
    konkurencja:          'bg-danger/15 text-danger',
    icp_profil:           'bg-violet/15 text-violet',
    szablony:             'bg-accent/15 text-accent',
    finanse:              'bg-success/10 text-success',
    inne:                 'bg-fg/[0.1] text-muted',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[category] ?? 'bg-fg/[0.1] text-muted'}`}>
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
          <h1 className="text-[20px] font-bold text-fg flex items-center gap-2">
            <Brain size={20} className="text-pink" />
            Company Brain
          </h1>
          <p className="text-[12px] text-muted mt-0.5">
            Baza wiedzy firmowej zasilająca każdy AI call w systemie H14
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void syncFromFiles()}
            disabled={syncing}
            title="Zaciągnij wszystkie dane z przetworzonych plików do DNA"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.08] text-muted text-[12px] font-medium hover:text-fg hover:bg-fg/[0.08] transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncing ? 'Synchronizuję…' : 'Sync z plików'}
          </button>
          <Link href="/company-brain/test"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.08] text-muted text-[12px] font-medium hover:text-fg hover:bg-fg/[0.08] transition-all">
            <TestTube size={13} /> Testuj kontekst
          </Link>
          <Link href="/company-brain/files"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-fg/[0.05] border border-fg/[0.08] text-muted text-[12px] font-medium hover:text-fg hover:bg-fg/[0.08] transition-all">
            <Layers size={13} /> Pliki
          </Link>
          <Link href="/company-brain/dna"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-pink hover:opacity-90 hover:shadow-[var(--glow-pink)] text-[12px] font-bold transition-all"
            style={{ color: 'var(--nav-pill-text)' }}>
            <Edit3 size={13} /> Edytuj DNA
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-raised border border-border">
          <div className="w-4 h-4 border-2 border-fg/20 border-t-pink rounded-full animate-spin" />
          <p className="text-[13px] text-muted">Ładowanie Company Brain…</p>
        </div>
      )}

      {/* Sync CTA — shown when there are processed files but DNA is incomplete */}
      {!loading && files.filter(f => f.processing_status === 'done').length > 0 && completeness < 80 && (
        <div className="flex items-center gap-4 p-4 rounded-[12px] bg-amber/[0.07] border border-amber/25">
          <AlertTriangle size={16} className="text-amber flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-fg">
              Masz {files.filter(f => f.processing_status === 'done').length} przetworzonych plików — DNA nie jest jeszcze zsynchronizowane
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Kliknij &quot;Sync z plików&quot; aby AI automatycznie zaciągnęło wszystkie informacje z Twojej bazy wiedzy do DNA
            </p>
          </div>
          <button
            onClick={() => void syncFromFiles()}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-amber/20 border border-amber/30 text-amber text-[12px] font-bold hover:bg-amber/30 hover:shadow-[var(--glow-amber)] transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
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
            <div className="card-elevated rounded-[14px] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[14px] font-bold text-fg">
                    Company DNA — {dna?.company_name ?? 'Nie skonfigurowane'}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Kompletność: {completeness}%
                  </p>
                </div>
                <Link href="/company-brain/dna"
                  className="flex items-center gap-1 text-[11px] text-pink hover:opacity-70 transition-opacity">
                  Edytuj <ArrowRight size={11} />
                </Link>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-fg/[0.06] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${completeness}%`,
                    background: completeness >= 80
                      ? 'var(--c-green)'
                      : completeness >= 50
                      ? 'var(--c-amber)'
                      : 'var(--c-red)',
                  }}
                />
              </div>

              {completeness < 60 && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-[8px] bg-amber/[0.07] border border-amber/20">
                  <AlertTriangle size={12} className="text-amber flex-shrink-0" />
                  <p className="text-[11px] text-amber">
                    DNA poniżej 60% — system AI działa w trybie generycznym. Uzupełnij DNA aby uzyskać spersonalizowane wyniki.
                  </p>
                </div>
              )}
            </div>

            {/* Where Company Brain works */}
            <div className="card-elevated rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-pink" />
                <p className="text-[14px] font-semibold text-fg">Gdzie działa Company Brain</p>
              </div>
              <p className="text-[11px] text-muted mb-4">
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
                    className={`flex items-start gap-3 p-3 rounded-[10px] border transition-all group hover:bg-fg/[0.04] ${
                      ready
                        ? 'border-pink/20 bg-pink/[0.03]'
                        : 'border-border-s bg-fg/[0.02] opacity-60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 mt-0.5 ${ready ? 'bg-pink/15' : 'bg-fg/[0.05]'}`}>
                      <Icon size={13} className={ready ? 'text-pink' : 'text-subtle'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-fg">{label}</p>
                        {ready
                          ? <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">AKTYWNY</span>
                          : <span className="text-[9px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">NIEKOMPLETNY</span>
                        }
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 leading-snug">{desc}</p>
                    </div>
                    <ArrowRight size={12} className="text-subtle group-hover:text-muted transition-colors mt-1 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Files list */}
            <div className="card-elevated rounded-[14px] overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-fg">Baza wiedzy — pliki kontekstowe</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {doneFiles.length} z {files.length} przetworzonych · {totalChunks} fragmentów w Vector Store
                  </p>
                </div>
                <Link href="/company-brain/files"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-pink hover:opacity-90 hover:shadow-[var(--glow-pink)] text-[12px] font-semibold transition-all"
                  style={{ color: 'var(--nav-pill-text)' }}>
                  <Zap size={12} /> Dodaj plik
                </Link>
              </div>

              {files.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Layers size={28} className="text-subtle mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-muted">Brak plików kontekstowych</p>
                  <p className="text-[11px] text-subtle mt-1 mb-4">
                    Wgraj strategie firmy, opisy usług, case studies i inne dokumenty
                  </p>
                  <Link href="/company-brain/files"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-pink/15 border border-pink/30 text-pink text-[12px] font-semibold hover:bg-pink/25 transition-all">
                    <FileText size={13} /> Dodaj pierwszy plik
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border-s">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center gap-3 px-5 py-3 hover:bg-fg/[0.03] transition-colors">
                      <StatusIcon status={file.processing_status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-fg truncate">{file.original_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CategoryBadge category={file.category} />
                          {file.processing_status === 'done' && (
                            <span className="text-[10px] text-subtle">{file.chunks_count} fragmentów</span>
                          )}
                          {file.processing_status === 'failed' && (
                            <span className="text-[10px] text-danger">Błąd przetwarzania</span>
                          )}
                          {!file.is_active && (
                            <span className="text-[10px] text-subtle italic">nieaktywny</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-subtle">
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
            <div className="card-elevated rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-fg mb-1">Status kontekstu per featura</p>
              <p className="text-[11px] text-muted mb-4">Wiedza z plików kontekstowych zasilająca każdy AI call</p>
              <div className="space-y-2">
                {FEATURE_CONTEXT.map(({ label, icon: Icon, categories }) => {
                  const count = getFeatureChunks(categories)
                  const hasDNA = completeness > 0
                  const fileCategories = doneFiles.filter(f => categories.includes(f.category) && f.is_active)
                  const ready = hasDNA && count > 0
                  const partial = hasDNA && count === 0
                  return (
                    <div key={label} className={`flex items-center gap-3 p-2.5 rounded-[8px] border transition-colors ${
                      ready ? 'bg-success/[0.04] border-success/15' :
                      partial ? 'bg-amber/[0.04] border-amber/15' :
                      'bg-fg/[0.03] border-border-s'
                    }`}>
                      <Icon size={13} className={`flex-shrink-0 ${ready ? 'text-success' : partial ? 'text-amber' : 'text-subtle'}`} />
                      <span className="flex-1 text-[12px] text-muted truncate">{label}</span>
                      <div className="flex items-center gap-2">
                        {hasDNA && (
                          <span className="text-[10px] text-success font-semibold">DNA ✓</span>
                        )}
                        {count > 0 ? (
                          <span className="text-[10px] text-pink font-semibold">{count} frag.</span>
                        ) : fileCategories.length > 0 ? (
                          <span className="text-[10px] text-amber/70">tylko DNA</span>
                        ) : (
                          <span className="text-[10px] text-subtle">brak plików</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Interview CTA */}
            {missingCount !== null && missingCount > 0 && (
              <div className="card-elevated rounded-[14px] p-4" style={{ '--card-accent': 'var(--c-pink)' } as React.CSSProperties}>
                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-pink flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-fg">
                      {missingCount} brakujących informacji
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 mb-3">
                      AI chce zadać Ci pytania aby uzupełnić DNA z bazy wiedzy
                    </p>
                    <Link href="/company-brain/dna"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-pink/15 border border-pink/30 text-pink text-[12px] font-semibold hover:bg-pink/25 transition-all">
                      <MessageSquare size={12} /> Odpowiedz na pytania AI
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card-elevated rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-fg mb-4">Statystyki bazy wiedzy</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pliki',         value: files.length,       icon: FileText,    color: 'text-info' },
                  { label: 'Przetworzone',  value: doneFiles.length,   icon: CheckCircle2,color: 'text-success' },
                  { label: 'Fragmenty',     value: totalChunks,        icon: Layers,      color: 'text-violet' },
                  { label: 'DNA Score',     value: `${completeness}%`, icon: TrendingUp,  color: 'text-pink' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-3 rounded-[10px] bg-raised border border-border text-center">
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className="text-[16px] font-bold text-fg num">{value}</p>
                    <p className="text-[9px] text-subtle uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card-elevated rounded-[14px] p-5">
              <p className="text-[14px] font-semibold text-fg mb-3">Szybkie akcje</p>
              <div className="space-y-2">
                {[
                  { href: '/company-brain/dna',  label: 'Edytuj Company DNA',   icon: Edit3,    desc: 'Uzupełnij profil firmy' },
                  { href: '/company-brain/files', label: 'Zarządzaj plikami',   icon: Layers,   desc: 'Dodaj lub zaktualizuj pliki' },
                  { href: '/company-brain/test',  label: 'Testuj kontekst AI',   icon: TestTube, desc: 'Sprawdź co widzi AI' },
                ].map(({ href, label, icon: Icon, desc }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 p-3 rounded-[10px] bg-fg/[0.03] border border-border hover:bg-fg/[0.06] hover:border-fg/[0.12] transition-all group">
                    <Icon size={14} className="text-pink flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-fg">{label}</p>
                      <p className="text-[10px] text-muted">{desc}</p>
                    </div>
                    <ArrowRight size={12} className="text-subtle group-hover:text-muted transition-colors" />
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
