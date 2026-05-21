'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Camera, FileText, Wand2, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, Tag, Target, Globe,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSClient, CSPost, CSPhoto } from '@/lib/content-studio/types'
import type { BrandVoiceDocument } from '@/lib/content-studio/types'

export default function ClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const [client, setClient] = useState<CSClient | null>(null)
  const [brandVoice, setBrandVoice] = useState<BrandVoiceDocument | null>(null)
  const [recentPosts, setRecentPosts] = useState<CSPost[]>([])
  const [photos, setPhotos] = useState<CSPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [clientRes, bvRes, postsRes, photosRes] = await Promise.all([
      supabase.from('cs_clients').select('*').eq('id', clientId).single(),
      supabase.from('cs_brand_voices').select('*').eq('client_id', clientId).single(),
      supabase.from('cs_posts').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
      supabase.from('cs_photos').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(6),
    ])
    setClient(clientRes.data)
    setBrandVoice(bvRes.data?.voice_document ?? null)
    setRecentPosts(postsRes.data ?? [])
    setPhotos(photosRes.data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-[#6366f1]" /></div>
  if (!client) return <div className="text-white/40">Klient nie znaleziony.</div>

  const hasBrandVoice = !!brandVoice

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center text-[18px] font-bold text-white"
            style={{ background: client.brand_colors?.primary ?? '#6366f1' }}
          >
            {client.business_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white">{client.business_name}</h1>
            <p className="text-[11px] text-white/40">{client.business_type} · {client.subscription_status}</p>
          </div>
        </div>
        <Link
          href={`/content-studio/clients/${clientId}/generate`}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Wand2 size={14} /> Generuj post
        </Link>
      </div>

      {/* Brand voice status */}
      {!hasBrandVoice ? (
        <div className="p-4 rounded-[14px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-white">Brand Voice nie ustawiony</p>
              <p className="text-[11px] text-white/50">Przejdź przez onboarding, aby AI mogło generować posty w stylu Twojej marki</p>
            </div>
          </div>
          <Link
            href={`/content-studio/onboarding`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[12px] font-semibold whitespace-nowrap hover:bg-amber-500/30 transition-all"
          >
            Onboarding <ChevronRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-[14px] bg-green-500/10 border border-green-500/25 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-white">Brand Voice aktywny</p>
            <p className="text-[11px] text-white/50 line-clamp-1">{brandVoice.business_summary}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Brand Voice summary */}
        {hasBrandVoice && (
          <div className="lg:col-span-2 p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-4">
            <p className="text-[13px] font-semibold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-[#a5b4fc]" /> Brand Voice
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag size={10} /> Ton komunikacji
                </p>
                <div className="flex flex-wrap gap-1">
                  {brandVoice.tone.keywords.map(k => (
                    <span key={k} className="px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] text-[10px] font-medium">{k}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Target size={10} /> Zakazane słowa
                </p>
                <div className="flex flex-wrap gap-1">
                  {brandVoice.forbidden_words.slice(0, 5).map(w => (
                    <span key={w} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium">{w}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-2">Filary contentu</p>
              <div className="space-y-1.5">
                {brandVoice.content_pillars.map((pillar, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-[8px] bg-white/[0.03]">
                    <span className="text-[10px] font-bold text-[#6366f1] mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-[12px] font-semibold text-white">{pillar.name}</p>
                      <p className="text-[10px] text-white/40">{pillar.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Globe size={10} /> Harmonogram
              </p>
              <p className="text-[12px] text-white/60">{brandVoice.posting_schedule.frequency} · {brandVoice.posting_schedule.platforms.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div className="space-y-2">
          {[
            { href: `/content-studio/clients/${clientId}/generate`, icon: Wand2, label: 'Generator postów', sub: 'Generuj 3 warianty AI', color: '#6366f1' },
            { href: `/content-studio/clients/${clientId}/photos`, icon: Camera, label: 'Galeria zdjęć', sub: `${photos.length} zdjęć`, color: '#ec4899' },
            { href: `/content-studio/clients/${clientId}/posts`, icon: FileText, label: 'Posty & Kalendarz', sub: `${recentPosts.length} postów`, color: '#22c55e' },
            { href: `/content-studio/clients/${clientId}/settings`, icon: Sparkles, label: 'Ustawienia', sub: 'Social & kolory', color: '#f59e0b' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#16213E] border border-white/[0.07] hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}1a` }}>
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">{item.label}</p>
                  <p className="text-[10px] text-white/35">{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent photos */}
      {photos.length > 0 && (
        <div className="p-4 rounded-[14px] bg-[#16213E] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-white">Ostatnie zdjęcia</p>
            <Link href={`/content-studio/clients/${clientId}/photos`} className="text-[11px] text-[#a5b4fc] hover:text-white transition-colors">
              Wszystkie →
            </Link>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded-[8px] overflow-hidden bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url_square ?? photo.original_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
