import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'
import type { ConfiguratorState } from '@/lib/configurator/types'

export async function POST(req: NextRequest) {
  try {
    const state: ConfiguratorState = await req.json()

    const supabase = getSupabaseAdmin()

    const { data: lead, error } = await supabase
      .from('configurator_leads')
      .insert({
        first_name: state.firstName,
        last_name: state.lastName,
        email: state.email,
        phone: state.phone,
        company: state.agencyName,
        team_size: state.teamSize,
        challenges: state.challenges,
        modules: state.modules,
        additional_services: state.additionalServices,
        setup_price_min: state.setupPriceMin,
        setup_price_max: state.setupPriceMax,
        monthly_price_min: state.monthlyPriceMin,
        monthly_price_max: state.monthlyPriceMax,
        source: 'configurator',
      })
      .select()
      .single()

    if (error) {
      // Silently ignore DB errors — the Telegram alert is the priority
      console.error('[lead] DB insert error:', error)
    }

    const priceRange =
      state.setupPriceMin && state.setupPriceMax
        ? `${state.setupPriceMin.toLocaleString('pl-PL')}–${state.setupPriceMax.toLocaleString('pl-PL')} PLN`
        : 'brak wyceny'

    await sendTelegramAlert({
      target: 'both',
      message: `🔥 <b>NOWY LEAD z konfiguratora</b>

👤 ${state.firstName} ${state.lastName}
🏢 ${state.agencyName || 'brak nazwy'}
📧 ${state.email}
📞 ${state.phone || 'brak'}
👥 Zespół: ${state.teamSize || '—'}

💰 Wycena: ${priceRange}
🔧 Moduły: ${Object.entries(state.modules)
  .filter(([, v]) => v === true || (typeof v === 'object' && (v as { enabled?: boolean }).enabled))
  .map(([k]) => k)
  .join(', ') || '—'}

⚡ Zadzwoń w ciągu 5 minut.`,
    })

    return NextResponse.json({ ok: true, leadId: lead?.id ?? null })
  } catch (err) {
    console.error('[lead] Error:', err)
    // Return 200 so the configurator UI doesn't break on error
    return NextResponse.json({ ok: false })
  }
}
