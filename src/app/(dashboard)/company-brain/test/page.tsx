'use client'

import { useState } from 'react'
import {
  TestTube, Loader2, Brain, Layers, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { value: 'lead_scoring',       label: 'AI Scoring leadów',    hint: 'np. firma XYZ (agencja beauty), CEO Anna Kowalska' },
  { value: 'content_generator',  label: 'Generator treści',     hint: 'np. post o automatyzacji follow-upów dla agencji' },
  { value: 'offer_generator',    label: 'Generator ofert',      hint: 'np. oferta CRM dla agencji e-commerce 10 osób' },
  { value: 'outreach_generator', label: 'Outreach AI',          hint: 'np. wiadomość do CEO agencji reklamowej w Warszawie' },
  { value: 'weekly_brief',       label: 'Tygodniowy brief',     hint: 'np. przegląd wyników sprzedaży tygodniowy' },
  { value: 'hana',               label: 'Asystent HANA',        hint: 'np. klient pyta o wdrożenie systemu CRM' },
]

interface TestResult {
  context_string: string
  chunks: Array<{id: string; content: string; content_summary: string; category: string; similarity: number}>
  token_estimate: number
  dna_present: boolean
  chunks_count: number
  gaps: string[]
}

export default function ContextTesterPage() {
  const [feature, setFeature]   = useState('lead_scoring')
  const [query, setQuery]       = useState('')
  const [result, setResult]     = useState<TestResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<'context' | 'chunks' | 'gaps'>('context')
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null)

  const selectedFeature = FEATURES.find(f => f.value === feature)

  const test = async () => {
    if (!query.trim()) { toast.error('Wpisz zapytanie testowe'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/company-brain/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, query }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Błąd testu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[900px] space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <TestTube size={20} className="text-accent" /> Tester kontekstu AI
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">
          Sprawdź dokładnie co system H14 widzi gdy używasz danej featury
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-white/[0.07] rounded-[14px] p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Wybierz featurę</label>
          <select
            value={feature}
            onChange={e => setFeature(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white focus:outline-none focus:border-accent/50"
          >
            {FEATURES.map(f => <option key={f.value} value={f.value} className="bg-bg">{f.label}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Zapytanie testowe</label>
          {selectedFeature && (
            <p className="text-[11px] text-white/30 italic">Przykład: {selectedFeature.hint}</p>
          )}
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Opisz kontekst dla którego chcesz zobaczyć co AI dostanie..."
            rows={3}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
        </div>

        <button
          onClick={() => void test()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[13px] font-bold transition-all"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
          {loading ? 'Testuję…' : 'Pokaż co system widzi'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${result.dna_present ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              <Brain size={12} /> DNA: {result.dna_present ? '✓ Dostępne' : '✗ Brak'}
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${result.chunks_count > 0 ? 'bg-accent/15 text-accent' : 'bg-white/[0.07] text-white/40'}`}>
              <Layers size={12} /> {result.chunks_count} fragmentów z plików
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white/[0.07] text-white/50">
              ~{result.token_estimate} tokenów kontekstu
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-[10px] p-1">
            {(['context', 'chunks', 'gaps'] as const).map(t => (
              <button key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all ${
                  activeTab === t ? 'bg-accent text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'context' ? '📄 Kontekst AI' : t === 'chunks' ? `🔍 Fragmenty (${result.chunks_count})` : `⚠️ Braki (${result.gaps.length})`}
              </button>
            ))}
          </div>

          {/* Context tab */}
          {activeTab === 'context' && (
            <div className="bg-card border border-white/[0.07] rounded-[14px] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.07]">
                <p className="text-[13px] font-semibold text-white">Kontekst który trafi do AI</p>
                <p className="text-[11px] text-white/40">Dokładnie to co system wstrzyknie na początku prompta</p>
              </div>
              <div className="p-5">
                <pre className="text-[11px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-[500px]">
                  {result.context_string || '(brak kontekstu — uzupełnij DNA i dodaj pliki)'}
                </pre>
              </div>
            </div>
          )}

          {/* Chunks tab */}
          {activeTab === 'chunks' && (
            <div className="space-y-3">
              {result.chunks.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <Layers size={24} className="mx-auto mb-2 text-white/15" />
                  <p className="text-[13px]">Brak fragmentów — dodaj pliki kontekstowe i przetworz je</p>
                </div>
              ) : (
                result.chunks.map((chunk, i) => (
                  <div key={chunk.id} className="bg-card border border-white/[0.07] rounded-[12px] overflow-hidden">
                    <button
                      onClick={() => setExpandedChunk(expandedChunk === chunk.id ? null : chunk.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[11px] font-bold text-accent w-5 flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {chunk.content_summary && (
                          <p className="text-[12px] font-medium text-white truncate">{chunk.content_summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-white/30">{chunk.category}</span>
                          <span className="text-[10px] font-semibold text-green-400">{Math.round(chunk.similarity * 100)}% match</span>
                        </div>
                      </div>
                      {expandedChunk === chunk.id ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
                    </button>
                    {expandedChunk === chunk.id && (
                      <div className="px-4 pb-4 border-t border-white/[0.05]">
                        <pre className="text-[11px] text-white/55 font-mono leading-relaxed whitespace-pre-wrap mt-3 max-h-[300px] overflow-auto">
                          {chunk.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Gaps tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-3">
              {result.gaps.length === 0 ? (
                <div className="text-center py-8 text-green-400">
                  <Brain size={24} className="mx-auto mb-2" />
                  <p className="text-[13px]">Kontekst wygląda kompletnie — brawo!</p>
                </div>
              ) : (
                result.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-[10px] bg-amber-500/[0.07] border border-amber-500/20">
                    <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-white/70 leading-snug">{gap}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
