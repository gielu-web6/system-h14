import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { UNIVERSAL_PROMPT } from '@/app/api/company-brain/files/[id]/process/route'

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 7000)
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL jest wymagany' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Nieprawidłowy URL' }, { status: 400 })
    }

    const fetchRes = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; H14-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `Nie można pobrać strony (HTTP ${fetchRes.status})` },
        { status: 400 },
      )
    }

    const html = await fetchRes.text()
    const text = htmlToText(html)

    if (!text.trim()) {
      return NextResponse.json({ error: 'Brak tekstu do analizy na stronie' }, { status: 400 })
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `${UNIVERSAL_PROMPT}\n\nŹródło: strona WWW firmy (${parsedUrl.hostname})\n\nTekst strony:\n${text}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const extracted = JSON.parse(
      response.choices[0].message.content ?? '{}',
    ) as Record<string, unknown>

    // Return draft only — do NOT save to DB. Let user review first.
    return NextResponse.json({ extracted, url: parsedUrl.toString() })
  } catch (err) {
    console.error('[fill-from-url] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Błąd analizy strony' },
      { status: 500 },
    )
  }
}
