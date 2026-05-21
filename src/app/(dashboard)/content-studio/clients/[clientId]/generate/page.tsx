'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Wand2, Loader2, Globe,
  Target, Image as ImageIcon, Sparkles, Check, Copy, Send,
  Calendar, FileText, RefreshCw, ChevronRight,
  Camera,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSPhoto, PostVariant } from '@/lib/content-studio/types'

function PlatformBadge({ id, size = 13 }: { id: string; size?: number }) {
  const labels: Record<string, string> = { instagram: 'IG', facebook: 'FB', linkedin: 'LI', google_business: 'GMB', all: 'ALL' }
  const colors: Record<string, string> = { instagram: '#e1306c', facebook: '#1877f2', linkedin: '#0077b5', google_business: '#4285f4', all: '#6366f1' }
  return <span style={{ fontSize: size - 3, fontWeight: 700, color: colors[id] ?? '#6366f1' }}>{labels[id] ?? id}</span>
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0077b5' },
  { id: 'google_business', label: 'Google Business', color: '#4285f4' },
] as const

const GOALS = [
  { id: 'engagement', label: 'Zaangażowanie', emoji: '💬' },
  { id: 'education', label: 'Edukacja', emoji: '📚' },
  { id: 'promotion', label: 'Promocja', emoji: '🎯' },
  { id: 'storytelling', label: 'Storytelling', emoji: '📖' },
  { id: 'social_proof', label: 'Social proof', emoji: '⭐' },
] as const

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] bg-white/[0.05] border border-white/[0.09] text-white/50 text-[11px] hover:bg-white/[0.09] hover:text-white transition-all"
    >
      {copied ? <><Check size={11} className="text-green-400" /> Skopiowano</> : <><Copy size={11} /> Kopiuj</>}
    </button>
  )
}

function IPhonePreview({ caption, hashtags, imageUrl, platform }: {
  caption: string; hashtags: string[]; imageUrl?: string; platform: string
}) {
  const platformColor = PLATFORMS.find(p => p.id === platform)?.color ?? '#6366f1'
  return (
    <div className="w-[220px] flex-shrink-0">
      <div className="rounded-[28px] bg-[#0a0a0a] border-[3px] border-white/15 overflow-hidden shadow-2xl">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2 text-[8px] text-white/60">
          <span>9:41</span><span>●●●</span>
        </div>
        {/* IG header */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06]">
          <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden flex items-center justify-center" style={{ background: platformColor }}>
            <span className="text-[8px] font-bold text-white">M</span>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-white">moja_marka</p>
            <p className="text-[7px] text-white/40">Sponsored</p>
          </div>
        </div>
        {/* Image */}
        <div className="aspect-square bg-white/[0.05] flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="post" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={28} className="text-white/15" />
          )}
        </div>
        {/* Actions row */}
        <div className="flex gap-3 px-3 py-2">
          {['♥', '💬', '↗'].map(i => <span key={i} className="text-[14px]">{i}</span>)}
        </div>
        {/* Caption */}
        <div className="px-3 pb-4">
          <p className="text-[8px] text-white/70 line-clamp-4 leading-relaxed">{caption}</p>
          {hashtags.length > 0 && (
            <p className="text-[7px] mt-1 leading-relaxed" style={{ color: platformColor }}>
              {hashtags.slice(0, 5).join(' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()

  const [photos, setPhotos] = useState<CSPhoto[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<CSPhoto | null>(null)
  const [platform, setPlatform] = useState<string>('instagram')
  const [goal, setGoal] = useState<string>('engagement')
  const [topic, setTopic] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<PostVariant[]>([])
  const [imagePrompt, setImagePrompt] = useState('')
  const [bestTime, setBestTime] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [editedCaption, setEditedCaption] = useState('')
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasBrandVoice, setHasBrandVoice] = useState(true)
  const [imageMode, setImageMode] = useState<'photo' | 'ai' | 'none'>('none')

  const load = useCallback(async () => {
    const supabase = createClient()
    const [photosRes, bvRes] = await Promise.all([
      supabase.from('cs_photos').select('*').eq('client_id', clientId).order('ai_quality_score', { ascending: false }).limit(20),
      supabase.from('cs_brand_voices').select('id').eq('client_id', clientId).single(),
    ])
    setPhotos(photosRes.data ?? [])
    setHasBrandVoice(!!bvRes.data)
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function generate() {
    setLoading(true)
    setVariants([])
    setSelectedVariant(null)
    setSavedPostId(null)

    const res = await fetch('/api/content-studio/posts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        photoId: selectedPhoto?.id ?? null,
        platform,
        postGoal: goal,
        topic: topic || undefined,
        specialInstructions: specialInstructions || undefined,
      }),
    })
    const data = await res.json()
    if (data.result) {
      setVariants(data.result.variants ?? [])
      setImagePrompt(data.result.image_prompt_suggestion ?? '')
      setBestTime(data.result.best_posting_time ?? '')
      setSavedPostId(data.postId ?? null)
    }
    setLoading(false)
  }

  function selectVariant(index: number) {
    setSelectedVariant(index)
    setEditedCaption(variants[index].caption)
  }

  async function saveAsDraft() {
    if (selectedVariant === null || !savedPostId) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('cs_posts')
      .update({
        caption: editedCaption,
        hashtags: variants[selectedVariant].hashtags,
        cta: variants[selectedVariant].cta,
        status: 'draft',
      })
      .eq('id', savedPostId)
    setSaving(false)
    router.push(`/content-studio/clients/${clientId}/posts`)
  }

  async function schedulePost() {
    if (selectedVariant === null || !savedPostId) return
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + 1)
    scheduledAt.setHours(10, 0, 0, 0)

    const supabase = createClient()
    await supabase
      .from('cs_posts')
      .update({
        caption: editedCaption,
        hashtags: variants[selectedVariant].hashtags,
        cta: variants[selectedVariant].cta,
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
      })
      .eq('id', savedPostId)

    await supabase.from('cs_calendar_slots').insert({
      client_id: clientId,
      post_id: savedPostId,
      scheduled_at: scheduledAt.toISOString(),
      platform,
    })
    router.push(`/content-studio/clients/${clientId}/posts`)
  }

  if (!hasBrandVoice) {
    return (
      <div className="max-w-[560px] p-6 rounded-[14px] bg-[#16213E] border border-amber-500/30 text-center space-y-3">
        <Wand2 size={28} className="text-amber-400 mx-auto" />
        <p className="text-[15px] font-semibold text-white">Najpierw ustaw Brand Voice</p>
        <p className="text-[12px] text-white/50">Generator potrzebuje profilu marki, aby pisać posty w Twoim stylu.</p>
        <button
          onClick={() => router.push('/content-studio/onboarding')}
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-[#6366f1] text-white text-[13px] font-semibold mx-auto hover:bg-[#5254cc] transition-all"
        >
          Przejdź do onboardingu <ChevronRight size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-white flex items-center gap-2">
            <Wand2 size={18} className="text-[#6366f1]" /> Generator postów
          </h1>
          <p className="text-[11px] text-white/40 mt-0.5">AI wygeneruje 3 warianty w stylu Twojej marki</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* ── Left: config ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Step 1 — image */}
          <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-3">
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">1 · Zdjęcie</p>
            <div className="flex gap-2">
              {(['none', 'photo', 'ai'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setImageMode(m)}
                  className={`flex-1 py-2 rounded-[9px] border text-[11px] font-medium transition-all ${
                    imageMode === m
                      ? 'bg-[#6366f1]/20 border-[#6366f1]/50 text-[#a5b4fc]'
                      : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:text-white'
                  }`}
                >
                  {m === 'none' ? 'Bez zdjęcia' : m === 'photo' ? '📷 Z galerii' : '✨ AI image'}
                </button>
              ))}
            </div>

            {imageMode === 'photo' && (
              <div>
                {photos.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]">
                    <Camera size={14} className="text-white/30" />
                    <p className="text-[11px] text-white/40">Brak zdjęć.
                      <button onClick={() => router.push(`/content-studio/clients/${clientId}/photos`)} className="ml-1 text-[#a5b4fc] underline">Wgraj zdjęcia</button>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                    {photos.map(photo => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo.id === selectedPhoto?.id ? null : photo)}
                        className={`relative aspect-square rounded-[8px] overflow-hidden border-2 transition-all ${
                          selectedPhoto?.id === photo.id ? 'border-[#6366f1]' : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url_square ?? photo.original_url} alt="" className="w-full h-full object-cover" />
                        {selectedPhoto?.id === photo.id && (
                          <div className="absolute inset-0 bg-[#6366f1]/30 flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2 — platform + goal */}
          <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-4">
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">2 · Platforma & cel</p>

            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Platforma</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-[9px] border text-[12px] font-medium transition-all ${
                      platform === p.id
                        ? 'border-white/25 text-white'
                        : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:text-white'
                    }`}
                    style={platform === p.id ? { background: `${p.color}1a`, borderColor: `${p.color}60` } : {}}
                  >
                    <PlatformBadge id={p.id} size={13} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Cel posta</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border text-[11px] font-medium transition-all ${
                      goal === g.id
                        ? 'bg-[#6366f1]/20 border-[#6366f1]/50 text-[#a5b4fc]'
                        : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:text-white'
                    }`}
                  >
                    {g.emoji} {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 — optional details */}
          <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-3">
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wide">3 · Szczegóły (opcjonalne)</p>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Temat / pomysł</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="np. nowe menu, case study klienta, tip tygodnia..."
                className="w-full px-3 py-2 rounded-[9px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[12px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Dodatkowe wskazówki</label>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                rows={2}
                placeholder="np. wspomnij o promocji na weekend..."
                className="w-full px-3 py-2 rounded-[9px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[12px] focus:outline-none focus:border-[#6366f1]/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[14px] font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> AI generuje 3 warianty...</>
            ) : (
              <><Sparkles size={16} /> Generuj posty</>
            )}
          </button>
        </div>

        {/* ── Right: preview ────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 hidden lg:block">
          <IPhonePreview
            caption={selectedVariant !== null ? (editedCaption || (variants[selectedVariant]?.caption ?? '')) : 'Wygenerowany post pojawi się tutaj...'}
            hashtags={selectedVariant !== null ? (variants[selectedVariant]?.hashtags ?? []) : []}
            imageUrl={selectedPhoto?.url_square ?? undefined}
            platform={platform}
          />
        </div>
      </div>

      {/* ── Variants ─────────────────────────────────────────────────────────── */}
      {variants.length > 0 && (
        <div className="space-y-4">
          {bestTime && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-white/[0.03] border border-white/[0.06]">
              <Calendar size={12} className="text-[#a5b4fc]" />
              <p className="text-[11px] text-white/50">Najlepszy czas publikacji: <span className="text-white/70">{bestTime}</span></p>
            </div>
          )}

          <p className="text-[13px] font-semibold text-white">3 warianty — wybierz jeden:</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {variants.map((v, i) => (
              <div
                key={i}
                className={`p-4 rounded-[14px] border transition-all cursor-pointer space-y-3 ${
                  selectedVariant === i
                    ? 'bg-[#6366f1]/10 border-[#6366f1]/50'
                    : 'bg-[#16213E] border-white/[0.07] hover:border-white/[0.15]'
                }`}
                onClick={() => selectVariant(i)}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    selectedVariant === i ? 'bg-[#6366f1]/20 text-[#a5b4fc]' : 'bg-white/[0.06] text-white/40'
                  }`}>
                    {v.angle || `Wariant ${i + 1}`}
                  </span>
                  {selectedVariant === i && <Check size={14} className="text-[#6366f1]" />}
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#a5b4fc] mb-1">Hook:</p>
                  <p className="text-[12px] text-white font-medium leading-snug">{v.hook}</p>
                </div>

                <p className="text-[11px] text-white/50 line-clamp-4 leading-relaxed">{v.caption.slice(v.hook.length).trim()}</p>

                <div className="flex flex-wrap gap-1">
                  {v.hashtags.slice(0, 4).map(h => (
                    <span key={h} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/40">{h}</span>
                  ))}
                </div>

                {v.why && <p className="text-[10px] text-white/30 italic border-t border-white/[0.06] pt-2">{v.why}</p>}
              </div>
            ))}
          </div>

          {/* Variant editor */}
          {selectedVariant !== null && (
            <div className="p-5 rounded-[14px] bg-[#16213E] border border-[#6366f1]/30 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white flex items-center gap-2">
                  <Target size={14} className="text-[#a5b4fc]" /> Edytuj wybrany wariant
                </p>
                <div className="flex gap-2">
                  <CopyBtn text={`${editedCaption}\n\n${variants[selectedVariant].hashtags.join(' ')}`} />
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] bg-white/[0.05] border border-white/[0.09] text-white/50 text-[11px] hover:bg-white/[0.09] hover:text-white transition-all"
                  >
                    <RefreshCw size={11} /> Regeneruj
                  </button>
                </div>
              </div>

              <textarea
                value={editedCaption}
                onChange={e => setEditedCaption(e.target.value)}
                rows={8}
                className="w-full px-3.5 py-3 rounded-[10px] bg-[#0F0F1A] border border-white/[0.07] text-white/80 text-[13px] leading-relaxed focus:outline-none focus:border-[#6366f1]/40 transition-all resize-none"
              />

              <div className="flex flex-wrap gap-1.5">
                {variants[selectedVariant].hashtags.map(h => (
                  <span key={h} className="px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#a5b4fc] text-[10px]">{h}</span>
                ))}
              </div>

              {variants[selectedVariant].cta && (
                <div className="flex items-center gap-2 p-2 rounded-[8px] bg-green-500/10 border border-green-500/20">
                  <Target size={11} className="text-green-400" />
                  <p className="text-[11px] text-green-300">{variants[selectedVariant].cta}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveAsDraft}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-white/[0.06] border border-white/[0.1] text-white/70 text-[12px] font-medium hover:bg-white/[0.1] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                  Zapisz szkic
                </button>
                <button
                  onClick={schedulePost}
                  className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[12px] font-medium hover:bg-[#6366f1]/25 transition-all"
                >
                  <Calendar size={12} /> Zaplanuj
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[12px] font-semibold transition-all"
                >
                  <Send size={12} /> Publikuj teraz
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
