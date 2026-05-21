'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Loader2, CheckCircle2, Sparkles, Building2,
  ChevronRight, ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessType } from '@/lib/content-studio/types'

const TOTAL_QUESTIONS = 12

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] = [
  { value: 'restaurant', label: 'Restauracja / kawiarnia', emoji: '🍽️' },
  { value: 'agency', label: 'Agencja / studio', emoji: '🏢' },
  { value: 'sports_club', label: 'Klub sportowy', emoji: '⚽' },
  { value: 'beauty_salon', label: 'Salon beauty', emoji: '💄' },
  { value: 'service_company', label: 'Firma usługowa', emoji: '🔧' },
  { value: 'other', label: 'Inny', emoji: '🎯' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'setup' | 'chat' | 'generating' | 'done'>('setup')

  // Setup step
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | ''>('')

  // Chat step
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [clientId, setClientId] = useState<string | null>(null)
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function startOnboarding() {
    if (!businessName.trim() || !businessType) return

    const supabase = createClient()

    // Create client record
    const { data: client, error } = await supabase
      .from('cs_clients')
      .insert({ business_name: businessName.trim(), business_type: businessType })
      .select()
      .single()

    if (error || !client) { alert('Błąd tworzenia klienta'); return }

    setClientId(client.id)

    // Create onboarding session
    await supabase.from('cs_onboarding_sessions').insert({ client_id: client.id })

    // Fetch first question
    const res = await fetch('/api/content-studio/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'first_question' }),
    })
    const data = await res.json()

    setMessages([{ role: 'assistant', content: `Witaj! Pomogę Ci stworzyć profil marki dla **${businessName}**.\n\nZacznijmy od pierwszego pytania:\n\n${data.question}` }])
    setStep('chat')
  }

  async function sendMessage() {
    if (!input.trim() || sending || !clientId) return

    const userMsg = input.trim()
    setInput('')
    setSending(true)

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)

    const updatedAnswers = { ...answers, [questionIndex]: userMsg }
    setAnswers(updatedAnswers)

    // Check if all 12 questions answered
    if (questionIndex >= TOTAL_QUESTIONS - 1) {
      // Generate brand voice
      setStep('generating')
      const res = await fetch('/api/content-studio/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_brand_voice',
          clientId,
          answers: updatedAnswers,
          businessType,
        }),
      })
      const data = await res.json()
      if (data.voiceDoc) {
        setVoiceSummary(data.voiceDoc.business_summary)
        setStep('done')
      }
      setSending(false)
      return
    }

    // Send to AI for response + decide if advance
    const res = await fetch('/api/content-studio/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        clientId,
        conversationHistory: newMessages,
        currentQuestionIndex: questionIndex,
        userMessage: userMsg,
      }),
    })
    const data = await res.json()

    let nextIndex = questionIndex
    let aiText = data.response

    if (data.shouldAdvance) {
      nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)

      const questionsRes = await fetch('/api/content-studio/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'first_question' }),
      })
      const qData = await questionsRes.json()

      if (nextIndex < TOTAL_QUESTIONS) {
        const nextQ = getQuestion(nextIndex)
        aiText = aiText ? `${aiText}\n\n**Pytanie ${nextIndex + 1} z ${TOTAL_QUESTIONS}:**\n${nextQ}` : `**Pytanie ${nextIndex + 1} z ${TOTAL_QUESTIONS}:**\n${nextQ}`
      }
    }

    setMessages(prev => [...prev, { role: 'assistant', content: aiText }])
    setSending(false)
  }

  function getQuestion(index: number): string {
    const questions = [
      'Jak nazywa się Twoja firma i czym się zajmujecie? Opisz w 2-3 zdaniach.',
      'Kim jest Wasz idealny klient? Opisz go konkretnie — wiek, co robi, co go boli.',
      'Jakie 3 słowa najlepiej opisują Wasz styl komunikacji?',
      'Jakich słów lub zwrotów NIGDY nie używacie w komunikacji?',
      'Jakie emocje chcecie wywoływać u odbiorców Waszych postów?',
      'Podaj przykład posta, który Ci się podoba — skopiuj tekst lub opisz.',
      'O czym chcecie edukować swoich klientów?',
      'Jakie są Wasze 3 największe sukcesy lub osiągnięcia?',
      'Co Was wyróżnia od konkurencji? Jedno konkretne zdanie.',
      'Jakie hashtagi używacie lub chcielibyście używać?',
      'Jak często chcecie publikować i na jakich platformach?',
      'Czy jest coś ważnego o Waszej firmie, o co nie zapytałem?',
    ]
    return questions[index] ?? ''
  }

  const progress = Math.round((questionIndex / TOTAL_QUESTIONS) * 100)

  // ── SETUP step ────────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="max-w-[560px] space-y-5">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={13} /> Wróć
          </button>
          <h1 className="text-[20px] font-bold text-white flex items-center gap-2">
            <Building2 size={20} className="text-[#6366f1]" /> Nowy klient
          </h1>
          <p className="text-[12px] text-white/40 mt-1">Podaj podstawowe info, a AI przeprowadzi Cię przez onboarding</p>
        </div>

        <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
              Nazwa firmy / marki *
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="np. Pizzeria Roma, Studio Kreatywne XYZ"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#6366f1]/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">
              Typ działalności *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map(bt => (
                <button
                  key={bt.value}
                  onClick={() => setBusinessType(bt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-[12px] font-medium transition-all text-left ${
                    businessType === bt.value
                      ? 'bg-[#6366f1]/20 border-[#6366f1]/50 text-[#a5b4fc]'
                      : 'bg-white/[0.03] border-white/[0.07] text-white/60 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <span>{bt.emoji}</span> {bt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startOnboarding}
            disabled={!businessName.trim() || !businessType}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-40 text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <ChevronRight size={15} /> Rozpocznij onboarding
          </button>
        </div>
      </div>
    )
  }

  // ── GENERATING step ────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="max-w-[560px] flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center">
          <Sparkles size={24} className="text-[#6366f1] animate-pulse" />
        </div>
        <p className="text-[16px] font-semibold text-white">Generuję profil Twojej marki...</p>
        <p className="text-[12px] text-white/40 text-center max-w-xs">
          GPT-4o analizuje Twoje odpowiedzi i tworzy szczegółowy Brand Voice Document
        </p>
        <Loader2 size={20} className="animate-spin text-[#6366f1]" />
      </div>
    )
  }

  // ── DONE step ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="max-w-[560px] space-y-5">
        <div className="p-6 rounded-[14px] bg-[#16213E] border border-green-500/30 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 size={22} className="text-green-400" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-white">Brand Voice gotowy!</p>
            <p className="text-[12px] text-white/40 mt-1">Profil marki został zapisany</p>
          </div>
          {voiceSummary && (
            <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.07] text-left">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1">Podsumowanie marki</p>
              <p className="text-[13px] text-white/70 leading-relaxed">{voiceSummary}</p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => clientId && router.push(`/content-studio/clients/${clientId}/generate`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all"
            >
              <Sparkles size={14} /> Generuj pierwszy post
            </button>
            <button
              onClick={() => clientId && router.push(`/content-studio/clients/${clientId}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white/70 text-[13px] font-medium hover:bg-white/[0.1] transition-all"
            >
              Profil klienta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CHAT step ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[640px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-white">{businessName}</h1>
          <p className="text-[11px] text-white/40">Brand Voice Onboarding</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-white/40">Pytanie {questionIndex + 1} z {TOTAL_QUESTIONS}</p>
          <div className="w-32 h-1.5 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-[#6366f1] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[420px] overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Sparkles size={10} className="text-[#6366f1]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-[14px] text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#6366f1] text-white rounded-tr-[4px]'
                  : 'bg-[#16213E] border border-white/[0.08] text-white/80 rounded-tl-[4px]'
              }`}
            >
              {msg.content.replace(/\*\*/g, '')}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center flex-shrink-0 mr-2">
              <Sparkles size={10} className="text-[#6366f1]" />
            </div>
            <div className="px-4 py-2.5 rounded-[14px] bg-[#16213E] border border-white/[0.08]">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Twoja odpowiedź..."
          disabled={sending}
          className="flex-1 px-3.5 py-2.5 rounded-[10px] bg-[#16213E] border border-white/[0.08] text-white placeholder:text-white/25 text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-40 flex items-center justify-center transition-all"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  )
}
