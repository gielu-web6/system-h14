'use client'

import { useState } from 'react'
import {
  Bot, Copy, Check, Loader2, Edit3, Save, X, MessageSquare, Zap, AlertCircle, Brain,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CATEGORY_CONFIG, type ReplyCategory } from '@/lib/ai/reply-tactics'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReplyVariant {
  expert: string
  name: string
  description: string
  message: string | null
  isSilence: boolean
}

interface GenerateResult {
  classification: ReplyCategory
  classificationReason: string
  replies: ReplyVariant[]
  _demo?: boolean
  _brainUsed?: boolean
}

const inputCls = `w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08]
  text-white placeholder:text-white/25 text-[13px]
  focus:outline-none focus:border-accent/50 focus:bg-[#6366f1]/[0.02]
  transition-all resize-none`

// ─── Classification Badge ──────────────────────────────────────────────────────

function ClassificationBadge({ category, reason }: { category: ReplyCategory; reason: string }) {
  const cfg = CATEGORY_CONFIG[category]
  if (!cfg) return null
  return (
    <div
      className="flex flex-col gap-1.5 px-4 py-3 rounded-[12px] border"
      style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[16px]">{cfg.emoji}</span>
        <span className="text-[13px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      {reason && (
        <p className="text-[12px] text-white/55 leading-relaxed">{reason}</p>
      )}
    </div>
  )
}

// ─── Reply Card ────────────────────────────────────────────────────────────────

function ReplyCard({ reply, index }: { reply: ReplyVariant; index: number }) {
  const [copied, setCopied]       = useState(false)
  const [editing, setEditing]     = useState(false)
  const [editText, setEditText]   = useState('')
  const [savedText, setSavedText] = useState<string | null>(null)

  const displayMessage = savedText ?? reply.message ?? ''

  if (reply.isSilence) {
    return (
      <div className="rounded-[14px] bg-card border border-border p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/30">
            {index + 1}
          </span>
          <span className="text-[12px] font-semibold text-white/50">{reply.name}</span>
        </div>
        <p className="text-[12px] text-white/35 italic leading-relaxed">{reply.description}</p>
        <div className="px-4 py-3 rounded-[10px] bg-white/[0.03] border border-dashed border-white/[0.08] text-[12px] text-white/30 text-center">
          Sugestia: nie odpowiadaj na tę wiadomość
        </div>
      </div>
    )
  }

  const startEdit = () => {
    setEditText(displayMessage)
    setEditing(true)
  }

  const saveEdit = () => {
    setSavedText(editText)
    setEditing(false)
  }

  const handleCopy = async () => {
    const text = editing ? editText : displayMessage
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-[14px] bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-border">
        <span className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-bold text-white">{reply.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] text-accent font-medium">
              {reply.expert}
            </span>
          </div>
          <p className="text-[11px] text-white/35 italic mt-0.5 leading-relaxed">{reply.description}</p>
        </div>
      </div>

      {/* Message */}
      <div className="p-4">
        {!reply.message ? (
          <div className="flex items-center gap-2 justify-center py-5 text-white/25 text-[12px]">
            <Loader2 size={13} className="animate-spin" /> Generuję…
          </div>
        ) : editing ? (
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2.5 rounded-[8px] bg-raised border border-border text-[13px] text-white/85 leading-relaxed resize-none focus:outline-none focus:border-accent/40 font-mono text-[12px]"
            autoFocus
          />
        ) : (
          <pre className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap font-sans bg-raised p-3 rounded-[8px] border border-border">
            {displayMessage}
          </pre>
        )}
      </div>

      {/* Actions */}
      {displayMessage && (
        <div className="px-4 pb-4 flex items-center gap-2 justify-end">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] hover:text-white transition-all"
              >
                <X size={11} /> Anuluj
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-accent/10 border border-accent/30 text-accent text-[11px] hover:bg-accent/20 transition-all"
              >
                <Save size={11} /> Zapisz
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <Edit3 size={11} /> Edytuj
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/[0.05] border border-white/[0.1] text-white/50 text-[11px] hover:text-white hover:bg-white/[0.1] transition-all"
              >
                {copied
                  ? <><Check size={11} className="text-green-400" /> Skopiowano</>
                  : <><Copy size={11} /> Kopiuj</>
                }
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReplyGeneratorPage() {
  const [originalMessage, setOriginalMessage]   = useState('')
  const [prospectReply, setProspectReply]       = useState('')
  const [daysSinceSent, setDaysSinceSent]       = useState('')
  const [showOriginal, setShowOriginal]         = useState(false)

  const [classifying, setClassifying]           = useState(false)
  const [result, setResult]                     = useState<GenerateResult | null>(null)

  const canGenerate = prospectReply.trim().length >= 10 && !classifying

  const handleGenerate = async () => {
    if (!canGenerate) return
    setClassifying(true)
    setResult(null)
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessage: originalMessage.trim() || undefined,
          prospectReply: prospectReply.trim(),
          daysSinceSent: daysSinceSent.trim() ? parseInt(daysSinceSent.trim(), 10) : undefined,
        }),
      })
      const data = await res.json()
      if (data.classification) {
        setResult(data)
      } else {
        toast.error(data.error ?? 'Błąd generowania')
      }
    } catch {
      toast.error('Błąd połączenia z AI')
    } finally {
      setClassifying(false)
    }
  }

  return (
    <div className="max-w-[860px] space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white flex items-center gap-2.5">
          <Bot size={20} className="text-accent" />
          Reply Generator
        </h1>
        <p className="text-[12px] text-white/40 mt-1">
          Wklej odpowiedź od prospekta — AI sklasyfikuje ją i wygeneruje 3 taktyczne repliki.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-[16px] p-6 space-y-5">

        {/* Prospect reply */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
            Odpowiedź od prospekta <span className="text-accent">*</span>
          </label>
          <textarea
            className={inputCls}
            rows={4}
            placeholder={`np. "Cześć, teraz jest ciężki moment, wróćmy do tematu po nowym roku. Może coś się ułoży."`}
            value={prospectReply}
            onChange={e => setProspectReply(e.target.value)}
          />
        </div>

        {/* Optional: original message */}
        <div>
          <button
            type="button"
            onClick={() => setShowOriginal(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors"
          >
            <MessageSquare size={11} />
            {showOriginal ? 'Ukryj' : 'Dodaj'} oryginalną wiadomość którą wysłałeś (opcjonalnie — daje kontekst)
          </button>
          {showOriginal && (
            <textarea
              className={inputCls + ' mt-2'}
              rows={3}
              placeholder="np. Wiadomość którą wysłałeś jako pierwszą — AI użyje jej jako kontekst"
              value={originalMessage}
              onChange={e => setOriginalMessage(e.target.value)}
            />
          )}
        </div>

        {/* Days since sent */}
        <div className="max-w-[200px]">
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
            Dni od pierwszej wiadomości
          </label>
          <input
            type="number"
            min="0"
            max="365"
            className={inputCls}
            placeholder="np. 3"
            value={daysSinceSent}
            onChange={e => setDaysSinceSent(e.target.value)}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-[12px] bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-bold transition-all shadow-lg shadow-accent/15"
        >
          {classifying
            ? <><Loader2 size={16} className="animate-spin" /> Analizuję i generuję repliki…</>
            : <><Zap size={16} /> Analizuj i generuj 3 repliki</>
          }
        </button>
      </div>

      {/* Loading state */}
      {classifying && (
        <div className="flex flex-col items-center gap-3 py-8 bg-card border border-border rounded-[14px]">
          <Loader2 size={20} className="animate-spin text-accent" />
          <p className="text-[13px] text-white/40">Klasyfikuję odpowiedź i dobieriam taktyki…</p>
        </div>
      )}

      {/* Results */}
      {result && !classifying && (
        <div className="space-y-4">

          {/* Demo banner */}
          {result._demo && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[12px]">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>Tryb demo — repliki są przykładowe. Dodaj <code className="bg-white/10 px-1 py-0.5 rounded text-[11px]">OPENAI_API_KEY</code> aby generować spersonalizowane odpowiedzi.</span>
            </div>
          )}

          {/* Classification */}
          <ClassificationBadge
            category={result.classification}
            reason={result.classificationReason}
          />

          {/* Reply cards */}
          <div className="space-y-3">
            {result.replies.map((reply, i) => (
              <ReplyCard key={i} reply={reply} index={i} />
            ))}
          </div>

          {/* Brain attribution */}
          {!result._demo && (
            <div className="flex items-center gap-1.5 px-1">
              <Brain size={10} className={result._brainUsed ? 'text-[#E8A838]/60' : 'text-white/20'} />
              <span className="text-[10px] text-white/30">
                {result._brainUsed
                  ? 'Ten output powstał na bazie DNA Twojej firmy (ton, ICP, strategia)'
                  : 'Wygenerowano bez kontekstu Company Brain'}
              </span>
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={classifying}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <Bot size={13} /> Generuj inne warianty
          </button>
        </div>
      )}
    </div>
  )
}
