'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PIPELINE_STAGES } from '@/lib/constants'
import type { Deal, PipelineStage } from '@/types'

interface NewDealModalProps {
  onConfirm: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => Promise<Deal | null>
  onClose: () => void
}

export function NewDealModal({ onConfirm, onClose }: NewDealModalProps) {
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<PipelineStage>('nowy_lead')
  const [projectType, setProjectType] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const activeStages = PIPELINE_STAGES.filter((s) =>
    ['nowy_lead', 'dm_wyslany', 'odpowiedz', 'rozmowa_umowiona', 'diagnoza_zrobiona', 'oferta_prezentowana', 'negocjacje'].includes(s.value)
  )

  const numValue = value.trim() ? parseFloat(value.replace(/\s/g, '').replace(',', '.')) : undefined
  const valid = title.trim().length > 0

  const handleSubmit = async () => {
    if (!valid || loading) return
    setLoading(true)
    await onConfirm({
      title: title.trim(),
      value: numValue && !isNaN(numValue) ? numValue : undefined,
      currency: 'PLN',
      stage,
      project_type: projectType.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#16213E] border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <PlusCircle size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Nowy deal</h2>
            <p className="text-xs text-white/40">Dodaj deal do pipeline</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Tytuł / nazwa klienta <span className="text-accent">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Jan Kowalski – Automatyzacja procesów"
              autoFocus
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Wartość (PLN)</label>
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="np. 5000"
                className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Etap</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {activeStages.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Typ projektu</label>
            <input
              type="text"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="np. Chatbot, Automatyzacja, Lead Gen..."
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/25"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Notatki (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodatkowe informacje o dealu..."
              rows={2}
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            className="flex-1"
            disabled={!valid}
            loading={loading}
            onClick={handleSubmit}
          >
            Dodaj deal
          </Button>
        </div>
      </div>
    </div>
  )
}
