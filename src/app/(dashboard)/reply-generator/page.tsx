'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Bot, Copy, Check, Loader2, ChevronDown, ChevronUp,
  Upload, X, Target, Lightbulb, ArrowRight, User, Image as ImageIcon, Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, isSalesUser, getCurrentUser } from '@/lib/userStore'
import toast from 'react-hot-toast'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  firstName: string
  lastName: string
  company: string
  position: string
}

interface GeneratedResult {
  reply: string
  strategy: string
  cta: string
  next_step: string
}

const GOALS = [
  { id: 'call',    label: 'Umów rozmowę',    desc: 'Telefon lub video call' },
  { id: 'demo',    label: 'Demo produktu',   desc: 'Pokaż jak to działa' },
  { id: 'offer',   label: 'Wyślij ofertę',   desc: 'Propozycja współpracy' },
  { id: 'nurture', label: 'Buduj relację',   desc: 'Bądź na radarze' },
]

const DEMO_LEADS: Lead[] = [
  { id: '1', firstName: 'Anna', lastName: 'Kowalska', company: 'MediaFlow', position: 'CEO' },
  { id: '2', firstName: 'Piotr', lastName: 'Nowak', company: 'TechBridge', position: 'Head of Marketing' },
]

const inputCls = `w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
  text-white placeholder:text-white/25 text-[13px]
  focus:outline-none focus:border-[#6366f1]/60 focus:bg-[#6366f1]/[0.03]
  transition-all resize-none`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReplyGeneratorPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSearch, setLeadSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadDropdown, setShowLeadDropdown] = useState(false)
  const leadRef = useRef<HTMLDivElement>(null)
  const [receivedMessage, setReceivedMessage] = useState('')
  const [conversationContext, setConversationContext] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [goal, setGoal] = useState<string>('call')
  const [image, setImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [copiedReply, setCopiedReply] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Close lead dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (leadRef.current && !leadRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (isDemoMode()) {
      setLeads(DEMO_LEADS)
      return
    }
    async function loadLeads() {
      const supabase = createClient()
      const currentUser = getCurrentUser()
      const salesOnly = isSalesUser() && !!currentUser
      const q = salesOnly
        ? supabase.from('leads').select('id, first_name, last_name, company, position').eq('assigned_to', currentUser!.id).order('ai_score_num', { ascending: false }).limit(50)
        : supabase.from('leads').select('id, first_name, last_name, company, position').order('ai_score_num', { ascending: false }).limit(50)
      const { data } = await q
      if (data) {
        setLeads(data.map(r => ({
          id: r.id as string,
          firstName: (r.first_name as string) ?? '',
          lastName:  (r.last_name  as string) ?? '',
          company:   (r.company    as string) ?? '',
          position:  (r.position   as string) ?? '',
        })))
      }
    }
    loadLeads()
  }, [])

  const filteredLeads = leadSearch.trim().length > 0
    ? leads.filter(l =>
        `${l.firstName} ${l.lastName} ${l.company} ${l.position}`
          .toLowerCase()
          .includes(leadSearch.toLowerCase())
      ).slice(0, 8)
    : leads.slice(0, 8)

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Wgraj plik graficzny (PNG, JPG, WEBP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Plik za duży — maks. 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      setImage(e.target?.result as string)
      setImageName(file.name)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
  }, [handleImageUpload])

  const canGenerate = (receivedMessage.trim().length > 5 || image) && !generating

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = { goal }
      if (receivedMessage.trim()) body.receivedMessage = receivedMessage.trim()
      if (conversationContext.trim()) body.conversationContext = conversationContext.trim()
      if (image) body.imageBase64 = image
      if (selectedLead) {
        body.leadContext = {
          firstName: selectedLead.firstName,
          lastName:  selectedLead.lastName,
          company:   selectedLead.company,
          position:  selectedLead.position,
        }
      }
      const res = await fetch('/api/ai/reply-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data?.result) {
        setResult(data.result)
      } else {
        toast.error(data?.error ?? 'Coś poszło nie tak')
      }
    } catch {
      toast.error('Błąd połączenia z AI')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.reply) return
    await navigator.clipboard.writeText(result.reply)
    setCopiedReply(true)
    setTimeout(() => setCopiedReply(false), 2000)
  }

  return (
    <div className="max-w-[760px] space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
          <Bot size={20} className="text-[#6366f1]" />
          AI Reply Generator
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5">
          Wklej wiadomość z LinkedIn lub wgraj screenshota — AI sugeruje odpowiedź na podstawie Company Brain.
        </p>
      </div>

      {/* Lead selector */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-[#6366f1]" />
          <span className="text-[13px] font-semibold text-white">Rozmówca z pipeline</span>
          <span className="text-[11px] text-white/30 ml-1">(opcjonalnie)</span>
        </div>

        {selectedLead ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-[#6366f1]/[0.07] border border-[#6366f1]/25">
            <div className="w-8 h-8 rounded-[8px] bg-[#6366f1]/20 flex items-center justify-center text-[11px] font-bold text-[#6366f1] flex-shrink-0">
              {selectedLead.firstName[0]}{selectedLead.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white">{selectedLead.firstName} {selectedLead.lastName}</p>
              <p className="text-[11px] text-white/40">{selectedLead.company} · {selectedLead.position}</p>
            </div>
            <button
              onClick={() => { setSelectedLead(null); setLeadSearch('') }}
              className="p-1 rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.08] transition-all flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div ref={leadRef} className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={leadSearch}
              onChange={e => { setLeadSearch(e.target.value); setShowLeadDropdown(true) }}
              onFocus={() => setShowLeadDropdown(true)}
              placeholder="Wyszukaj lead — imię, firma, stanowisko…"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#6366f1]/60 focus:bg-[#6366f1]/[0.03] transition-all"
            />
            {showLeadDropdown && filteredLeads.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0F0F1A] border border-white/[0.1] rounded-[10px] overflow-hidden z-20 shadow-xl">
                {filteredLeads.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onMouseDown={() => { setSelectedLead(l); setLeadSearch(''); setShowLeadDropdown(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-[8px] bg-[#6366f1]/15 flex items-center justify-center text-[10px] font-bold text-[#6366f1] flex-shrink-0">
                      {l.firstName[0]}{l.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{l.firstName} {l.lastName}</p>
                      <p className="text-[10px] text-white/40 truncate">{l.company} · {l.position}</p>
                    </div>
                  </button>
                ))}
                {leads.length === 0 && (
                  <p className="px-3 py-3 text-[12px] text-white/30">Brak leadów w bazie</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5 space-y-4">
        <p className="text-[13px] font-semibold text-white">Wiadomość od rozmówcy</p>

        {/* Text paste */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
            Wklej treść wiadomości
          </label>
          <textarea
            className={inputCls}
            rows={4}
            placeholder={`np. "Cześć, widziałem Twój post o automatyzacjach. Ciekawe. Jak to działa w praktyce dla agencji takich jak moja?"`}
            value={receivedMessage}
            onChange={e => setReceivedMessage(e.target.value)}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] text-white/25">lub</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Image upload */}
        {!image ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-[10px] border border-dashed border-white/10 hover:border-[#6366f1]/40 hover:bg-[#6366f1]/[0.03] transition-all cursor-pointer"
          >
            <Upload size={20} className="text-white/20" />
            <p className="text-[12px] text-white/30">Wgraj screenshota konwersacji</p>
            <p className="text-[10px] text-white/20">PNG, JPG, WEBP · maks. 5 MB · przeciągnij lub kliknij</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="relative rounded-[10px] overflow-hidden border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="screenshot" className="w-full max-h-48 object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end justify-between px-3 py-2">
              <div className="flex items-center gap-1.5">
                <ImageIcon size={12} className="text-white/60" />
                <span className="text-[11px] text-white/60">{imageName}</span>
              </div>
              <button
                onClick={() => { setImage(null); setImageName('') }}
                className="p-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Conversation context (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowContext(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors"
          >
            {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Dodaj kontekst poprzednich wiadomości (opcjonalnie)
          </button>
          {showContext && (
            <textarea
              className={inputCls + ' mt-2'}
              rows={3}
              placeholder="np. Wysłałem/am zaproszenie tydzień temu. Zaakceptował. To jest jego pierwsza odpowiedź po moim DM o automatyzacjach..."
              value={conversationContext}
              onChange={e => setConversationContext(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Goal selector */}
      <div className="bg-[#16213E] border border-white/[0.07] rounded-[14px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-[#6366f1]" />
          <span className="text-[13px] font-semibold text-white">Cel tej rozmowy</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GOALS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGoal(g.id)}
              className={`flex flex-col items-start px-3 py-2.5 rounded-[10px] border text-left transition-all ${
                goal === g.id
                  ? 'bg-[#6366f1]/15 border-[#6366f1]/40 text-white'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <span className="text-[12px] font-semibold">{g.label}</span>
              <span className={`text-[10px] mt-0.5 ${goal === g.id ? 'text-[#a5b4fc]' : 'text-white/25'}`}>{g.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[12px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
      >
        {generating
          ? <><Loader2 size={16} className="animate-spin" /> Generuję odpowiedź…</>
          : <><Bot size={16} /> Generuj odpowiedź AI</>
        }
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">

          {/* Reply */}
          <div className="bg-[#16213E] border border-[#6366f1]/25 rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Sugerowana odpowiedź</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white/[0.06] border border-white/[0.1] text-white/50 text-[11px] hover:text-white hover:bg-white/[0.1] transition-all"
              >
                {copiedReply
                  ? <><Check size={11} className="text-green-400" /> Skopiowano</>
                  : <><Copy size={11} /> Kopiuj</>
                }
              </button>
            </div>
            <p className="text-[14px] text-white leading-relaxed bg-[#0F0F1A] p-4 rounded-[10px] border border-white/[0.06] whitespace-pre-wrap">
              {result.reply}
            </p>
            {result.cta && (
              <div className="mt-3 flex items-start gap-2">
                <ArrowRight size={13} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#a5b4fc]">
                  <span className="font-semibold">CTA:</span> {result.cta}
                </p>
              </div>
            )}
          </div>

          {/* Strategy + Next step */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.strategy && (
              <div className="bg-[#16213E] border border-white/[0.07] rounded-[12px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-400" />
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Taktyka</span>
                </div>
                <p className="text-[12px] text-white/65 leading-relaxed">{result.strategy}</p>
              </div>
            )}
            {result.next_step && (
              <div className="bg-[#16213E] border border-white/[0.07] rounded-[12px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight size={13} className="text-green-400" />
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Co dalej?</span>
                </div>
                <p className="text-[12px] text-white/65 leading-relaxed">{result.next_step}</p>
              </div>
            )}
          </div>

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <Bot size={13} /> Generuj inną wersję
          </button>
        </div>
      )}
    </div>
  )
}
