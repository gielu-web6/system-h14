import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getCompanyProfile, buildCompanyContext } from '@/lib/getCompanyProfile'
import { createClient } from '@/lib/supabase/server'
import { buildContext } from '@/lib/company-brain/context-builder'

async function scrapeUrl(url: string): Promise<string> {
  if (!url?.trim()) return ''
  try {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`
    const res = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!res.ok) return ''
    const html = await res.text()

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
    const metaDesc = metaMatch ? metaMatch[1].trim() : ''

    const headings: string[] = []
    const headingRe = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
    let m
    while ((m = headingRe.exec(html)) !== null && headings.length < 15) {
      const t = m[1].replace(/<[^>]+>/g, '').trim()
      if (t.length > 2) headings.push(t)
    }

    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    return [
      title     && `Tytuł: ${title}`,
      metaDesc  && `Opis: ${metaDesc}`,
      headings.length && `Nagłówki: ${headings.join(' | ')}`,
      body      && `Treść: ${body}`,
    ].filter(Boolean).join('\n').slice(0, 4500)
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { leadId, leadData } = await req.json()

    const [profile, supabaseData] = await Promise.all([
      getCompanyProfile(),
      leadId && !leadData
        ? createClient().then(s => s.from('leads').select('*').eq('id', leadId).single())
        : Promise.resolve({ data: null }),
    ])

    const companyCtx = buildCompanyContext(profile)
    let lead = leadData ?? supabaseData?.data

    if (!lead) {
      return NextResponse.json({ error: 'Brak danych leadu' }, { status: 400 })
    }

    // Scrape website and LinkedIn in parallel — don't block on failures
    const [websiteData, linkedinData] = await Promise.all([
      scrapeUrl(lead.company_website),
      scrapeUrl(lead.linkedin_url),
    ])

    // Build Company Brain context (non-blocking — enriches prompt with firm-specific data)
    const brainCtx = await buildContext('lead_scoring', {
      query: `Lead: ${lead.company ?? ''}, stanowisko: ${lead.position ?? ''}, branża: ${lead.industry ?? lead.segment ?? ''}`,
    }).catch(() => null)

    const scrapedContext = [
      websiteData && `\n--- DANE ZE STRONY WWW (${lead.company_website}) ---\n${websiteData}`,
      linkedinData && `\n--- DANE Z LINKEDIN ---\n${linkedinData}`,
    ].filter(Boolean).join('\n')

    const leadDesc = `
DANE PODSTAWOWE:
Imię i nazwisko: ${lead.first_name ?? ''} ${lead.last_name ?? ''}
Firma: ${lead.company ?? ''}
Stanowisko: ${lead.position ?? ''}
Branża: ${lead.industry ?? ''}
Segment: ${lead.segment ?? ''}
Sygnał zakupowy: ${lead.buying_signal ?? ''}
LinkedIn: ${lead.linkedin_url ?? '—'}
Strona www: ${lead.company_website ?? '—'}
Notatki: ${lead.notes ?? ''}
${scrapedContext}
`.trim()

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Jesteś doświadczonym ekspertem od sprzedaży B2B. Oceniasz leady dogłębnie — analizujesz dane podstawowe ORAZ treść strony www i profilu LinkedIn, żeby wyciągnąć wnioski których nie widać na pierwszy rzut oka.

${brainCtx?.contextString ?? ''}
DANE TWOJEJ FIRMY (firmy oceniającej leady):
${companyCtx}

KRYTERIA OCENY — każde kryterium 0-25 pkt:

1. ICP FIT (0-25)
   Czy lead pasuje do Ideal Customer Profile? Weź pod uwagę: branżę, wielkość firmy (sygnały ze strony: ilu pracowników, ilu klientów, skala działania), rolę decyzyjną osoby, rynek geograficzny, dojrzałość firmy.

2. SYGNAŁY ZAKUPOWE (0-25)
   Czy są sygnały że firma aktywnie szuka rozwiązania lub ma wyraźny ból? Weź pod uwagę: podany sygnał zakupowy, treść strony (problemy opisywane, FAQ, sekcja "czemu my"), opis stanowiska w LinkedIn (np. "scaling", "hiring", "automation"), aktualny etap wzrostu.

3. AKTYWNOŚĆ FIRMY (0-25)
   Jak aktywna i dynamiczna jest firma? Weź pod uwagę: bogactwo strony (ile treści, case studies, blog), świeżość informacji, liczba pracowników sygnalizowana na LinkedIn, aktywność social media, widoczne kampanie reklamowe lub nowe produkty.

4. POTENCJAŁ WARTOŚCI (0-25)
   Jak duży potencjał przychodu i długoterminowej współpracy? Weź pod uwagę: wielkość firmy, ceny ich produktów/usług (widoczne na stronie), rynek docelowy firmy (B2B/B2C, segmenty), możliwość upsell i retencji.

WAŻNE ZASADY:
- Używaj KONKRETNYCH danych ze strony i LinkedIn — nazw produktów, liczb, klientów, technologii
- Jeśli strona jest słaba/pusta — to też jest sygnał (niska aktywność)
- Nie powtarzaj danych podstawowych w reasoning — pisz co WYCZYTAŁEŚ ze strony/LinkedIn
- hot = total ≥ 70, warm = 40-69, cold < 40

Odpowiedz TYLKO poprawnym JSON-em (bez markdown):
{
  "icp_score": <0-25>,
  "signals_score": <0-25>,
  "activity_score": <0-25>,
  "potential_score": <0-25>,
  "total_score": <suma 4 powyższych, max 100>,
  "label": "hot" | "warm" | "cold",
  "problem": "<zidentyfikowany główny ból tej firmy który Twój klient może rozwiązać — konkretny, oparty o dane ze strony/LinkedIn, max 1 zdanie>",
  "icebreaker": "<spersonalizowana wiadomość otwierająca — odwołuje się do konkretnego faktu o firmie (produkt, klient, sekcja strony, stanowisko) — brzmi naturalnie, nie jak bot, po polsku, max 2 zdania>",
  "reasoning": "<co konkretnie wyczytałeś ze strony/LinkedIn i jak to wpłynęło na ocenę, po polsku, max 3 zdania>"
}`,
        },
        {
          role: 'user',
          content: leadDesc,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.2,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(raw)

    if (leadId) {
      const supabase = await createClient()
      await supabase.from('leads').update({
        ai_score_num:          result.total_score     ?? 0,
        ai_score_label:        result.label           ?? 'warm',
        ai_problem:            result.problem         ?? null,
        ai_icebreaker:         result.icebreaker      ?? null,
        ai_icp_score:          result.icp_score       ?? 0,
        ai_signals_score:      result.signals_score   ?? 0,
        ai_activity_score:     result.activity_score  ?? 0,
        ai_potential_score:    result.potential_score ?? 0,
        ai_reasoning:          result.reasoning       ?? null,
        ai_scored_at:          new Date().toISOString(),
      }).eq('id', leadId)
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('score-lead error:', err)
    return NextResponse.json({ error: 'Błąd scoringu AI' }, { status: 500 })
  }
}
