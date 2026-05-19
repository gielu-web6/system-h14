'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, X, Zap } from 'lucide-react'
import { useAppUser } from '@/contexts/UserContext'
import { isOnboardingCompleted, markOnboardingCompleted } from '@/lib/userStore'

const STEPS = [
  {
    emoji: '⚡',
    title: 'Twoje narzędzie sprzedażowe',
    content:
      'System H14 to Twój osobisty asystent. Pilnuje leadów, podpowiada kiedy dzwonić i pisze za Ciebie wiadomości.',
  },
  {
    emoji: '📊',
    title: 'Liczby na pamięć',
    content:
      '8.4h oszczędzone tygodniowo · 47% leadów gubi się bez follow-upu · 14 dni do wdrożenia · Pilot: 10 000 PLN · Pełne: 20–25 000 PLN',
  },
  {
    emoji: '📅',
    title: 'Twój idealny dzień',
    content:
      '8:00 Odpowiedzi Takt 2 · 9:00–10:30 Takt 1 (30–50 wiadomości) · 10:30 Aktualizacja pipeline · 11:00–15:00 Rozmowy Zoom · 16:00 Follow-upy',
  },
  {
    emoji: '🔔',
    title: 'Alerty Telegram',
    content:
      'Skonfiguruj Telegram żeby dostawać alerty gdy klient otwiera ofertę. To Twoja przewaga — dzwonisz w idealnym momencie.',
  },
]

export function OnboardingModal() {
  const { isSales } = useAppUser()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isSales && !isOnboardingCompleted()) {
      setVisible(true)
    }
  }, [isSales])

  function close() {
    markOnboardingCompleted()
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      close()
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-sidebar border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-accent/20 flex items-center justify-center">
              <Zap size={13} className="text-accent" />
            </div>
            <p className="text-[13px] font-semibold text-white">Witaj w System H14</p>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-4xl mb-4">{current.emoji}</div>
          <h2 className="text-[18px] font-bold text-white mb-3">{current.title}</h2>
          <p className="text-[13px] text-white/60 leading-relaxed">{current.content}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#6366f1]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6366f1] text-white text-[13px] font-bold hover:opacity-90 transition-colors"
          >
            {isLast ? 'Zacznij sprzedawać' : 'Dalej'}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
