'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Settings, Save, Loader2,
  Globe, Palette, Link2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CSClient } from '@/lib/content-studio/types'

function PlatformIcon({ id }: { id: string }) {
  const labels: Record<string, string> = { instagram: 'IG', facebook: 'FB', linkedin: 'LI', google_business: 'GMB' }
  const colors: Record<string, string> = { instagram: '#e1306c', facebook: '#1877f2', linkedin: '#0077b5', google_business: '#4285f4' }
  return <span style={{ fontSize: 10, fontWeight: 800, color: colors[id] ?? '#6366f1' }}>{labels[id] ?? id}</span>
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c', desc: 'Instagram Business Account' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2', desc: 'Facebook Page' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0077b5', desc: 'Company Page' },
  { id: 'google_business', label: 'Google Business', color: '#4285f4', desc: 'Google My Business' },
]

export default function SettingsPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<CSClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [accentColor, setAccentColor] = useState('#a5b4fc')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('cs_clients').select('*').eq('id', clientId).single()
    if (data) {
      setClient(data)
      setBusinessName(data.business_name)
      setLogoUrl(data.logo_url ?? '')
      setPrimaryColor(data.brand_colors?.primary ?? '#6366f1')
      setSecondaryColor(data.brand_colors?.secondary ?? '#ffffff')
      setAccentColor(data.brand_colors?.accent ?? '#a5b4fc')
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function saveSettings() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('cs_clients')
      .update({
        business_name: businessName,
        logo_url: logoUrl || null,
        brand_colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-[#6366f1]" /></div>
  if (!client) return <div className="text-white/40">Klient nie znaleziony.</div>

  const socialAccounts = (client.social_accounts ?? {}) as Record<string, { connected?: boolean; account_id?: string }>

  return (
    <div className="max-w-[640px] space-y-5">
      <div>
        <h1 className="text-[18px] font-bold text-white flex items-center gap-2">
          <Settings size={18} className="text-[#f59e0b]" /> Ustawienia klienta
        </h1>
        <p className="text-[11px] text-white/40 mt-0.5">{client.business_name}</p>
      </div>

      {/* Basic info */}
      <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-4">
        <p className="text-[13px] font-semibold text-white">Podstawowe informacje</p>

        <div>
          <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">Nazwa firmy</label>
          <input
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            className="w-full px-3 py-2 rounded-[9px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">URL logo</label>
          <input
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-[9px] bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[13px] focus:outline-none focus:border-[#6366f1]/50 transition-all"
          />
        </div>
      </div>

      {/* Brand colors */}
      <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-4">
        <p className="text-[13px] font-semibold text-white flex items-center gap-2">
          <Palette size={14} className="text-[#a5b4fc]" /> Kolory marki
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Główny', value: primaryColor, setter: setPrimaryColor },
            { label: 'Drugorzędny', value: secondaryColor, setter: setSecondaryColor },
            { label: 'Akcent', value: accentColor, setter: setAccentColor },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-8 h-8 rounded-[6px] border-0 cursor-pointer bg-transparent"
                />
                <input
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-white text-[11px] font-mono focus:outline-none focus:border-[#6366f1]/50 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2 p-3 rounded-[9px] bg-white/[0.02] border border-white/[0.06]">
          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: primaryColor }} />
          <div className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20" style={{ background: secondaryColor }} />
          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
          <p className="text-[11px] text-white/40 ml-1">Podgląd kolorów</p>
        </div>
      </div>

      {/* Social connections */}
      <div className="p-5 rounded-[14px] bg-[#16213E] border border-white/[0.07] space-y-3">
        <p className="text-[13px] font-semibold text-white flex items-center gap-2">
          <Link2 size={14} className="text-[#a5b4fc]" /> Połączenia social media
        </p>
        <p className="text-[11px] text-white/40">Połącz konta, aby publikować posty bezpośrednio z Content Studio</p>

        <div className="space-y-2">
          {SOCIAL_PLATFORMS.map(plat => {
            const isConnected = !!(socialAccounts[plat.id]?.connected || socialAccounts[plat.id]?.account_id)
            return (
              <div
                key={plat.id}
                className="flex items-center justify-between p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: `${plat.color}20` }}>
                    <PlatformIcon id={plat.id} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{plat.label}</p>
                    <p className="text-[10px] text-white/35">{plat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30">
                      <CheckCircle2 size={10} className="text-green-400" />
                      <span className="text-[10px] font-semibold text-green-400">Połączony</span>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border border-white/[0.12] text-white/60 text-[11px] font-medium hover:bg-white/[0.06] hover:text-white transition-all"
                      onClick={() => alert(`OAuth flow dla ${plat.label} — wymaga skonfigurowania App w ${plat.label} Developer Console`)}
                    >
                      <Link2 size={10} /> Połącz
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-[9px] bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-300/70 leading-relaxed">
            Połączenie wymaga skonfigurowania OAuth w Meta for Developers, LinkedIn Developers i Google My Business. Szczegółowe instrukcje w dokumentacji.
          </p>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
      >
        {saving ? (
          <><Loader2 size={14} className="animate-spin" /> Zapisywanie...</>
        ) : saved ? (
          <><CheckCircle2 size={14} className="text-green-300" /> Zapisano!</>
        ) : (
          <><Save size={14} /> Zapisz ustawienia</>
        )}
      </button>
    </div>
  )
}
