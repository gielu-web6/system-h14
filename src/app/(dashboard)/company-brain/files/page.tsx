'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Layers, Plus, Trash2, CheckCircle2, Clock, XCircle, Loader2,
  RefreshCw, FileText, Eye, EyeOff, ChevronDown, ChevronUp,
  Play, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContextFile {
  id: string
  original_name: string
  file_type: string
  category: string
  description: string | null
  priority: number
  is_active: boolean
  processing_status: 'pending' | 'processing' | 'done' | 'failed'
  processing_error: string | null
  chunks_count: number
  processed_at: string | null
  created_at: string
  summary: string | null
  key_facts: string[]
}

const CATEGORIES = [
  { value: 'strategia_firmy',      label: 'Strategia firmy' },
  { value: 'opis_uslug',           label: 'Opis usług' },
  { value: 'strategia_sprzedazy',  label: 'Strategia sprzedaży' },
  { value: 'strategia_marketingu', label: 'Strategia marketingu' },
  { value: 'case_studies',         label: 'Case studies' },
  { value: 'cennik',               label: 'Cennik' },
  { value: 'konkurencja',          label: 'Analiza konkurencji' },
  { value: 'icp_profil',           label: 'Profil ICP' },
  { value: 'szablony',             label: 'Szablony wiadomości' },
  { value: 'finanse',              label: 'Finanse i cele' },
  { value: 'inne',                 label: 'Inne' },
]

const CATEGORY_COLORS: Record<string, string> = {
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

function StatusIcon({ status }: { status: ContextFile['processing_status'] }) {
  if (status === 'done')       return <CheckCircle2 size={14} className="text-green-400" />
  if (status === 'processing') return <Loader2 size={14} className="text-blue-400 animate-spin" />
  if (status === 'failed')     return <XCircle size={14} className="text-red-400" />
  return <Clock size={14} className="text-white/30" />
}

const PRIORITY_LABELS = ['', 'Uzupełniający', 'Ważny', 'Ważny+', 'Kluczowy', 'Zawsze wczytuj']

// ─── Add file form ────────────────────────────────────────────────────────────

function AddFileForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName]         = useState('')
  const [category, setCategory] = useState('strategia_firmy')
  const [description, setDesc]  = useState('')
  const [priority, setPriority] = useState(3)
  const [rawText, setRawText]   = useState('')
  const [saving, setSaving]     = useState(false)

  const submit = async () => {
    if (!name.trim()) { toast.error('Podaj nazwę'); return }
    if (!rawText.trim()) { toast.error('Wklej treść pliku'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/company-brain/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_name: name.trim(),
          file_type: 'text',
          category,
          description: description.trim() || null,
          priority,
          raw_text: rawText.trim(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { file } = await res.json()
      toast.success('Plik dodany — kliknij "Przetwórz" aby wygenerować embeddingi')
      setName(''); setCategory('strategia_firmy'); setDesc(''); setPriority(3); setRawText(''); setOpen(false)

      // Auto-process
      fetch(`/api/company-brain/files/${file.id}/process`, { method: 'POST' })
        .then(() => onAdded())
        .catch(() => {})
      onAdded()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Błąd dodawania pliku')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-accent" />
          <span className="text-[14px] font-semibold text-white">Dodaj nowy plik kontekstowy</span>
        </div>
        {open ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06]">
          <div className="mt-4 p-3 rounded-[8px] bg-[#6366f1]/[0.07] border border-accent/20">
            <p className="text-[11px] text-accent">
              💡 <strong>Wskazówka:</strong> Wklej treść dokumentu (strategię firmy, case study, cennik, itp.). Im lepiej opisany dokument, tym trafniejszy kontekst AI. Priorytet 5 = zawsze wczytywany.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Nazwa pliku *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="np. strategia_sprzedazy_2025.md"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Kategoria *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white focus:outline-none focus:border-accent/50">
                {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-bg">{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Opis (opcjonalny)</label>
            <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Co zawiera ten plik..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">
              Priorytet: {PRIORITY_LABELS[priority]} ({priority}/5)
            </label>
            <input type="range" min={1} max={5} value={priority} onChange={e => setPriority(parseInt(e.target.value))}
              className="w-full accent-[#6366f1]" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Treść pliku * (wklej zawartość)</label>
            <textarea value={rawText} onChange={e => setRawText(e.target.value)}
              placeholder="Wklej tutaj pełną treść dokumentu — strategię, case study, cennik, opisy usług itp."
              rows={10}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors resize-y font-mono" />
            <p className="text-[10px] text-white/25">{rawText.length} znaków · ~{Math.round(rawText.length / 3)} tokenów</p>
          </div>

          <button
            onClick={() => void submit()}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[13px] font-bold transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Dodaję i przetwarzam…' : 'Dodaj i przetwórz plik'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── File card ────────────────────────────────────────────────────────────────

function FileCard({ file, onUpdate, onDelete, onProcess }: {
  file: ContextFile
  onUpdate: (id: string, updates: Partial<ContextFile>) => void
  onDelete: (id: string) => void
  onProcess: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [processing, setProcessing] = useState(file.processing_status === 'processing')

  const toggleActive = async () => {
    const next = !file.is_active
    onUpdate(file.id, { is_active: next })
    await fetch(`/api/company-brain/files/${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    })
  }

  const handleDelete = async () => {
    if (!confirm(`Usunąć "${file.original_name}"? Spowoduje to usunięcie wszystkich chunków.`)) return
    await fetch(`/api/company-brain/files/${file.id}`, { method: 'DELETE' })
    onDelete(file.id)
    toast.success('Plik usunięty')
  }

  const handleProcess = async () => {
    setProcessing(true)
    onUpdate(file.id, { processing_status: 'processing' })
    onProcess(file.id)
    try {
      const res = await fetch(`/api/company-brain/files/${file.id}/process`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(file.id, { processing_status: 'done', chunks_count: data.chunks })
      toast.success(`Przetworzono — ${data.chunks} fragmentów wygenerowanych`)
    } catch (err: unknown) {
      onUpdate(file.id, { processing_status: 'failed', processing_error: (err as Error).message })
      toast.error(`Błąd przetwarzania: ${(err as Error).message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusIcon status={processing ? 'processing' : file.processing_status} />

        <button onClick={() => setExpanded(e => !e)} className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-medium text-white truncate">{file.original_name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[file.category] ?? 'bg-white/10 text-white/40'}`}>
              {CATEGORIES.find(c => c.value === file.category)?.label ?? file.category}
            </span>
            {file.processing_status === 'done' && (
              <span className="text-[10px] text-white/30">{file.chunks_count} fragmentów</span>
            )}
            {file.processing_status === 'failed' && (
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertCircle size={9} /> {file.processing_error?.slice(0, 50) ?? 'Błąd'}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/[0.04]">P{file.priority}</span>

          <button onClick={() => void toggleActive()} title={file.is_active ? 'Dezaktywuj' : 'Aktywuj'}
            className={`p-1.5 rounded-[6px] transition-colors ${file.is_active ? 'text-green-400 hover:text-white' : 'text-white/20 hover:text-white/50'}`}>
            {file.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {(file.processing_status === 'pending' || file.processing_status === 'failed') && (
            <button onClick={() => void handleProcess()} title="Przetwórz"
              className="p-1.5 rounded-[6px] text-accent hover:text-white hover:bg-accent/20 transition-colors">
              <Play size={13} />
            </button>
          )}

          {file.processing_status === 'done' && (
            <button onClick={() => void handleProcess()} title="Przetworz ponownie"
              className="p-1.5 rounded-[6px] text-white/20 hover:text-accent transition-colors">
              <RefreshCw size={13} />
            </button>
          )}

          <button onClick={() => void handleDelete()} title="Usuń"
            className="p-1.5 rounded-[6px] text-white/20 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>

          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-white/20 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] space-y-3">
          {file.description && (
            <p className="text-[12px] text-white/50 italic">{file.description}</p>
          )}
          {file.summary && (
            <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">AI Podsumowanie</p>
              <p className="text-[12px] text-white/65 leading-snug">{file.summary}</p>
            </div>
          )}
          {file.key_facts && file.key_facts.length > 0 && (
            <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Kluczowe fakty</p>
              <ul className="space-y-1">
                {(file.key_facts as string[]).map((f, i) => (
                  <li key={i} className="text-[11px] text-white/55 flex items-start gap-1.5">
                    <span className="text-accent flex-shrink-0 mt-0.5">·</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-white/20 text-right">
            Dodano: {new Date(file.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
            {file.processed_at && ` · Przetworzone: ${new Date(file.processed_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}`}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FilesPage() {
  const [files, setFiles]   = useState<ContextFile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/company-brain/files')
      const { files: f } = await res.json()
      setFiles(f ?? [])
    } catch {
      toast.error('Błąd ładowania plików')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const updateFile = (id: string, updates: Partial<ContextFile>) =>
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))

  const deleteFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id))

  const done  = files.filter(f => f.processing_status === 'done').length
  const total = files.length
  const chunks = files.reduce((s, f) => s + f.chunks_count, 0)

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-accent" /> Pliki kontekstowe
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            {done}/{total} przetworzonych · {chunks} fragmentów w Vector Store
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white transition-all" title="Odśwież">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Suggested files hint */}
      <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[12px] font-semibold text-white/50 mb-2">Rekomendowane pliki do wgrania:</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            'Strategia firmy / misja / wartości',
            'Szczegółowe opisy usług z cennikiem',
            'Profil idealnego klienta (ICP)',
            'Case studies z wynikami liczbowymi',
            'Strategia sprzedaży + skrypty',
            'Strategia contentu + przykłady postów',
            'Bank objekcji + najlepsze odpowiedzi',
            'Analiza konkurencji',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[11px] text-white/35">
              <FileText size={10} className="text-white/25 flex-shrink-0" />{item}
            </div>
          ))}
        </div>
      </div>

      <AddFileForm onAdded={load} />

      {loading ? (
        <div className="flex items-center gap-3 p-4">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-[13px] text-white/40">Ładowanie plików…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.length === 0 && (
            <div className="text-center py-8 text-white/30">
              <Layers size={28} className="mx-auto mb-2 text-white/15" />
              <p className="text-[13px]">Brak plików — dodaj pierwszy dokument powyżej</p>
            </div>
          )}
          {files.map(file => (
            <FileCard
              key={file.id}
              file={file}
              onUpdate={updateFile}
              onDelete={deleteFile}
              onProcess={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
