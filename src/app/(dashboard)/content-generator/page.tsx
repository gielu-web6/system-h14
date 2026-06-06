'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Sparkles, Copy, Check, RefreshCw,
  Loader2, ImageIcon, Link2,
  Lightbulb, Layers, Brain, CalendarPlus,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppUser } from '@/contexts/UserContext'

type Tab = 'instagram' | 'linkedin' | 'repurpose'

interface GeneratedContent {
  title: string
  hook: string
  content_body: string
  cta: string
  hashtags: string[]
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Kopiuj' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.09] text-white/55 text-[11px] font-medium hover:bg-white/[0.09] hover:text-white transition-all"
    >
      {copied ? <><Check size={12} className="text-green-400" /> Skopiowano</> : <><Copy size={12} /> {label}</>}
    </button>
  )
}

// ─── Date picker + save to calendar ──────────────────────────────────────────

function CalendarDatePicker({
  onSelect,
  onClose,
}: {
  onSelect: (date: string) => void
  onClose: () => void
}) {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  const cells       = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const toStr = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const monthName = new Date(year, month).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0) } else setMonth(m => m+1) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[300px] bg-sidebar border border-white/[0.1] rounded-[18px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <p className="text-[13px] font-bold text-white">Wybierz datę publikacji</p>
          <button onClick={onClose} className="p-1 rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X size={14} /></button>
        </div>

        <div className="p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><ChevronLeft size={13} /></button>
            <p className="text-[12px] font-semibold text-white capitalize">{monthName}</p>
            <button onClick={nextMonth} className="p-1.5 rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><ChevronRight size={13} /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Pn','Wt','Śr','Cz','Pt','Sb','Nd'].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-white/25 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="h-8" />
              const dateStr    = toStr(day)
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selected
              return (
                <button
                  key={day}
                  onClick={() => setSelected(dateStr)}
                  className={`h-8 rounded-[6px] text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-accent text-white font-bold shadow-md shadow-indigo-500/30'
                      : isToday
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="mt-4 pt-3 border-t border-white/[0.07]">
              <p className="text-[11px] text-white/40 mb-3">
                Data: <span className="text-white font-semibold">
                  {new Date(selected + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </p>
              <button
                onClick={() => onSelect(selected)}
                className="w-full py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <CalendarPlus size={14} /> Zapisz do kalendarza
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaveToCalendarBtn({
  title, result,
}: {
  title: string
  result: GeneratedContent
}) {
  const { user } = useAppUser()
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const handleSave = async (date: string) => {
    setSaving(true)
    setShowPicker(false)
    try {
      const supabase = createClient()
      const description = [result.hook, result.content_body, result.cta, result.hashtags?.join(' ')]
        .filter(Boolean).join('\n\n').slice(0, 1000) || null
      const { error } = await supabase.from('calendar_events').insert({
        type: 'post',
        title: title || result.title || 'Post AI',
        description,
        date,
        time: null,
        created_by: user?.id ?? 'ai',
        shared: true,
        color: '#6366f1',
      })
      if (error) throw error
      setSaved(true)
      const label = new Date(date + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
      toast.success(`Zapisano na ${label}!`)
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div className="flex items-center gap-2 text-[12px] text-green-400">
      <Check size={13} /> Zapisano
      <Link href="/content-calendar" className="underline underline-offset-2 hover:text-green-300">→ Kalendarz</Link>
    </div>
  )
  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-green-500/10 border border-green-500/25 text-green-400 text-[11px] font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 size={11} className="animate-spin" /> : <CalendarPlus size={11} />}
        Zapisz do kalendarza
      </button>
      {showPicker && <CalendarDatePicker onSelect={handleSave} onClose={() => setShowPicker(false)} />}
    </>
  )
}

async function callGenerateContent(params: {
  channel: string
  content_type: string
  title: string
  slideCount?: number
  linkedinProfileUrl?: string
}): Promise<GeneratedContent> {
  const res = await fetch('/api/ai/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.result as GeneratedContent
}

// ─── Topic suggestions ────────────────────────────────────────────────────────

function TopicSuggestions({ onSelect, channel }: { onSelect: (t: string) => void; channel: 'instagram' | 'linkedin' }) {
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const data = await res.json()
      if (data.topics) {
        setTopics(data.topics)
        setLoaded(true)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (!loaded && !loading) {
    return (
      <button
        onClick={load}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-accent/10 border border-accent/25 text-accent text-[11px] font-medium hover:bg-accent/20 transition-all"
      >
        <Lightbulb size={11} /> Sugestie tematów z Bazy Wiedzy
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/40">
        <Loader2 size={11} className="animate-spin" /> Analizuję Bazę Wiedzy...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={11} className="text-accent" />
        <p className="text-[11px] text-white/50">Sugestie na podstawie Twojej Bazy Wiedzy — kliknij aby użyć:</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((t, i) => (
          <button
            key={i}
            onClick={() => onSelect(t)}
            className="px-3 py-1.5 rounded-[8px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium hover:bg-accent/20 hover:border-accent/40 transition-all text-left"
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => { setLoaded(false); setTopics([]) }}
          className="px-2 py-1.5 rounded-[8px] text-white/30 text-[11px] hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <RefreshCw size={10} />
        </button>
      </div>
    </div>
  )
}

// ─── Instagram tab ────────────────────────────────────────────────────────────

// Parse [Slajd N] blocks from generated content_body
function parseSlides(body: string): { num: number; text: string }[] {
  const parts = body.split(/\[Slajd \d+\]/).filter(s => s.trim())
  const nums  = [...body.matchAll(/\[Slajd (\d+)\]/g)].map(m => parseInt(m[1]))
  return parts.map((text, i) => ({ num: nums[i] ?? i + 1, text: text.trim() }))
}

function InstagramTab() {
  const [topic, setTopic]             = useState('')
  const [contentDesc, setContentDesc] = useState('')
  const [slideCount, setSlideCount]   = useState(7)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<GeneratedContent | null>(null)
  const [error, setError]             = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const fullTitle = [
        topic,
        contentDesc ? `\nSzczegółowa treść: ${contentDesc}` : '',
        `\nLiczba slajdów: ${slideCount}`,
      ].filter(Boolean).join('')
      const data = await callGenerateContent({
        channel: 'instagram',
        content_type: 'carousel',
        title: fullTitle,
        slideCount,
      })
      setResult(data)
    } catch (e: unknown) {
      setError((e as Error).message || 'Błąd generowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-[14px] bg-card border border-white/[0.07] space-y-4">

        {/* Topic suggestions */}
        <TopicSuggestions channel="instagram" onSelect={setTopic} />

        {/* Topic */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Temat karuzeli *
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="np. 5 błędów w zarządzaniu leadami"
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-accent/60 transition-all"
          />
        </div>

        {/* Slide count */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Liczba slajdów (obrazków) w karuzeli
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[3, 5, 7, 9, 10, 12, 15].map(n => (
              <button
                key={n}
                onClick={() => setSlideCount(n)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
                  slideCount === n
                    ? 'bg-accent text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.09]'
                }`}
              >
                <Layers size={10} /> {n}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-white/30">Każdy slajd = osobny tekst + opis grafiki</p>
        </div>

        {/* Content description */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Treść karuzeli – co ma się znaleźć?
          </label>
          <textarea
            value={contentDesc}
            onChange={e => setContentDesc(e.target.value)}
            rows={3}
            placeholder="Opisz co dokładnie ma być na slajdach – punkty, fakty, przykłady, storytelling..."
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-accent/60 transition-all resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-accent hover:opacity-90 disabled:opacity-60 text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> AI generuje karuzele ({slideCount} slajdów)...</>
          ) : (
            <><Sparkles size={15} /> Generuj karuzele {slideCount} slajdów</>
          )}
        </button>
        {error && <p className="text-[12px] text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="p-5 rounded-[14px] bg-card border border-accent/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <Sparkles size={12} className="text-accent" />
              </div>
              <p className="text-[13px] font-semibold text-white">{result.title}</p>
              <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold">{slideCount} slajdów</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-white/40 text-[11px] hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <RefreshCw size={11} /> Regeneruj
              </button>
            </div>
          </div>

          {result.hook && (
            <div className="p-3 rounded-[10px] bg-accent/10 border border-accent/30">
              <p className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-1">Hook (slajd 1)</p>
              <p className="text-[13px] text-white font-semibold leading-snug">{result.hook}</p>
            </div>
          )}

          <div className="bg-sidebar border border-white/[0.07] rounded-[10px] p-4">
            <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2">Treść karuzeli ({slideCount} slajdów)</p>
            <pre className="text-[12px] text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{result.content_body}</pre>
          </div>

          {result.cta && (
            <div className="p-3 rounded-[10px] bg-green-500/10 border border-green-500/25">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wide mb-1">CTA (ostatni slajd)</p>
              <p className="text-[12px] text-white/70">{result.cta}</p>
            </div>
          )}

          {result.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags.map(h => (
                <span key={h} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">{h}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CopyBtn
                text={[result.hook, result.content_body, result.cta, result.hashtags?.join(' ')].filter(Boolean).join('\n\n')}
                label="Kopiuj całość"
              />
              <SaveToCalendarBtn title={topic} result={result} />
            </div>
            <div className="flex items-center gap-1.5">
              <Brain size={10} className="text-[#E8A838]/60" />
              <span className="text-[10px] text-white/30">Ten output powstał na bazie DNA Twojej firmy (ton, ICP, strategia)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LinkedIn tab ─────────────────────────────────────────────────────────────

interface LinkedInSuggestion {
  topic: string
  rationale: string
}

function LinkedInTab() {
  const [topic, setTopic]             = useState('')
  const [profileUrl, setProfileUrl]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [result, setResult]           = useState<GeneratedContent | null>(null)
  const [suggestions, setSuggestions] = useState<LinkedInSuggestion[]>([])
  const [error, setError]             = useState<string | null>(null)

  const fetchSuggestions = async () => {
    if (!profileUrl.trim()) return
    setLoadingSuggestions(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/ai/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'linkedin', profileUrl: profileUrl.trim() }),
      })
      const data = await res.json()
      if (data.suggestions) setSuggestions(data.suggestions)
      else if (data.topics) setSuggestions(data.topics.map((t: string) => ({ topic: t, rationale: '' })))
    } catch {
      // silent
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const data = await callGenerateContent({
        channel: 'linkedin_personal',
        content_type: 'linkedin_post',
        title: topic,
        linkedinProfileUrl: profileUrl || undefined,
      })
      setResult(data)
    } catch (e: unknown) {
      setError((e as Error).message || 'Błąd generowania')
    } finally {
      setLoading(false)
    }
  }

  const fullText = result ? [result.hook, result.content_body, result.cta, result.hashtags?.join(' ')].filter(Boolean).join('\n\n') : ''

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-[14px] bg-card border border-white/[0.07] space-y-4">

        {/* LinkedIn profile URL */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Link do Twojego profilu LinkedIn (opcjonalne)
          </label>
          <div className="flex gap-2">
            <input
              value={profileUrl}
              onChange={e => setProfileUrl(e.target.value)}
              placeholder="linkedin.com/in/twoj-profil"
              className="flex-1 px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#3b82f6]/60 transition-all"
            />
            <button
              onClick={fetchSuggestions}
              disabled={!profileUrl.trim() || loadingSuggestions}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#93c5fd] text-[12px] font-semibold hover:bg-[#3b82f6]/25 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {loadingSuggestions ? <><Loader2 size={12} className="animate-spin" /> Analizuję...</> : <><Lightbulb size={12} /> Analizuj profil</>}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/25">AI przeanalizuje Twój profil i dopasuje tematy do Twojego języka i branży</p>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">3 proponowane tematy (na podstawie profilu + Bazy Wiedzy)</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setTopic(s.topic)}
                className="w-full text-left p-3 rounded-[10px] bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/15 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[#93c5fd] mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-[12px] font-semibold text-white group-hover:text-[#93c5fd] transition-colors">{s.topic}</p>
                    {s.rationale && <p className="text-[11px] text-white/40 mt-0.5">{s.rationale}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {suggestions.length === 0 && (
          <TopicSuggestions channel="linkedin" onSelect={setTopic} />
        )}

        {/* Topic input */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
            Temat / idea posta LinkedIn *
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="np. case study agencji która zwiększyła reply rate o 300%"
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#3b82f6]/60 transition-all"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white text-[13px] font-semibold transition-all"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Generowanie...</>
          ) : (
            <><Sparkles size={15} /> Generuj post LinkedIn</>
          )}
        </button>
        {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="p-5 rounded-[14px] bg-card border border-blue-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400" />
              <p className="text-[13px] font-semibold text-white">{result.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/30">{fullText.length} znaków</span>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-white/40 text-[11px] hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <RefreshCw size={11} /> Regeneruj
              </button>
            </div>
          </div>
          <div className="bg-sidebar border border-white/[0.07] rounded-[10px] p-4">
            <pre className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap font-sans">
              {fullText}
            </pre>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CopyBtn text={fullText} label="Kopiuj post" />
              <SaveToCalendarBtn title={topic} result={result} />
            </div>
            <div className="flex items-center gap-1.5">
              <Brain size={10} className="text-[#E8A838]/60" />
              <span className="text-[10px] text-white/30">Ten output powstał na bazie DNA Twojej firmy (ton, ICP, strategia)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Repurpose tab ────────────────────────────────────────────────────────────

const REPURPOSE_FORMATS = [
  { id: 'linkedin_post',  icon: '💼', label: 'LinkedIn Post',    channel: 'linkedin_personal', type: 'linkedin_post' },
  { id: 'instagram',      icon: '📸', label: 'Instagram Post',   channel: 'instagram',         type: 'single_post' },
  { id: 'reel_script',    icon: '🎬', label: 'Skrypt Reels',     channel: 'instagram',         type: 'reel_script' },
  { id: 'story',          icon: '⚡', label: 'Story',            channel: 'instagram',         type: 'story' },
  { id: 'newsletter',     icon: '📧', label: 'Newsletter',       channel: 'newsletter',        type: 'newsletter' },
]

function RepurposeTab() {
  const [source, setSource]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [versions, setVersions]       = useState<(GeneratedContent & { format: string; icon: string })[] | null>(null)
  const [activeVersion, setActiveVersion] = useState(0)
  const [error, setError]             = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!source.trim()) return
    setLoading(true)
    setVersions(null)
    setError(null)
    try {
      const results = await Promise.all(
        REPURPOSE_FORMATS.map(f =>
          callGenerateContent({ channel: f.channel, content_type: f.type, title: source.slice(0, 200) })
            .then(r => ({ ...r, format: f.label, icon: f.icon }))
        )
      )
      setVersions(results)
      setActiveVersion(0)
    } catch (e: unknown) {
      setError((e as Error).message || 'Błąd generowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-[14px] bg-card border border-white/[0.07]">
        <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
          Wklej istniejący post lub tekst
        </label>
        <textarea
          value={source}
          onChange={e => setSource(e.target.value)}
          rows={5}
          placeholder="Wklej tutaj swój post, artykuł lub opis tematu..."
          className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-accent/60 transition-all resize-none mb-4"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !source.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5254cc] hover:to-[#7c3aed] disabled:opacity-60 text-white text-[13px] font-semibold transition-all"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Generowanie 5 wersji...</>
          ) : (
            <><Sparkles size={15} /> Repurpose 1→5</>
          )}
        </button>
        {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
      </div>

      {versions && (
        <div className="p-5 rounded-[14px] bg-card border border-[#8b5cf6]/30 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#a78bfa]" />
            <p className="text-[13px] font-semibold text-white">5 wygenerowanych wersji</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {versions.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVersion(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                  activeVersion === i
                    ? 'bg-accent/20 border border-accent/40 text-accent'
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white'
                }`}
              >
                <span>{v.icon}</span> {v.format}
              </button>
            ))}
          </div>

          <div className="bg-sidebar border border-white/[0.07] rounded-[10px] p-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-3">
              {versions[activeVersion].icon} {versions[activeVersion].format}
            </p>
            <pre className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap font-sans">
              {[versions[activeVersion].hook, versions[activeVersion].content_body, versions[activeVersion].cta].filter(Boolean).join('\n\n')}
            </pre>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CopyBtn
                text={[versions[activeVersion].hook, versions[activeVersion].content_body, versions[activeVersion].cta, versions[activeVersion].hashtags?.join(' ')].filter(Boolean).join('\n\n')}
                label="Kopiuj wersję"
              />
              <SaveToCalendarBtn title={versions[activeVersion].title} result={versions[activeVersion]} />
            </div>
            <div className="flex items-center gap-1.5">
              <Brain size={10} className="text-[#E8A838]/60" />
              <span className="text-[10px] text-white/30">Ten output powstał na bazie DNA Twojej firmy (ton, ICP, strategia)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentGeneratorPage() {
  const [tab, setTab] = useState<Tab>('instagram')

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'instagram', label: 'Post Instagram (Karuzela)', icon: <ImageIcon size={14} /> },
    { id: 'linkedin',  label: 'Post LinkedIn',              icon: <Link2 size={14} /> },
    { id: 'repurpose', label: 'Repurposing 1→5',           icon: <RefreshCw size={14} /> },
  ]

  return (
    <div className="max-w-[1100px] space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          Generator Treści AI
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">Generuj posty, karuzele i repurposing z AI — na podstawie Twojej Bazy Wiedzy</p>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-white/[0.04] rounded-[12px] border border-white/[0.07]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
              tab === t.id
                ? 'bg-accent text-white shadow-md shadow-indigo-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'instagram' && <InstagramTab />}
      {tab === 'linkedin'  && <LinkedInTab />}
      {tab === 'repurpose' && <RepurposeTab />}
    </div>
  )
}
