'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Upload, Loader2, Camera, CheckCircle2, Star, X,
  Filter, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSPhoto } from '@/lib/content-studio/types'

const MOOD_COLORS: Record<string, string> = {
  warm: '#f97316', cool: '#60a5fa', energetic: '#f59e0b',
  calm: '#22c55e', luxurious: '#a78bfa', playful: '#ec4899', professional: '#6366f1',
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Jedzenie', product: 'Produkt', team: 'Zespół',
  interior: 'Wnętrze', event: 'Event', behind_scenes: 'Behind scenes',
  lifestyle: 'Lifestyle', promotional: 'Promo',
}

export default function PhotosPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [photos, setPhotos] = useState<CSPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('cs_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function handleFileUpload(files: FileList) {
    if (!files.length) return
    setUploading(true)

    for (const file of Array.from(files)) {
      // Upload to Supabase Storage (direct upload as URL for AI analysis)
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `cs-photos/${clientId}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-studio')
        .upload(path, file, { upsert: true })

      if (uploadError) continue

      const { data: urlData } = supabase.storage.from('content-studio').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      // Add temp photo to UI
      const tempId = `temp-${Date.now()}`
      setAnalyzing(prev => [...prev, tempId])

      // Analyze with AI
      const res = await fetch('/api/content-studio/photos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl, clientId }),
      })

      setAnalyzing(prev => prev.filter(id => id !== tempId))

      if (res.ok) await load()
    }

    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
  }

  const rawCats: string[] = photos.map(p => p.ai_category ?? '').filter(c => c !== '')
  const categories: string[] = ['all', ...Array.from(new Set(rawCats))]
  const filtered = filter === 'all' ? photos : photos.filter(p => p.ai_category === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-white flex items-center gap-2">
            <Camera size={18} className="text-[#ec4899]" /> Galeria zdjęć
          </h1>
          <p className="text-[11px] text-white/40 mt-0.5">{photos.length} zdjęć z AI metadata</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all"
        >
          <Upload size={14} /> Wgraj zdjęcia
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      {/* Drop zone (shown when no photos) */}
      {photos.length === 0 && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/[0.12] rounded-[14px] p-16 text-center cursor-pointer hover:border-[#6366f1]/50 hover:bg-white/[0.02] transition-all"
        >
          <Upload size={28} className="text-white/20 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-white/40">Przeciągnij zdjęcia tutaj</p>
          <p className="text-[11px] text-white/25 mt-1">lub kliknij, aby wybrać pliki · PNG, JPG, WEBP</p>
        </div>
      )}

      {/* Upload progress */}
      {(uploading || analyzing.length > 0) && (
        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#6366f1]/10 border border-[#6366f1]/25">
          <Sparkles size={14} className="text-[#6366f1] animate-pulse flex-shrink-0" />
          <p className="text-[12px] text-[#a5b4fc]">
            Analizuję zdjęcia AI (GPT-4o Vision)...
          </p>
          <Loader2 size={13} className="animate-spin text-[#6366f1] ml-auto" />
        </div>
      )}

      {/* Filters */}
      {photos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-white/30" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                filter === cat
                  ? 'bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#a5b4fc]'
                  : 'bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'Wszystkie' : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-[12px] overflow-hidden bg-white/[0.04] border border-white/[0.07] group"
              onMouseEnter={() => setHoveredPhoto(photo.id)}
              onMouseLeave={() => setHoveredPhoto(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url_square ?? photo.original_url}
                alt={photo.ai_description ?? ''}
                className="w-full h-full object-cover"
              />

              {/* Hover overlay */}
              {hoveredPhoto === photo.id && (
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-2.5 transition-all">
                  {/* Top badges */}
                  <div className="flex items-start justify-between gap-1">
                    {photo.ai_category && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-semibold backdrop-blur-sm">
                        {CATEGORY_LABELS[photo.ai_category] ?? photo.ai_category}
                      </span>
                    )}
                    {photo.ai_mood && (
                      <span
                        className="px-2 py-0.5 rounded-full text-white text-[9px] font-semibold"
                        style={{ background: `${MOOD_COLORS[photo.ai_mood] ?? '#6366f1'}80` }}
                      >
                        {photo.ai_mood}
                      </span>
                    )}
                  </div>

                  {/* Bottom info */}
                  <div className="space-y-1">
                    {photo.ai_description && (
                      <p className="text-[9px] text-white/70 line-clamp-3 leading-relaxed">{photo.ai_description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {photo.ai_quality_score && (
                        <div className="flex items-center gap-1">
                          <Star size={9} className="text-amber-400" />
                          <span className="text-[9px] text-amber-400 font-semibold">{photo.ai_quality_score}/10</span>
                        </div>
                      )}
                      {photo.usage_count > 0 && (
                        <span className="text-[9px] text-white/40">użyto {photo.usage_count}×</span>
                      )}
                    </div>

                    {/* Color palette */}
                    {photo.ai_color_palette?.length > 0 && (
                      <div className="flex gap-1 pt-1">
                        {photo.ai_color_palette.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ background: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality score badge (always visible) */}
              {photo.ai_quality_score && hoveredPhoto !== photo.id && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-black/60 backdrop-blur-sm">
                  <Star size={8} className="text-amber-400" />
                  <span className="text-[8px] text-amber-400 font-bold">{photo.ai_quality_score}</span>
                </div>
              )}

              {photo.is_approved && hoveredPhoto !== photo.id && (
                <div className="absolute top-1.5 left-1.5">
                  <CheckCircle2 size={12} className="text-green-400 drop-shadow-lg" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={20} className="animate-spin text-[#6366f1]" />
        </div>
      )}
    </div>
  )
}
