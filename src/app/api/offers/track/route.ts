import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAlert } from '@/lib/telegram'

const ENGAGEMENT_POINTS: Record<string, number> = {
  view:          15,
  section_price: 20,
  slider:        15,
  roi_calc:      25,
  hot_lead:      30,
  cta_click:     40,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      slug: string
      event_type: 'view' | 'section' | 'slider' | 'roi_calc' | 'time' | 'session_end' | 'cta_click'
      data?: Record<string, unknown>
      // session_end fields sent directly
      sessionId?: string
      timeOnSections?: Record<string, number>
      scrollDepth?: number
    }

    const { slug, event_type, data = {} } = body
    if (!slug) return NextResponse.json({ ok: false }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'

    const supabase = getSupabaseAdmin()

    const { data: offerPage } = await supabase
      .from('offer_pages')
      .select('id, deal_id, view_count, company_name')
      .eq('public_slug', slug)
      .single()

    if (!offerPage) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const offerPageId = offerPage.id
    const dealId = offerPage.deal_id

    // ── view ───────────────────────────────────────────────────────────────────
    if (event_type === 'view') {
      const sessionId = (data.sessionId as string) || body.sessionId

      // Get existing view for this session
      const viewQuery = sessionId
        ? supabase.from('offer_page_views').select('id, duration_seconds').eq('offer_page_id', offerPageId).eq('session_id', sessionId).limit(1).maybeSingle()
        : supabase.from('offer_page_views').select('id, duration_seconds').eq('offer_page_id', offerPageId).eq('ip_address', ip).order('created_at', { ascending: false }).limit(1).maybeSingle()

      const { data: existing } = await viewQuery

      if (!existing) {
        await supabase.from('offer_page_views').insert({
          offer_page_id: offerPageId,
          ip_address: ip,
          user_agent: req.headers.get('user-agent') ?? null,
          session_id: sessionId ?? null,
          duration_seconds: 0,
          sections_viewed: [],
          slider_interactions: 0,
          roi_calculator_used: false,
          pricing_variant_viewed: data.variant ?? null,
        })

        // Alert 2 — first open
        sendTelegramAlert({
          target: 'sales',
          message: `👀 <b>OFERTA OTWARTA</b>

👤 ${offerPage.company_name}
🕐 Czas: ${new Date().toLocaleTimeString('pl-PL')}

<b>DZWOŃ TERAZ.</b>`,
        }).catch(() => {})
      }

      await supabase
        .from('offer_pages')
        .update({
          view_count: (offerPage.view_count ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
          status: 'viewed',
        })
        .eq('id', offerPageId)

      // Hot lead check: 3+ views in last hour from same IP
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('offer_page_views')
        .select('*', { count: 'exact', head: true })
        .eq('offer_page_id', offerPageId)
        .eq('ip_address', ip)
        .gte('created_at', oneHourAgo)

      if ((count ?? 0) >= 3 && dealId) {
        await Promise.all([
          supabase.from('deals').update({
            is_hot: true,
            hot_reason: 'Sprawdza ofertę wielokrotnie',
          }).eq('id', dealId),
          supabase.from('notifications').insert({
            deal_id: dealId,
            type: 'hot_lead',
            title: 'Gorący lead!',
            body: `Klient otworzył ofertę ${count} razy w ciągu ostatniej godziny`,
            priority: 'urgent',
            is_read: false,
          }),
        ])
        if (dealId) await incrementEngagement(dealId, ENGAGEMENT_POINTS.hot_lead)
      }

      if (dealId) await incrementEngagement(dealId, ENGAGEMENT_POINTS.view)

      // Broadcast via Supabase Realtime
      try {
        await supabase.channel('offer-tracking').send({
          type: 'broadcast',
          event: 'offer_viewed',
          payload: {
            offerId: offerPageId,
            clientName: offerPage.company_name,
            eventType: 'view',
            timestamp: new Date().toISOString(),
          },
        })
      } catch { /* Realtime broadcast is best-effort */ }
    }

    // ── section ────────────────────────────────────────────────────────────────
    if (event_type === 'section') {
      const section = (data.section as string) ?? ''
      const { data: view } = await supabase
        .from('offer_page_views')
        .select('id, sections_viewed')
        .eq('offer_page_id', offerPageId)
        .eq('ip_address', ip)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (view) {
        const prev: string[] = Array.isArray(view.sections_viewed) ? view.sections_viewed : []
        if (!prev.includes(section)) {
          await supabase
            .from('offer_page_views')
            .update({ sections_viewed: [...prev, section] })
            .eq('id', view.id)

          if (section === 'pricing' && dealId) {
            await incrementEngagement(dealId, ENGAGEMENT_POINTS.section_price)
          }
        }
      }

      const { data: op } = await supabase
        .from('offer_pages')
        .select('sections_viewed')
        .eq('id', offerPageId)
        .single()
      const prevSections = (op?.sections_viewed ?? {}) as Record<string, number>
      prevSections[section] = (prevSections[section] ?? 0) + 1
      await supabase.from('offer_pages').update({ sections_viewed: prevSections }).eq('id', offerPageId)
    }

    // ── slider ─────────────────────────────────────────────────────────────────
    if (event_type === 'slider') {
      const { data: view } = await supabase
        .from('offer_page_views')
        .select('id, slider_interactions')
        .eq('offer_page_id', offerPageId)
        .eq('ip_address', ip)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (view) {
        await supabase
          .from('offer_page_views')
          .update({ slider_interactions: (view.slider_interactions ?? 0) + 1 })
          .eq('id', view.id)
      }
      if (dealId) await incrementEngagement(dealId, ENGAGEMENT_POINTS.slider)
    }

    // ── roi_calc ───────────────────────────────────────────────────────────────
    if (event_type === 'roi_calc') {
      const { data: view } = await supabase
        .from('offer_page_views')
        .select('id')
        .eq('offer_page_id', offerPageId)
        .eq('ip_address', ip)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (view) {
        await supabase.from('offer_page_views').update({ roi_calculator_used: true }).eq('id', view.id)
      }
      if (dealId) await incrementEngagement(dealId, ENGAGEMENT_POINTS.roi_calc)
    }

    // ── time ───────────────────────────────────────────────────────────────────
    if (event_type === 'time') {
      const seconds = Number(data.seconds ?? 0)
      const { data: view } = await supabase
        .from('offer_page_views')
        .select('id')
        .eq('offer_page_id', offerPageId)
        .eq('ip_address', ip)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (view) {
        await supabase.from('offer_page_views').update({ duration_seconds: seconds }).eq('id', view.id)
      }
    }

    // ── session_end ────────────────────────────────────────────────────────────
    if (event_type === 'session_end') {
      const timeOnSections = (data.timeOnSections ?? body.timeOnSections ?? {}) as Record<string, number>
      const scrollDepth = Number(data.scrollDepth ?? body.scrollDepth ?? 0)
      const sessionId = (data.sessionId as string) || body.sessionId

      const viewQuery = sessionId
        ? supabase.from('offer_page_views').select('id').eq('offer_page_id', offerPageId).eq('session_id', sessionId).limit(1).maybeSingle()
        : supabase.from('offer_page_views').select('id').eq('offer_page_id', offerPageId).eq('ip_address', ip).order('created_at', { ascending: false }).limit(1).maybeSingle()

      const { data: view } = await viewQuery

      if (view) {
        await supabase
          .from('offer_page_views')
          .update({ time_on_sections: timeOnSections, scroll_depth: scrollDepth })
          .eq('id', view.id)
      }

      // Key sections with Polish labels and their notification types
      const KEY_SECTIONS: Record<string, { label: string; type: string; priority: 'high' | 'normal' }> = {
        pricing:  { label: 'wyceny',            type: 'pricing_attention', priority: 'high' },
        solution: { label: 'rozwiązania',        type: 'section_time',      priority: 'normal' },
        timeline: { label: 'harmonogramu',       type: 'section_time',      priority: 'normal' },
        loss:     { label: 'kalkulatora strat',  type: 'section_time',      priority: 'normal' },
      }

      const NOTIFY_THRESHOLD = 30  // seconds — insert notification
      const TELEGRAM_THRESHOLD = 60 // seconds — also send Telegram

      const hotSections = Object.entries(KEY_SECTIONS)
        .map(([section, cfg]) => ({ section, ...cfg, seconds: Number(timeOnSections[section] ?? 0) }))
        .filter(s => s.seconds >= NOTIFY_THRESHOLD)
        .sort((a, b) => b.seconds - a.seconds)

      if (hotSections.length > 0 && dealId) {
        const timeStr = (secs: number) => {
          const m = Math.floor(secs / 60)
          const s = secs % 60
          return m > 0 ? `${m} min ${s}s` : `${s}s`
        }
        const nowStr = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

        await Promise.all(hotSections.map(({ section: _s, label, type, priority, seconds }) =>
          supabase.from('notifications').insert({
            deal_id: dealId,
            type,
            title: type === 'pricing_attention'
              ? 'Klient intensywnie przegląda cennik'
              : `Klient czyta sekcję: ${label}`,
            body: `${offerPage.company_name} — ${timeStr(seconds)} na sekcji ${label}. Godz. ${nowStr}`,
            priority,
            is_read: false,
          })
        ))

        // Telegram for the most-engaged section at 60s+ threshold
        const top = hotSections[0]
        if (top.seconds >= TELEGRAM_THRESHOLD) {
          const emoji = top.section === 'pricing' ? '💰' : '📊'
          sendTelegramAlert({
            target: 'sales',
            message: `${emoji} <b>KLIENT NA STRONIE OFERTY</b>

👤 ${offerPage.company_name}
📑 Sekcja: ${top.label}
⏱ Czas: ${timeStr(top.seconds)}

<b>Działaj teraz!</b>`,
          }).catch(() => {})
        }

        // Broadcast for real-time updates in offer-generator
        try {
          await supabase.channel('offer-tracking').send({
            type: 'broadcast',
            event: 'section_time',
            payload: {
              offerId: offerPageId,
              clientName: offerPage.company_name,
              sections: hotSections.map(s => ({ section: s.section, label: s.label, seconds: s.seconds })),
              timestamp: new Date().toISOString(),
            },
          })
        } catch { /* best-effort */ }
      }
    }

    // ── cta_click ──────────────────────────────────────────────────────────────
    if (event_type === 'cta_click') {
      const now = new Date().toISOString()
      const sessionId = (data.sessionId as string) || body.sessionId

      const viewQuery = sessionId
        ? supabase.from('offer_page_views').select('id').eq('offer_page_id', offerPageId).eq('session_id', sessionId).limit(1).maybeSingle()
        : supabase.from('offer_page_views').select('id').eq('offer_page_id', offerPageId).eq('ip_address', ip).order('created_at', { ascending: false }).limit(1).maybeSingle()

      const { data: view } = await viewQuery

      if (view) {
        await supabase
          .from('offer_page_views')
          .update({ cta_clicked: true, cta_clicked_at: now })
          .eq('id', view.id)
      }

      await supabase
        .from('offer_pages')
        .update({ cta_clicked: true, cta_clicked_at: now, status: 'cta_clicked' })
        .eq('id', offerPageId)

      if (dealId) {
        await supabase.from('notifications').insert({
          deal_id: dealId,
          type: 'cta_clicked',
          title: 'Klient kliknął "Akceptuję ofertę"!',
          body: `${offerPage.company_name} jest gotowy do zamknięcia dealu — działaj teraz!`,
          priority: 'urgent',
          is_read: false,
        })
        await incrementEngagement(dealId, ENGAGEMENT_POINTS.cta_click)
      }

      // Broadcast
      try {
        await supabase.channel('offer-tracking').send({
          type: 'broadcast',
          event: 'cta_clicked',
          payload: {
            offerId: offerPageId,
            clientName: offerPage.company_name,
            timestamp: now,
          },
        })
      } catch { /* best-effort */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function incrementEngagement(dealId: string, points: number): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from('deals')
    .select('engagement_score')
    .eq('id', dealId)
    .single()
  const current = Number(data?.engagement_score ?? 0)
  const next = Math.min(100, current + points)
  await getSupabaseAdmin().from('deals').update({ engagement_score: next }).eq('id', dealId)
}
